import { describe, it, expect } from "vitest";
import { calculateGuestPlates, checkCatererPlateQuote } from "@/engine/guests";
import {
  buildInitialBudget,
  rebalanceBudget,
  comparePlateOptions,
  type TemplateCategoryInput,
} from "@/engine/budget";
import { checkCashInHand } from "@/engine/cash";
import type { BudgetItem, MoneyRecord } from "@/engine/types";

describe("Engine: Guest Plates (guests.ts)", () => {
  it("calculates guest plates with 15% buffer and 10 helper plates by default", () => {
    const res = calculateGuestPlates(100);
    // 100 * 1.15 = 115 expectedTotal
    // 115 + 10 = 125 totalPlatesToOrder
    expect(res.invited).toBe(100);
    expect(res.expectedTotal).toBe(115);
    expect(res.helperPlates).toBe(10);
    expect(res.totalPlatesToOrder).toBe(125);
  });

  it("handles ceiling rounding on fractional buffers", () => {
    // 105 * 1.15 = 120.75 -> ceil is 121
    const res = calculateGuestPlates(105, 0.15, 8);
    expect(res.expectedTotal).toBe(121);
    expect(res.totalPlatesToOrder).toBe(129);
  });

  it("safely handles negative or NaN inputs", () => {
    const res = calculateGuestPlates(-50, -0.2, -5);
    expect(res.invited).toBe(1);
    expect(res.extraBufferPct).toBe(0);
    expect(res.helperPlates).toBe(0);
    expect(res.expectedTotal).toBe(1);
    expect(res.totalPlatesToOrder).toBe(1);

    const nanRes = calculateGuestPlates(NaN, NaN, NaN);
    expect(nanRes.invited).toBe(1);
    expect(nanRes.totalPlatesToOrder).toBe(1);
  });

  it("flags overly high caterer plate quotes with 85-95% Indian eating pattern guidance", () => {
    const guests = calculateGuestPlates(200); // expectedTotal: 230, total: 240
    // If caterer quotes 280 (> 240 * 1.1 = 264)
    const quoteCheck = checkCatererPlateQuote(280, guests);
    expect(quoteCheck.isHigh).toBe(true);
    expect(quoteCheck.recommendedMinPlates).toBe(Math.round(230 * 0.85)); // 196
    expect(quoteCheck.recommendedMaxPlates).toBe(Math.round(230 * 0.95)); // 219
    expect(quoteCheck.plainAdvice).toContain("caterer is quoting 280 plates");
    expect(quoteCheck.plainAdvice).toContain("85% to 95%");

    // Safe quote
    const safeCheck = checkCatererPlateQuote(235, guests);
    expect(safeCheck.isHigh).toBe(false);
    expect(safeCheck.plainAdvice).toContain("within your safe planning range");
  });
});

describe("Engine: Budget Allocations & Rebalancing (budget.ts)", () => {
  const sampleCategories: TemplateCategoryInput[] = [
    {
      category: "Catering / Halwai Food",
      weightPct: 50,
      howItScales: "per_plate",
      doNotCut: false,
      styleOptions: {
        full_vendor_service: "3-course luxury live counters",
        smart_mix: "Halwai preparation with raw grocery purchase",
        home_halwai_diy: "Single wholesome festive meal menu",
      },
      advanceNeededPct: 25,
      eventWeekNeededPct: 60,
    },
    {
      category: "Tent, Seating & Lighting",
      weightPct: 30,
      howItScales: "fixed_price",
      doNotCut: false,
      styleOptions: {
        full_vendor_service: "Designer fairy lights & theme stage",
        smart_mix: "Standard shamiana tent with clean cloth seating",
        home_halwai_diy: "Basic waterproof shamiana & tube lights",
      },
      advanceNeededPct: 40,
      eventWeekNeededPct: 50,
    },
    {
      category: "Sound, DJ & Dhol",
      weightPct: 20,
      howItScales: "fixed_price",
      doNotCut: false,
      styleOptions: {
        full_vendor_service: "Line-array DJ setup & brass band",
        smart_mix: "2-speaker PA system + playlist & local dhol",
        home_halwai_diy: "Colony portable Bluetooth speaker",
      },
      advanceNeededPct: 50,
      eventWeekNeededPct: 50,
    },
  ];

  it("builds initial budget reserving 10% emergency buffer and selects style based on per-plate budget", () => {
    const guests = calculateGuestPlates(100); // 125 total plates
    // Total budget 1,00,000 -> per plate ~800 -> smart_mix
    const items = buildInitialBudget(sampleCategories, 100000, guests, 10);

    const emergency = items.find((i) => i.category.includes("Emergency Buffer"));
    expect(emergency).toBeDefined();
    expect(emergency?.plannedAmount).toBe(10000);
    expect(emergency?.doNotCut).toBe(true);

    const catering = items.find((i) => i.category.includes("Catering"));
    expect(catering).toBeDefined();
    // 90,000 distributable * 50% = 45,000
    expect(catering?.plannedAmount).toBe(45000);
    expect(catering?.currentStyle).toBe("smart_mix");
    expect(catering?.status).toBe("typical_estimate");

    // Very low budget: 30,000 / 125 plates = 240/plate -> home_halwai_diy
    const lowBudgetItems = buildInitialBudget(sampleCategories, 30000, guests, 10);
    const lowCatering = lowBudgetItems.find((i) => i.category.includes("Catering"));
    expect(lowCatering?.currentStyle).toBe("home_halwai_diy");

    // Luxury budget: 2,50,000 / 125 plates = 2000/plate -> full_vendor_service
    const highBudgetItems = buildInitialBudget(sampleCategories, 250000, guests, 10);
    const highCatering = highBudgetItems.find((i) => i.category.includes("Catering"));
    expect(highCatering?.currentStyle).toBe("full_vendor_service");
  });

  it("rebalances budget when real shop price is entered and protects locked items", () => {
    const guests = calculateGuestPlates(100);
    const initialItems = buildInitialBudget(sampleCategories, 100000, guests, 10);

    // Initial catering was 45,000. Now user gets real shop price of 55,000.
    const rebalance = rebalanceBudget(
      initialItems,
      { realPrices: [{ category: "Catering", price: 55000 }] },
      100000,
      10
    );

    // Deep copy immutability
    expect(initialItems.find((i) => i.category.includes("Catering"))?.plannedAmount).toBe(45000);

    const updatedCatering = rebalance.items.find((i) => i.category.includes("Catering"));
    expect(updatedCatering?.plannedAmount).toBe(55000);
    expect(updatedCatering?.status).toBe("real_shop_price");

    // Tent and Sound were unlocked, so they absorb the decrease
    const updatedTent = rebalance.items.find((i) => i.category.includes("Tent"));
    const updatedSound = rebalance.items.find((i) => i.category.includes("Sound"));

    // Total should still sum to 1,00,000 (including 10,000 buffer)
    const total = rebalance.items.reduce((s, it) => s + it.plannedAmount, 0);
    expect(total).toBe(100000);
    expect(rebalance.overBudgetBy).toBe(0);

    // Tent plannedAmount dropped from 27,000 (90k * 30%) to ~21,000 (>15% drop)
    // Style should step down and saving tip should be applied
    expect(updatedTent?.savingTip).toBeDefined();
  });

  it("flags over-budget warning when locked items exceed total budget limit", () => {
    const guests = calculateGuestPlates(100);
    const initialItems = buildInitialBudget(sampleCategories, 100000, guests, 10);

    // Lock Tent and set huge real price on catering
    const tent = initialItems.find((i) => i.category.includes("Tent"))!;
    tent.doNotCut = true;
    tent.plannedAmount = 30000;

    const rebalance = rebalanceBudget(
      initialItems,
      { realPrices: [{ category: "Catering", price: 75000 }] }, // 75k + 30k tent + 10k buffer = 115k > 100k
      100000,
      10
    );

    expect(rebalance.overBudgetBy).toBeGreaterThan(0);
    expect(rebalance.warning).toContain("Must-Have (locked) items and Real Shop Prices");
    expect(rebalance.warning).toContain("more than your total budget");
  });

  it("compares guest count and plate cost options with clear plain verdicts", () => {
    const comparisons = comparePlateOptions(100000, 50, [
      { label: "Option A (High-End & Fewer Guests)", invitedGuests: 50, perPlateCost: 650 },
      { label: "Option B (Standard & Big Gathering)", invitedGuests: 120, perPlateCost: 450 },
    ]);

    expect(comparisons).toHaveLength(2);
    // Option A: 50 guests -> 58 expected + 10 = 68 plates * 650 = 44,200 <= 50,000 food budget cap
    expect(comparisons[0].fitsBudget).toBe(true);
    expect(comparisons[0].plainVerdict).toContain("Fits comfortably");

    // Option B: 120 guests -> 138 expected + 10 = 148 plates * 450 = 66,600 > 50,000 cap
    expect(comparisons[1].fitsBudget).toBe(false);
    expect(comparisons[1].plainVerdict).toContain("Exceeds recommended food allocation");
  });
});

describe("Engine: Cash & Payment Readiness (cash.ts)", () => {
  const dummyItems: BudgetItem[] = [
    {
      id: "b1",
      category: "Catering",
      howItScales: "per_plate",
      plannedAmount: 50000,
      status: "typical_estimate",
      doNotCut: false,
      currentStyle: "smart_mix",
      styleOptions: {
        full_vendor_service: "",
        smart_mix: "",
        home_halwai_diy: "",
      },
      advanceNeededPct: 30, // 15,000 advance
      eventWeekNeededPct: 50, // 25,000 event week
    },
    {
      id: "b2",
      category: "Tent",
      howItScales: "fixed_price",
      plannedAmount: 20000,
      status: "typical_estimate",
      doNotCut: false,
      currentStyle: "smart_mix",
      styleOptions: {
        full_vendor_service: "",
        smart_mix: "",
        home_halwai_diy: "",
      },
      advanceNeededPct: 40, // 8,000 advance
      eventWeekNeededPct: 40, // 8,000 event week
    },
  ];

  it("calculates ready cash vs shortfall when more than 3 weeks away", () => {
    const records: MoneyRecord[] = [
      {
        id: "m1",
        type: "cash_in_hand",
        personName: "Self Savings",
        amount: 20000,
        date: "2026-10-01",
      },
      {
        id: "m2",
        type: "promised_money",
        personName: "Uncle Ji Contribution",
        amount: 15000,
        date: "2026-10-01",
      },
      {
        id: "m3",
        type: "paid_out",
        personName: "Initial Halwai Token",
        amount: 5000,
        date: "2026-10-05",
      },
    ];

    // > 21 days away: only advance needed now (15,000 + 8,000 = 23,000)
    // Available ready cash = 20,000 - 5,000 = 15,000
    // Shortfall = 23,000 - 15,000 = 8,000
    const summary = checkCashInHand(dummyItems, records, 45);
    expect(summary.advanceNeededNow).toBe(23000);
    expect(summary.cashInHandNow).toBe(20000);
    expect(summary.totalSpentSoFar).toBe(5000);
    expect(summary.cashShortfallNow).toBe(8000);
    expect(summary.simpleWarning).toContain("You need ₹23,000 ready cash");
    expect(summary.simpleWarning).toContain("promised contributions/chanda");
  });

  it("requires both booking advance and event-week cash when event is within 3 weeks (<= 21 days)", () => {
    const records: MoneyRecord[] = [
      {
        id: "m1",
        type: "cash_in_hand",
        personName: "Self Savings",
        amount: 30000,
        date: "2026-10-01",
      },
    ];

    // <= 21 days away:
    // advanceNeededNow = 23,000
    // neededOnEventWeek = 25,000 + 8,000 = 33,000
    // Required now = 23,000 + 33,000 = 56,000
    // Available = 30,000
    // Shortfall = 56,000 - 30,000 = 26,000
    const summary = checkCashInHand(dummyItems, records, 14);
    expect(summary.cashShortfallNow).toBe(26000);
    expect(summary.simpleWarning).toContain("₹56,000 ready cash right now");
  });
});
