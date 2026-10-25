import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as planPOST } from "@/app/api/plan/route";
import { POST as changePOST } from "@/app/api/change/route";
import { POST as ideasPOST } from "@/app/api/ideas/route";
import { POST as messagesPOST } from "@/app/api/messages/route";
import { resetRateLimitForTests } from "@/lib/rateLimit";
import { PRESET_WEDDING } from "@/templates/presets";
import type { EventPlan } from "@/engine/types";

let ipCounter = 0;
function post(path: string, body: unknown, opts: { raw?: string; ip?: string } = {}) {
  const ip = opts.ip ?? `10.0.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`;
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip },
    body: opts.raw ?? JSON.stringify(body),
  });
}

const clonePlan = (): EventPlan => JSON.parse(JSON.stringify(PRESET_WEDDING));

describe("API routes: validation, size limits and rate limits (offline fallback mode)", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    resetRateLimitForTests();
    delete process.env.GEMINI_API_KEY; // forces the offline rule-based path, no network
  });
  afterEach(() => {
    if (originalKey !== undefined) process.env.GEMINI_API_KEY = originalKey;
  });

  describe("POST /api/plan", () => {
    it("builds a plan from plain text", async () => {
      const res = await planPOST(post("/api/plan", { promptText: "Birthday party in Raipur, 40 guests, budget 30000", language: "en" }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.plan.type).toBe("birthday");
      expect(json.source).toBe("offline_backup");
      expect(json.cached).toBe(false);
    });

    it("rejects a language that is not en / hinglish / hi", async () => {
      const res = await planPOST(post("/api/plan", { promptText: "wedding 100 guests", language: "fr" }));
      expect(res.status).toBe(400);
    });

    it("rejects an oversized body with 413", async () => {
      const res = await planPOST(post("/api/plan", { promptText: "x".repeat(40_000) }));
      expect(res.status).toBe(413);
    });

    it("rejects broken JSON and non-object JSON with 400", async () => {
      expect((await planPOST(post("/api/plan", null, { raw: "{not json" }))).status).toBe(400);
      expect((await planPOST(post("/api/plan", null, { raw: "[1,2,3]" }))).status).toBe(400);
      expect((await planPOST(post("/api/plan", null, { raw: "" }))).status).toBe(400);
    });

    it("rejects a prompt that is too long and an empty request", async () => {
      expect((await planPOST(post("/api/plan", { promptText: "y".repeat(2500) }))).status).toBe(400);
      expect((await planPOST(post("/api/plan", {}))).status).toBe(400);
    });

    it("accepts structured input without using the AI limit", async () => {
      const res = await planPOST(
        post("/api/plan", {
          structuredInput: {
            eventType: "wedding",
            title: "Test Shadi",
            eventDate: "2026-12-10",
            invitedGuests: 100,
            totalBudget: 500000,
          },
        })
      );
      expect(res.status).toBe(200);
    });

    it("answers 429 with Retry-After after too many AI-backed requests from one address", async () => {
      const ip = "172.16.0.5";
      let last: Response | undefined;
      for (let i = 0; i < 11; i++) {
        last = await planPOST(post("/api/plan", { promptText: `Birthday party ${i}, 20 guests, 10000 budget` }, { ip }));
      }
      expect(last!.status).toBe(429);
      expect(Number(last!.headers.get("Retry-After"))).toBeGreaterThan(0);
    });
  });

  describe("POST /api/change", () => {
    it("applies a direct action to a valid plan", async () => {
      const res = await changePOST(
        post("/api/change", { plan: clonePlan(), directActions: [{ action: "add_guests", extraInvited: 20 }], todayIso: "2026-10-25" })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.updatedPlan.version).toBe(PRESET_WEDDING.version + 1);
      expect(json.actions).toHaveLength(1);
    });

    it("parses plain change text with the offline parser", async () => {
      const res = await changePOST(post("/api/change", { plan: clonePlan(), changeText: "cut budget by 15%" }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe("offline_backup");
      expect(json.actions[0]).toEqual({ action: "cut_or_grow_budget_pct", pctDelta: -15 });
    });

    it("rejects a missing plan", async () => {
      expect((await changePOST(post("/api/change", { changeText: "hi" }))).status).toBe(400);
    });

    it("rejects a plan with the wrong shape (budgetItems is not a list)", async () => {
      const plan = { ...clonePlan(), budgetItems: "lots" };
      expect((await changePOST(post("/api/change", { plan }))).status).toBe(400);
    });

    it("rejects negative or absurd money in the plan", async () => {
      const bad = clonePlan();
      bad.budgetItems[0].plannedAmount = -5;
      expect((await changePOST(post("/api/change", { plan: bad }))).status).toBe(400);

      const huge = clonePlan();
      huge.totalBudget = 9e15;
      expect((await changePOST(post("/api/change", { plan: huge }))).status).toBe(400);
    });

    it("rejects a plan with an unknown language or event type", async () => {
      const a = { ...clonePlan(), language: "fr" };
      const b = { ...clonePlan(), type: "concert" };
      expect((await changePOST(post("/api/change", { plan: a }))).status).toBe(400);
      expect((await changePOST(post("/api/change", { plan: b }))).status).toBe(400);
    });

    it("rejects too many items and over-long strings", async () => {
      const many = clonePlan();
      many.checklist = Array.from({ length: 300 }, (_, i) => ({ ...PRESET_WEDDING.checklist[0], id: `t${i}` }));
      expect((await changePOST(post("/api/change", { plan: many }))).status).toBe(400);

      const long = clonePlan();
      long.title = "T".repeat(500);
      expect((await changePOST(post("/api/change", { plan: long }))).status).toBe(400);
    });

    it("rejects bad direct actions", async () => {
      const bad = [
        [{ action: "launch_rocket" }],
        [{ action: "add_guests", extraInvited: "many" }],
        [{ action: "change_total_budget", newTotalBudget: -1 }],
        [{ action: "add_guests", extraInvited: 5, sneaky: true }],
        Array.from({ length: 21 }, () => ({ action: "add_guests", extraInvited: 1 })),
      ];
      for (const directActions of bad) {
        const res = await changePOST(post("/api/change", { plan: clonePlan(), directActions }));
        expect(res.status).toBe(400);
      }
    });

    it("rejects a badly formatted or impossible todayIso", async () => {
      for (const todayIso of ["25-10-2026", "2026-13-40", "yesterday", "2026-02-30"]) {
        const res = await changePOST(post("/api/change", { plan: clonePlan(), todayIso }));
        expect(res.status).toBe(400);
      }
    });

    it("rejects an oversized body with 413", async () => {
      const plan = clonePlan();
      plan.preferences.notes = "n".repeat(400_000);
      const res = await changePOST(post("/api/change", { plan }));
      expect(res.status).toBe(413);
    });
  });

  describe("POST /api/ideas and /api/messages", () => {
    it("ideas: returns ideas for a valid plan", async () => {
      const res = await ideasPOST(post("/api/ideas", { plan: clonePlan(), followUp: "less spend", language: "hinglish" }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ideas.themes.length).toBeGreaterThan(0);
    });

    it("ideas: rejects a bad plan and a bad language", async () => {
      expect((await ideasPOST(post("/api/ideas", { plan: { id: "x" } }))).status).toBe(400);
      expect((await ideasPOST(post("/api/ideas", { plan: clonePlan(), language: "de" }))).status).toBe(400);
    });

    it("messages: returns five drafts with WhatsApp links", async () => {
      const res = await messagesPOST(post("/api/messages", { plan: clonePlan() }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.messages).toHaveLength(5);
      expect(json.whatsappLinks[0].link.startsWith("https://wa.me/?text=")).toBe(true);
    });

    it("messages: rejects a bad plan and a malformed previewDiff", async () => {
      expect((await messagesPOST(post("/api/messages", {}))).status).toBe(400);
      expect((await messagesPOST(post("/api/messages", { plan: clonePlan(), previewDiff: { budgetChanges: "no" } }))).status).toBe(400);
    });
  });
});