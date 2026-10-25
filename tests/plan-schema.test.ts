import { describe, it, expect } from "vitest";
import { EventPlanSchema, IsoDateSchema } from "@/ai/planSchema";
import { PRESET_BIRTHDAY, PRESET_COLONY, PRESET_WEDDING } from "@/templates/presets";

describe("EventPlanSchema (plan sent by the browser)", () => {
  it.each([
    ["wedding", PRESET_WEDDING],
    ["birthday", PRESET_BIRTHDAY],
    ["colony festival", PRESET_COLONY],
  ])("accepts the built-in %s preset exactly as the app produces it", (_name, plan) => {
    const result = EventPlanSchema.safeParse(JSON.parse(JSON.stringify(plan)));
    if (!result.success) console.error(result.error.issues);
    expect(result.success).toBe(true);
  });

  it("fills safe defaults for aiSource and version", () => {
    const raw = JSON.parse(JSON.stringify(PRESET_WEDDING));
    delete raw.aiSource;
    delete raw.version;
    const parsed = EventPlanSchema.parse(raw);
    expect(parsed.aiSource).toBe("offline_backup");
    expect(parsed.version).toBe(1);
  });

  it("removes unknown extra fields instead of passing them on", () => {
    const raw = { ...JSON.parse(JSON.stringify(PRESET_WEDDING)), evil: "<script>" };
    const parsed = EventPlanSchema.parse(raw) as unknown as Record<string, unknown>;
    expect(parsed.evil).toBeUndefined();
  });

  it("rejects a plan whose budget status is not one of the allowed price labels", () => {
    const raw = JSON.parse(JSON.stringify(PRESET_WEDDING));
    raw.budgetItems[0].status = "guaranteed_cheapest";
    expect(EventPlanSchema.safeParse(raw).success).toBe(false);
  });

  it("rejects percentages outside 0-100 and NaN-like numbers", () => {
    const raw = JSON.parse(JSON.stringify(PRESET_WEDDING));
    raw.budgetItems[0].advanceNeededPct = 250;
    expect(EventPlanSchema.safeParse(raw).success).toBe(false);
    raw.budgetItems[0].advanceNeededPct = 30;
    raw.totalBudget = "12000";
    expect(EventPlanSchema.safeParse(raw).success).toBe(false);
  });
});

describe("IsoDateSchema", () => {
  it("accepts real dates only", () => {
    expect(IsoDateSchema.safeParse("2026-10-25").success).toBe(true);
    expect(IsoDateSchema.safeParse("2028-02-29").success).toBe(true);
    expect(IsoDateSchema.safeParse("2026-02-29").success).toBe(false);
    expect(IsoDateSchema.safeParse("2026-1-5").success).toBe(false);
  });
});