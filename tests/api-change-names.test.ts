import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

const { generateContentMock } = vi.hoisted(() => ({ generateContentMock: vi.fn() }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
}));

import { POST as changePOST } from "@/app/api/change/route";
import { resetRateLimitForTests } from "@/lib/rateLimit";
import { clearAICacheForTests } from "@/ai/gemini";
import { PRESET_WEDDING } from "@/templates/presets";
import { calculateGuestPlates } from "@/engine/guests";
import type { EventPlan } from "@/engine/types";

let n = 0;
function post(body: unknown) {
  return new NextRequest("http://localhost/api/change", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": `10.9.0.${(n++ % 200) + 1}` },
    body: JSON.stringify(body),
  });
}

function plan(): EventPlan {
  const p: EventPlan = JSON.parse(JSON.stringify(PRESET_WEDDING));
  const mk = (id: string, name: string, c: number) => ({
    id,
    name,
    dateTime: "2026-12-23 11:00",
    guests: calculateGuestPlates(c, 0.15, 10),
  });
  p.subEvents = [mk("custom-se-1", "Haldi", 250), mk("custom-se-2", "Sangeet", 175), mk("custom-se-3", "Shaadi", 175)];
  return p;
}

describe("POST /api/change: program names from the AI", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetRateLimitForTests();
    clearAICacheForTests();
    generateContentMock.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  });

  it("applies the change to Haldi even when the AI answers with the name instead of the id", async () => {
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        actions: [{ action: "change_guests", subEventId: "Haldi", newInvitedCount: 180 }],
        plainExplanation: "Haldi guests are now 180.",
      }),
    });
    const res = await changePOST(post({ plan: plan(), changeText: "guests 250 se 180 ho gaye" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.source).toBe("ai");
    expect(json.actions).toEqual([{ action: "change_guests", subEventId: "custom-se-1", newInvitedCount: 180 }]);
    expect(json.updatedPlan.subEvents[0].guests.invited).toBe(180);
    expect(json.updatedPlan.subEvents[1].guests.invited).toBe(175);
    // the model was given the id list
    const prompt = JSON.stringify(generateContentMock.mock.calls[0][0]);
    expect(prompt).toContain("custom-se-1 | Haldi | 250");
  });

  it("gives a plain message (and changes nothing) when the AI names a program that does not exist", async () => {
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        actions: [{ action: "change_guests", subEventId: "Garba Night", newInvitedCount: 90 }],
        plainExplanation: "x",
      }),
    });
    const res = await changePOST(post({ plan: plan(), changeText: "garba mein 90 log" }));
    const json = await res.json();
    expect(json.updatedPlan.subEvents.map((s: { guests: { invited: number } }) => s.guests.invited)).toEqual([250, 175, 175]);
    expect(json.preview.plainSummaryMessages.join(" ")).toContain('Could not find a program called "Garba Night"');
  });

  it("falls back to the offline parser and still gets 'guests 250 se 180 ho gaye' right when Gemini is down", async () => {
    generateContentMock.mockRejectedValue(Object.assign(new Error("high demand"), { name: "ApiError", status: 503 }));
    const res = await changePOST(post({ plan: plan(), changeText: "guests 250 se 180 ho gaye" }));
    const json = await res.json();
    expect(json.source).toBe("offline_backup");
    expect(generateContentMock).toHaveBeenCalledTimes(3); // 3 attempts before giving up
    expect(json.actions).toHaveLength(1);
    expect(json.updatedPlan.subEvents[0].guests.invited).toBe(180);
    expect(json.updatedPlan.subEvents[2].guests.invited).toBe(175);
  });

  it("exports a function limit long enough for the retries", async () => {
    const mod = await import("@/app/api/change/route");
    expect((mod as { maxDuration?: number }).maxDuration).toBe(30);
  });
});
