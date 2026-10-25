import { describe, it, expect } from "vitest";
import { fallbackGenerateIdeas, fallbackParseBrief, fallbackParseChanges } from "@/ai/fallback";
import { ParsedBriefSchema, ChangeActionListSchema, SimpleIdeasSchema } from "@/ai/schemas";
import { PRESET_BIRTHDAY, PRESET_COLONY, PRESET_WEDDING } from "@/templates/presets";

describe("fallback parser: extra cases", () => {
  it("always returns a brief that passes the strict schema, even for odd text", () => {
    for (const text of ["", "hello", "!!!", "wedding", "birthday 5 guests", "\u0936\u093E\u0926\u0940 200 \u092E\u0947\u0939\u092E\u093E\u0928"]) {
      const brief = fallbackParseBrief(text || "plan something");
      expect(ParsedBriefSchema.safeParse(brief).success, text).toBe(true);
    }
  });

  it("keeps the language it was asked for", () => {
    expect(fallbackParseBrief("birthday party 30 guests 20000", "hi").language).toBe("hi");
  });

  it("understands 'k' budgets", () => {
    expect(fallbackParseBrief("birthday for 25 people budget 50k").totalBudget).toBe(50000);
  });

  it("returns no actions, with a plain explanation, when nothing is understood", () => {
    const result = fallbackParseChanges("the weather is nice", PRESET_WEDDING);
    expect(result.actions).toEqual([]);
    expect(result.plainExplanation.length).toBeGreaterThan(0);
  });

  it("always returns actions that pass the strict schema", () => {
    for (const text of ["50 log badh gaye", "guests went to 300", "move date 7 days earlier", "cut budget by 10%", "khana mat kaato"]) {
      const result = fallbackParseChanges(text, PRESET_WEDDING);
      expect(ChangeActionListSchema.safeParse(result).success, text).toBe(true);
    }
  });

  it("gives ideas for each event type that pass the schema and never invent vendor names", () => {
    for (const plan of [PRESET_WEDDING, PRESET_BIRTHDAY, PRESET_COLONY]) {
      const ideas = fallbackGenerateIdeas(plan);
      expect(SimpleIdeasSchema.safeParse(ideas).success).toBe(true);
      expect(ideas.themes.length).toBeGreaterThan(0);
      expect(JSON.stringify(ideas)).not.toMatch(/\b\d{10}\b/); // no made-up phone numbers
    }
  });

  it("shows rupee signs for idea costs", () => {
    const ideas = fallbackGenerateIdeas(PRESET_BIRTHDAY);
    expect(JSON.stringify(ideas)).toContain("\u20B9");
  });
});