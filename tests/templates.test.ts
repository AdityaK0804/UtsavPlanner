import { describe, it, expect } from "vitest";
import benchmarks from "@/templates/benchmarks.json";
import {
  createPlanFromTemplate,
  PRESET_WEDDING,
  PRESET_BIRTHDAY,
  PRESET_COLONY,
} from "@/templates/index";
import { summarizeMoneyTracker } from "@/engine/moneyTracker";

describe("Templates: Benchmarks Configuration (benchmarks.json)", () => {
  it("contains valid city multipliers and guest metrics with audit dates", () => {
    expect(benchmarks.cityMultipliers.big_metro.multiplier).toBe(1.25);
    expect(benchmarks.cityMultipliers.medium_city.multiplier).toBe(1.0);
    expect(benchmarks.cityMultipliers.small_town.multiplier).toBe(0.8);

    expect(benchmarks.guestMetrics.extraGuestBufferPct.value).toBe(0.15);
    expect(benchmarks.guestMetrics.catererConsumptionRange.min).toBe(0.85);
    expect(benchmarks.guestMetrics.catererConsumptionRange.max).toBe(0.95);

    expect(benchmarks.typicalBudgetShares.wedding.foodAndCatering).toBe(0.39);
    expect(benchmarks.typicalBudgetShares.birthday.foodAndCake).toBe(0.44);
    expect(benchmarks.typicalBudgetShares.colony_festival.bhandaraFood).toBe(0.4);
  });
});

describe("Templates: Blueprint Plan Generation (index.ts)", () => {
  it("generates a balanced wedding plan with locked food and sub-events", () => {
    const plan = createPlanFromTemplate({
      eventType: "wedding",
      title: "Verma Shadi",
      city: "Kanpur",
      citySize: "medium_city",
      eventDate: "2026-11-25",
      invitedGuests: 150,
      totalBudget: 500000,
      foodType: ["pure_veg"],
      subEventNames: ["Haldi & Mehendi", "Main Shadi"],
      mustHaveCategories: ["Food & Catering"],
      language: "en",
    });

    expect(plan.type).toBe("wedding");
    expect(plan.subEvents).toHaveLength(2);
    expect(plan.budgetItems.length).toBeGreaterThan(4);

    // Emergency buffer exists
    const emergency = plan.budgetItems.find((i) => i.category.includes("Emergency Buffer"));
    expect(emergency).toBeDefined();
    expect(emergency?.plannedAmount).toBe(50000); // 10% of 5,00,000

    // Food category is locked
    const food = plan.budgetItems.find((i) => i.category.includes("Food"));
    expect(food?.doNotCut).toBe(true);

    // Sum of budget items matches totalBudget
    const sum = plan.budgetItems.reduce((acc, it) => acc + it.plannedAmount, 0);
    expect(Math.abs(sum - 500000)).toBeLessThanOrEqual(1);

    // Checklist generated backwards
    expect(plan.checklist.length).toBeGreaterThan(0);
    expect(plan.vendors.length).toBeGreaterThan(0);
    expect(plan.extraExpenseWarnings.length).toBeGreaterThan(0);
  });

  it("generates a balanced birthday plan with kid-friendly defaults", () => {
    const plan = createPlanFromTemplate({
      eventType: "birthday",
      title: "Riya 5th Birthday",
      city: "Noida",
      citySize: "big_metro",
      eventDate: "2026-11-10",
      invitedGuests: 40,
      totalBudget: 30000,
      language: "hinglish",
    });

    expect(plan.type).toBe("birthday");
    expect(plan.subEvents).toHaveLength(1);

    const sum = plan.budgetItems.reduce((acc, it) => acc + it.plannedAmount, 0);
    expect(Math.abs(sum - 30000)).toBeLessThanOrEqual(1);

    const returnGifts = plan.budgetItems.find((i) => i.category.includes("Return Gifts"));
    expect(returnGifts).toBeDefined();
  });

  it("generates a balanced colony festival plan with bhandara and chanda warnings", () => {
    const plan = createPlanFromTemplate({
      eventType: "colony_festival",
      title: "Shivaji Nagar Durga Puja",
      city: "Nagpur",
      citySize: "medium_city",
      eventDate: "2026-11-15",
      invitedGuests: 300,
      totalBudget: 150000,
      language: "hi",
    });

    expect(plan.type).toBe("colony_festival");
    const bhandara = plan.budgetItems.find((i) => i.category.includes("Mahaprasad"));
    expect(bhandara).toBeDefined();
    expect(bhandara?.doNotCut).toBe(true);

    const sum = plan.budgetItems.reduce((acc, it) => acc + it.plannedAmount, 0);
    expect(Math.abs(sum - 150000)).toBeLessThanOrEqual(1);
  });
});

describe("Templates: Production Demo Presets (presets.ts)", () => {
  it("PRESET_WEDDING is fully configured and budget-balanced", () => {
    expect(PRESET_WEDDING.title).toContain("Sharma Family Wedding");
    expect(PRESET_WEDDING.totalBudget).toBe(800000);
    expect(PRESET_WEDDING.subEvents).toHaveLength(3);

    const sum = PRESET_WEDDING.budgetItems.reduce((s, it) => s + it.plannedAmount, 0);
    expect(Math.abs(sum - 800000)).toBeLessThanOrEqual(1);

    expect(PRESET_WEDDING.moneyRecords.length).toBeGreaterThan(0);
    for (const item of PRESET_WEDDING.budgetItems) {
      expect(isNaN(item.plannedAmount)).toBe(false);
      expect(item.plannedAmount).toBeGreaterThanOrEqual(0);
    }
  });

  it("PRESET_BIRTHDAY selects home_halwai_diy style on tight budget (₹15,000)", () => {
    expect(PRESET_BIRTHDAY.title).toContain("Aarav's 1st Birthday");
    expect(PRESET_BIRTHDAY.totalBudget).toBe(15000);

    const food = PRESET_BIRTHDAY.budgetItems.find((i) => i.category.includes("Food"));
    expect(food?.currentStyle).toBe("home_halwai_diy");
    expect(food?.savingTip).toBeDefined();

    const sum = PRESET_BIRTHDAY.budgetItems.reduce((s, it) => s + it.plannedAmount, 0);
    expect(Math.abs(sum - 15000)).toBeLessThanOrEqual(1);
  });

  it("PRESET_COLONY integrates with moneyTracker for WhatsApp audit summaries", () => {
    expect(PRESET_COLONY.title).toContain("Shanti Nagar Colony");
    expect(PRESET_COLONY.moneyRecords).toHaveLength(6);

    const summary = summarizeMoneyTracker(
      PRESET_COLONY.title,
      PRESET_COLONY.moneyRecords,
      PRESET_COLONY.totalBudget
    );

    expect(summary.totalCashInHand).toBe(65000); // 35k + 30k
    expect(summary.totalPromised).toBe(35000); // 25k + 10k
    expect(summary.totalPaidOut).toBe(16000); // 6k + 10k
    expect(summary.readyCashBalance).toBe(49000); // 65k - 16k
    expect(summary.whatsappAuditText).toContain("Shanti Nagar Colony");
    expect(summary.whatsappAuditText).toContain("Tower A Residents");
  });
});
