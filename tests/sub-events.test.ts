import { describe, it, expect } from "vitest";
import { lookupSubEvents, resolveSubEventRefs, findMentionedSubEvents } from "@/engine/subEvents";
import { previewLifeChanges } from "@/engine/changes";
import { buildChangeActionsPrompt } from "@/ai/prompts";
import { PRESET_WEDDING } from "@/templates/presets";
import { calculateGuestPlates } from "@/engine/guests";
import type { EventPlan, SubEvent } from "@/engine/types";

function sub(id: string, name: string, invited: number): SubEvent {
  return {
    id,
    name,
    dateTime: "2026-12-23 11:00",
    guests: calculateGuestPlates(invited, 0.15, 10),
  };
}

/** A wedding shaped like the live site's: ids are custom-se-N, names are what the user typed. */
function weddingPlan(): EventPlan {
  const plan: EventPlan = JSON.parse(JSON.stringify(PRESET_WEDDING));
  plan.subEvents = [
    sub("custom-se-1", "Haldi", 250),
    sub("custom-se-2", "Sangeet", 175),
    sub("custom-se-3", "Shaadi", 175),
  ];
  return plan;
}

function realPlan(): EventPlan {
  const plan: EventPlan = JSON.parse(JSON.stringify(PRESET_WEDDING));
  plan.subEvents = [
    sub("we-1", "Haldi & Mehendi", 150),
    sub("we-2", "Sangeet / Ring Ceremony", 150),
    sub("we-3", "Main Wedding & Reception", 150),
  ];
  return plan;
}

const ids = (r: ReturnType<typeof lookupSubEvents>) => (r.ok ? r.ids : []);

describe("sub-event name -> id resolver", () => {
  it("keeps a real id as it is", () => {
    expect(ids(lookupSubEvents(weddingPlan(), "custom-se-2"))).toEqual(["custom-se-2"]);
  });

  it("maps a plain name, case-insensitively", () => {
    const plan = weddingPlan();
    expect(ids(lookupSubEvents(plan, "Haldi"))).toEqual(["custom-se-1"]);
    expect(ids(lookupSubEvents(plan, "haldi"))).toEqual(["custom-se-1"]);
    expect(ids(lookupSubEvents(plan, "  SANGEET "))).toEqual(["custom-se-2"]);
  });

  it("maps wedding aliases (Shaadi / Wedding / Vivah / Phere) to the wedding program", () => {
    const plan = weddingPlan();
    for (const word of ["Shaadi", "shadi", "Wedding", "vivah", "Phere"]) {
      expect(ids(lookupSubEvents(plan, word)), word).toEqual(["custom-se-3"]);
    }
  });

  it("maps Hindi names", () => {
    const plan = weddingPlan();
    expect(ids(lookupSubEvents(plan, "हल्दी"))).toEqual(["custom-se-1"]);
    expect(ids(lookupSubEvents(plan, "संगीत"))).toEqual(["custom-se-2"]);
    expect(ids(lookupSubEvents(plan, "शादी"))).toEqual(["custom-se-3"]);
  });

  it("works with the template names too ('Haldi & Mehendi', 'Main Wedding & Reception')", () => {
    const plan = realPlan();
    expect(ids(lookupSubEvents(plan, "Haldi"))).toEqual(["we-1"]);
    expect(ids(lookupSubEvents(plan, "mehndi"))).toEqual(["we-1"]);
    expect(ids(lookupSubEvents(plan, "Wedding"))).toEqual(["we-3"]);
    expect(ids(lookupSubEvents(plan, "reception"))).toEqual(["we-3"]);
    expect(ids(lookupSubEvents(plan, "engagement"))).toEqual(["we-2"]);
    expect(ids(lookupSubEvents(plan, "Ring Ceremony"))).toEqual(["we-2"]);
  });

  it("treats 'all' / 'sab' as every program, and an empty reference as every program", () => {
    expect(ids(lookupSubEvents(weddingPlan(), "all"))).toHaveLength(3);
    expect(ids(lookupSubEvents(weddingPlan(), "sab"))).toHaveLength(3);
    expect(ids(lookupSubEvents(weddingPlan(), ""))).toHaveLength(3);
  });

  it("gives a clear plain message listing the real programs when nothing matches", () => {
    const res = lookupSubEvents(weddingPlan(), "Mehndi Night Out");
    // 'mehndi' is a known word but this plan has no mehendi program, and nothing else matches
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toContain('Could not find a program called "Mehndi Night Out"');
      expect(res.message).toContain('"Haldi"');
      expect(res.message).toContain('"Shaadi"');
    }
    expect(lookupSubEvents(weddingPlan(), "xyz-123").ok).toBe(false);
  });

  it("finds programs mentioned in a sentence", () => {
    const plan = weddingPlan();
    expect(findMentionedSubEvents(plan, "haldi mein 120 log").map((s) => s.id)).toEqual(["custom-se-1"]);
    expect(findMentionedSubEvents(plan, "shaadi wale din 300 guests").map((s) => s.id)).toEqual(["custom-se-3"]);
    expect(findMentionedSubEvents(plan, "guests 250 se 180 ho gaye")).toEqual([]);
  });
});

describe("resolveSubEventRefs", () => {
  it("rewrites a name the AI returned into the real id", () => {
    const plan = weddingPlan();
    const out = resolveSubEventRefs(plan, [{ action: "change_guests", subEventId: "Haldi", newInvitedCount: 180 }]);
    expect(out).toEqual([{ action: "change_guests", subEventId: "custom-se-1", newInvitedCount: 180 }]);
  });

  it("leaves actions without a program, and unknown programs, untouched", () => {
    const plan = weddingPlan();
    const actions = [
      { action: "change_total_budget", newTotalBudget: 600000 },
      { action: "change_guests", subEventId: "Nonexistent", newInvitedCount: 50 },
      { action: "change_guests", newInvitedCount: 50 },
    ] as const;
    expect(resolveSubEventRefs(plan, [...actions])).toEqual([...actions]);
  });

  it("does not mutate its input and is safe to run twice", () => {
    const plan = weddingPlan();
    const input = [{ action: "change_guests", subEventId: "Haldi", newInvitedCount: 180 }] as const;
    const once = resolveSubEventRefs(plan, [...input]);
    expect(input[0].subEventId).toBe("Haldi");
    expect(resolveSubEventRefs(plan, once)).toEqual(once);
  });

  it("only removes a program when the reference points to exactly one", () => {
    const plan = weddingPlan();
    plan.subEvents.push(sub("custom-se-4", "Wedding Lunch", 100));
    const out = resolveSubEventRefs(plan, [{ action: "remove_sub_event", subEventId: "wedding" }]);
    // 'wedding' matches two programs -> not rewritten, so nothing is removed by accident
    expect(out).toEqual([{ action: "remove_sub_event", subEventId: "wedding" }]);
    const { updatedPlan, preview } = previewLifeChanges(plan, out, "2026-10-25");
    expect(updatedPlan.subEvents).toHaveLength(4);
    expect(preview.plainSummaryMessages.join(" ")).toContain("more than one program");
  });
});

describe("engine: names and unknown ids", () => {
  it("updates the right program when the action carries a name (guests 250 -> 180 for Haldi)", () => {
    const plan = weddingPlan();
    const { updatedPlan, preview } = previewLifeChanges(
      plan,
      [{ action: "change_guests", subEventId: "Haldi", newInvitedCount: 180 }],
      "2026-10-25"
    );
    expect(updatedPlan.subEvents.find((s) => s.id === "custom-se-1")?.guests.invited).toBe(180);
    expect(updatedPlan.subEvents.find((s) => s.id === "custom-se-2")?.guests.invited).toBe(175);
    expect(preview.plainSummaryMessages.join(" ")).toContain("Updated guest list");
  });

  it("says plainly when a program is unknown, and changes nothing", () => {
    const plan = weddingPlan();
    const { updatedPlan, preview } = previewLifeChanges(
      plan,
      [{ action: "change_guests", subEventId: "Garba Night", newInvitedCount: 90 }],
      "2026-10-25"
    );
    expect(updatedPlan.subEvents.map((s) => s.guests.invited)).toEqual([250, 175, 175]);
    const msg = preview.plainSummaryMessages.join(" ");
    expect(msg).toContain('Could not find a program called "Garba Night"');
    expect(msg).toContain("Your programs are");
  });

  it("says plainly when a program to remove is unknown", () => {
    const plan = weddingPlan();
    const { updatedPlan, preview } = previewLifeChanges(
      plan,
      [{ action: "remove_sub_event", subEventId: "Garba Night" }],
      "2026-10-25"
    );
    expect(updatedPlan.subEvents).toHaveLength(3);
    expect(preview.plainSummaryMessages.join(" ")).toContain('Could not find a program called "Garba Night"');
  });

  it("can still remove a program by name", () => {
    const plan = weddingPlan();
    const { updatedPlan } = previewLifeChanges(plan, [{ action: "remove_sub_event", subEventId: "Sangeet" }], "2026-10-25");
    expect(updatedPlan.subEvents.map((s) => s.id)).toEqual(["custom-se-1", "custom-se-3"]);
  });
});

describe("change prompt", () => {
  it("lists every program with its id and tells the model to use ids, not names", () => {
    const plan = weddingPlan();
    const { systemInstruction } = buildChangeActionsPrompt("guests 250 se 180 ho gaye", plan, "hinglish");
    expect(systemInstruction).toContain("custom-se-1 | Haldi | 250");
    expect(systemInstruction).toContain("custom-se-3 | Shaadi | 175");
    expect(systemInstruction).toMatch(/subEventId MUST be copied exactly from the id column/);
    expect(systemInstruction).toMatch(/Never use the program name/);
  });
});
