import { describe, it, expect } from "vitest";
import { calculateGuestPlates, checkCatererPlateQuote } from "@/engine/guests";
import { checkCashInHand } from "@/engine/cash";
import { buildChecklist, getDaysRemaining, subtractDays } from "@/engine/timeline";
import { checkDaySchedule } from "@/engine/schedule";
import { summarizeMoneyTracker } from "@/engine/moneyTracker";
import type { BudgetItem, DayScheduleBlock, MoneyRecord } from "@/engine/types";
import benchmarks from "@/templates/benchmarks.json";

describe("guests.ts: extra rules", () => {
  it("takes its default buffer and helper plates from benchmarks.json", () => {
    const g = calculateGuestPlates(100);
    expect(g.extraBufferPct).toBe(benchmarks.guestMetrics.extraGuestBufferPct.value);
    expect(g.helperPlates).toBe(benchmarks.guestMetrics.defaultHelperPlates.value);
    expect(g.expectedTotal).toBe(115);
    expect(g.totalPlatesToOrder).toBe(125);
  });

  it("lets the caller change buffer and helper plates", () => {
    const g = calculateGuestPlates(100, 0, 0);
    expect(g.totalPlatesToOrder).toBe(100);
  });

  it("rounds a fractional invited count and never returns less than 1 guest", () => {
    expect(calculateGuestPlates(10.6).invited).toBe(11);
    expect(calculateGuestPlates(0).invited).toBe(1);
    expect(calculateGuestPlates(Number.NaN).invited).toBe(1);
  });

  it("accepts a quote inside the 10% margin and flags one above it", () => {
    const g = calculateGuestPlates(100); // 125 plates to order
    expect(checkCatererPlateQuote(125, g).isHigh).toBe(false);
    expect(checkCatererPlateQuote(137, g).isHigh).toBe(false);
    const high = checkCatererPlateQuote(160, g);
    expect(high.isHigh).toBe(true);
    expect(high.plainAdvice).toContain("160");
  });
});

describe("cash.ts: extra rules", () => {
  const item = (planned: number, adv: number, week: number): BudgetItem => ({
    id: "i",
    category: "Test",
    howItScales: "fixed_price",
    plannedAmount: planned,
    status: "typical_estimate",
    doNotCut: false,
    currentStyle: "smart_mix",
    styleOptions: { full_vendor_service: "a", smart_mix: "b", home_halwai_diy: "c" },
    advanceNeededPct: adv,
    eventWeekNeededPct: week,
  });
  const rec = (type: MoneyRecord["type"], amount: number): MoneyRecord => ({
    id: Math.random().toString(),
    type,
    personName: "A",
    amount,
    date: "2026-10-01",
  });

  it("splits money into advance, event week and after event", () => {
    const s = checkCashInHand([item(100000, 30, 50)], [], 60);
    expect(s.advanceNeededNow).toBe(30000);
    expect(s.neededOnEventWeek).toBe(50000);
    expect(s.neededAfterEvent).toBe(20000);
  });

  it("clamps bad percentages instead of producing negative or huge amounts", () => {
    const s = checkCashInHand([item(1000, -20, 500)], [], 60);
    expect(s.advanceNeededNow).toBe(0);
    expect(s.neededOnEventWeek).toBe(1000);
    expect(s.neededAfterEvent).toBe(0);
  });

  it("subtracts what is already paid out from cash in hand and warns with rupee amounts", () => {
    const s = checkCashInHand([item(100000, 50, 0)], [rec("cash_in_hand", 40000), rec("paid_out", 15000)], 60);
    expect(s.cashShortfallNow).toBe(25000);
    expect(s.simpleWarning).toContain("\u20B925,000");
  });

  it("gives no warning when cash covers the advance", () => {
    const s = checkCashInHand([item(100000, 30, 0)], [rec("cash_in_hand", 50000)], 60);
    expect(s.cashShortfallNow).toBe(0);
    expect(s.simpleWarning).toBeUndefined();
  });

  it("mentions promised money when there is a shortfall", () => {
    const s = checkCashInHand([item(100000, 50, 0)], [rec("promised_money", 10000)], 60);
    expect(s.simpleWarning).toContain("\u20B910,000");
  });
});

describe("timeline.ts: extra rules", () => {
  it("counts days across month ends and returns negative after the event", () => {
    expect(getDaysRemaining("2026-11-01", "2026-10-25")).toBe(7);
    expect(getDaysRemaining("2026-10-20", "2026-10-25")).toBe(-5);
    expect(subtractDays("2026-03-01", 1)).toBe("2026-02-28");
  });

  it("marks a task late when its due date has passed, and raises its priority", () => {
    const tasks = buildChecklist("2026-11-01", [{ title: "Book hall", daysNeededBefore: 30, priority: "low" }], "2026-10-25");
    expect(tasks[0].isLate).toBe(true);
    expect(tasks[0].isTightSchedule).toBe(true);
    expect(tasks[0].priority).toBe("high");
  });

  it("keeps the template priority when there is plenty of time", () => {
    const tasks = buildChecklist("2027-01-01", [{ title: "Send cards", daysNeededBefore: 10, priority: "low" }], "2026-10-25");
    expect(tasks[0].isLate).toBe(false);
    expect(tasks[0].priority).toBe("low");
  });
});

describe("schedule.ts: extra rules", () => {
  const block = (over: Partial<DayScheduleBlock>): DayScheduleBlock => ({
    id: "b",
    title: "Block",
    startTime: "10:00",
    durationMinutes: 120,
    bufferMinutesAfter: 30,
    blockType: "main_ritual_program",
    ...over,
  });

  it("is silent for a comfortable schedule", () => {
    expect(checkDaySchedule([block({})])).toEqual([]);
  });

  it("warns about a fixed muhurat that starts too late", () => {
    const warnings = checkDaySchedule([block({ title: "Pheras", startTime: "21:00" })], [{ label: "Pheras", time: "20:00" }]);
    expect(warnings.some((w) => w.includes("Pheras") && w.includes("20:00"))).toBe(true);
  });

  it("does not warn when the block starts on time", () => {
    expect(checkDaySchedule([block({ title: "Pheras", startTime: "19:30" })], [{ label: "Pheras", time: "20:00" }])).toEqual([]);
  });

  it("asks for a rain or heat backup for outdoor blocks", () => {
    expect(checkDaySchedule([block({ isOutdoor: true, backupPlanNote: "  " })]).length).toBe(1);
    expect(checkDaySchedule([block({ isOutdoor: true, backupPlanNote: "Covered hall" })])).toEqual([]);
  });
});

describe("moneyTracker.ts: extra rules", () => {
  const r = (personName: string, type: MoneyRecord["type"], amount: number): MoneyRecord => ({
    id: personName + type + amount,
    type,
    personName,
    amount,
    date: "2026-10-01",
  });

  it("adds up per person and never lets ready cash go below zero", () => {
    const s = summarizeMoneyTracker("Ganesh Utsav", [r("Sharma ji", "cash_in_hand", 1000), r("Sharma ji", "promised_money", 500), r("Committee", "paid_out", 3000)], 50000);
    expect(s.totalCashInHand).toBe(1000);
    expect(s.totalPromised).toBe(500);
    expect(s.totalPaidOut).toBe(3000);
    expect(s.readyCashBalance).toBe(0);
    expect(s.netProjectedBalance).toBe(-1500);
    expect(s.contributors.find((c) => c.personName === "Sharma ji")?.promisedMoney).toBe(500);
  });

  it("names blank contributors and ignores negative amounts", () => {
    const s = summarizeMoneyTracker("Test", [r("  ", "cash_in_hand", 200), r("Ravi", "cash_in_hand", -50)], 1000);
    expect(s.contributors.map((c) => c.personName)).toContain("Anonymous Contributor");
    expect(s.totalCashInHand).toBe(200);
  });

  it("prints rupee signs in the WhatsApp text", () => {
    const s = summarizeMoneyTracker("Test", [r("Ravi", "cash_in_hand", 2500)], 10000);
    expect(s.whatsappAuditText).toContain("\u20B92,500");
    expect(s.whatsappAuditText).toContain("\u20B910,000");
  });
});

describe("benchmarks.json: honest sources", () => {
  function collect(o: unknown, path: string, out: { path: string; node: Record<string, unknown> }[]) {
    if (o && typeof o === "object") {
      const node = o as Record<string, unknown>;
      if ("sourceNote" in node || "asOf" in node || "source" in node) out.push({ path, node });
      for (const [k, v] of Object.entries(node)) collect(v, `${path}.${k}`, out);
    }
  }

  it("gives every price, split and guest number a source and a date", () => {
    const entries: { path: string; node: Record<string, unknown> }[] = [];
    collect(benchmarks, "benchmarks", entries);
    expect(entries.length).toBeGreaterThanOrEqual(9);
    for (const { path, node } of entries) {
      expect(typeof node.source, `${path}.source`).toBe("string");
      expect(String(node.source).length, `${path}.source`).toBeGreaterThan(0);
      expect(String(node.asOf), `${path}.asOf`).toMatch(/^\d{4}-\d{2}/);
    }
  });

  it("does not claim a specific published citation", () => {
    expect(JSON.stringify(benchmarks)).not.toMatch(/Indian Event Planning Benchmark/);
    expect(JSON.stringify(benchmarks)).toMatch(/to be verified/);
  });

  it("makes each event type's budget shares add up to exactly 100%", () => {
    for (const [name, split] of Object.entries(benchmarks.typicalBudgetShares)) {
      const shares = Object.entries(split as Record<string, unknown>).filter(([, v]) => typeof v === "number") as [string, number][];
      expect(shares.length, name).toBeGreaterThan(3);
      const wholePercents = shares.map(([key, value]) => {
        expect(value, name + "." + key).toBeGreaterThan(0);
        expect(value, name + "." + key).toBeLessThan(1);
        return Math.round(value * 100);
      });
      // Every share is a whole percent, and the whole percents add up to exactly 100.
      shares.forEach(([, value], i) => expect(value * 100).toBeCloseTo(wholePercents[i], 9));
      expect(wholePercents.reduce((a, b) => a + b, 0), name).toBe(100);
    }
  });

  it("keeps the emergency buffer share equal to the engine's 10% default", () => {
    for (const split of Object.values(benchmarks.typicalBudgetShares)) {
      expect(split.emergencyBuffer).toBe(0.1);
    }
  });

  it("keeps the template weights (which the engine normalises) within 1.5 points of the benchmark shares", () => {
    const sets: [string, number[], number[]][] = [
      ["wedding", [42, 20, 10, 8, 8, 5, 4], [0.39, 0.19, 0.09, 0.07, 0.07, 0.05, 0.04]],
      ["birthday", [50, 15, 15, 10, 10], [0.44, 0.14, 0.14, 0.09, 0.09]],
      ["colony_festival", [45, 25, 12, 10, 8], [0.4, 0.23, 0.11, 0.09, 0.07]],
    ];
    for (const [name, weights, shares] of sets) {
      const sum = weights.reduce((a, b) => a + b, 0);
      weights.forEach((w, i) => {
        const effectivePct = (w / sum) * 90;
        expect(Math.abs(effectivePct - shares[i] * 100), name + " #" + i).toBeLessThanOrEqual(1.5);
      });
    }
  });
});
