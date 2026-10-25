import { describe, it, expect } from "vitest";
import { fallbackParseChanges } from "@/ai/fallback";
import { ChangeActionListSchema } from "@/ai/schemas";
import { previewLifeChanges } from "@/engine/changes";
import { PRESET_WEDDING } from "@/templates/presets";
import { calculateGuestPlates } from "@/engine/guests";
import type { EventPlan } from "@/engine/types";

function plan(): EventPlan {
  const p: EventPlan = JSON.parse(JSON.stringify(PRESET_WEDDING));
  const mk = (id: string, name: string, n: number) => ({
    id,
    name,
    dateTime: "2026-12-23 11:00",
    guests: calculateGuestPlates(n, 0.15, 10),
  });
  p.subEvents = [mk("custom-se-1", "Haldi", 250), mk("custom-se-2", "Sangeet", 175), mk("custom-se-3", "Shaadi", 175)];
  return p;
}

describe("offline parser: Hinglish guest phrases", () => {
  it("'guests 250 se 180 ho gaye' changes only the program that had 250 guests", () => {
    const p = plan();
    const res = fallbackParseChanges("guests 250 se 180 ho gaye", p);
    expect(res.actions).toEqual([{ action: "change_guests", subEventId: "custom-se-1", newInvitedCount: 180 }]);
    const { updatedPlan } = previewLifeChanges(p, res.actions, "2026-10-25");
    expect(updatedPlan.subEvents[0].guests.invited).toBe(180);
    expect(updatedPlan.subEvents[1].guests.invited).toBe(175);
  });

  it("changes every program when no program has the old count", () => {
    const res = fallbackParseChanges("guests 300 se 200 ho gaye", plan());
    expect(res.actions).toEqual([{ action: "change_guests", newInvitedCount: 200 }]);
  });

  it("understands '250 se 180 log' and 'log 250 se 180'", () => {
    for (const text of ["250 se 180 log ho gaye", "log 250 se 180", "guests 250 to 180"]) {
      const res = fallbackParseChanges(text, plan());
      expect(res.actions, text).toEqual([{ action: "change_guests", subEventId: "custom-se-1", newInvitedCount: 180 }]);
    }
  });

  it("understands 'guests 180 ho gaye' and '180 log rahenge'", () => {
    expect(fallbackParseChanges("guests 180 ho gaye", plan()).actions).toEqual([
      { action: "change_guests", newInvitedCount: 180 },
    ]);
    expect(fallbackParseChanges("180 log rahenge", plan()).actions).toEqual([
      { action: "change_guests", newInvitedCount: 180 },
    ]);
  });

  it("targets the program named in the sentence ('haldi mein 120 log ho gaye')", () => {
    const res = fallbackParseChanges("haldi mein 120 log ho gaye", plan());
    expect(res.actions).toEqual([{ action: "change_guests", subEventId: "custom-se-1", newInvitedCount: 120 }]);
  });

  it("understands fewer guests ('40 log kam ho gaye')", () => {
    expect(fallbackParseChanges("40 log kam ho gaye", plan()).actions).toEqual([
      { action: "add_guests", extraInvited: -40 },
    ]);
  });

  it("still understands the older phrases", () => {
    expect(fallbackParseChanges("50 log badh gaye hain", plan()).actions).toEqual([
      { action: "add_guests", extraInvited: 50 },
    ]);
    expect(fallbackParseChanges("guest count went to 220", plan()).actions).toEqual([
      { action: "change_guests", newInvitedCount: 220 },
    ]);
  });
});

describe("offline parser: Hinglish budget phrases", () => {
  it("'budget 8 lakh se 6 lakh' sets the budget to 6 lakh", () => {
    expect(fallbackParseChanges("budget 8 lakh se 6 lakh", plan()).actions).toEqual([
      { action: "change_total_budget", newTotalBudget: 600000 },
    ]);
  });

  it("'budget 8 lakh se 6 lakh ho gaya' and 'budget 8 se 6 lakh'", () => {
    for (const text of ["budget 8 lakh se 6 lakh ho gaya", "budget 8 se 6 lakh", "budget 8 lakh to 6.5 lakh"]) {
      const res = fallbackParseChanges(text, plan());
      expect(res.actions, text).toHaveLength(1);
      expect(res.actions[0].action).toBe("change_total_budget");
    }
    expect(
      (fallbackParseChanges("budget 8 lakh to 6.5 lakh", plan()).actions[0] as { newTotalBudget: number }).newTotalBudget
    ).toBe(650000);
  });

  it("'budget 6 lakh ho gaya' / 'budget 50 hazar kar do' / 'budget 600000 ho gaya'", () => {
    const amount = (t: string) =>
      (fallbackParseChanges(t, plan()).actions[0] as { newTotalBudget: number } | undefined)?.newTotalBudget;
    expect(amount("budget 6 lakh ho gaya")).toBe(600000);
    expect(amount("budget 50 hazar kar do")).toBe(50000);
    expect(amount("budget 600000 ho gaya")).toBe(600000);
  });

  it("does not mistake percent changes or guest numbers for a new budget", () => {
    expect(fallbackParseChanges("cut budget by 15%", plan()).actions).toEqual([
      { action: "cut_or_grow_budget_pct", pctDelta: -15 },
    ]);
    const res = fallbackParseChanges("guests 250 se 180 ho gaye", plan());
    expect(res.actions.every((a) => a.action !== "change_total_budget")).toBe(true);
  });

  it("handles guests and budget in one sentence", () => {
    const res = fallbackParseChanges("guests 250 se 180 ho gaye aur budget 8 lakh se 6 lakh", plan());
    expect(res.actions.map((a) => a.action).sort()).toEqual(["change_guests", "change_total_budget"]);
  });

  it("keeps the old explicit forms working", () => {
    expect(fallbackParseChanges("new total budget 800000", plan()).actions).toEqual([
      { action: "change_total_budget", newTotalBudget: 800000 },
    ]);
  });

  it("always returns actions that pass the strict schema", () => {
    for (const text of [
      "guests 250 se 180 ho gaye",
      "budget 8 lakh se 6 lakh",
      "haldi mein 120 log ho gaye",
      "40 log kam ho gaye",
      "लोग 250 से 180 हो गए",
    ]) {
      expect(ChangeActionListSchema.safeParse(fallbackParseChanges(text, plan())).success, text).toBe(true);
    }
  });
});
