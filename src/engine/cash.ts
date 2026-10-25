import type { BudgetItem, CashCheckSummary, MoneyRecord } from "./types";

/**
 * Checks cash readiness for an event:
 * - Distinguishes between Cash in Hand vs Promised Money vs Paid Out
 * - Calculates advance cash required immediately vs during event week
 * - Flags cash shortfalls before payments come due
 */
export function checkCashInHand(
  items: BudgetItem[],
  moneyRecords: MoneyRecord[],
  daysLeftUntilEvent: number
): CashCheckSummary {
  let advanceNeededNow = 0;
  let neededOnEventWeek = 0;
  let neededAfterEvent = 0;

  for (const item of items) {
    const planned = Math.max(0, item.plannedAmount);
    const advPct = Math.max(0, Math.min(100, item.advanceNeededPct ?? 0));
    const weekPct = Math.max(0, Math.min(100, item.eventWeekNeededPct ?? 0));

    const adv = Math.round(planned * (advPct / 100));
    const week = Math.round(planned * (weekPct / 100));
    const after = Math.max(0, planned - adv - week);

    advanceNeededNow += adv;
    neededOnEventWeek += week;
    neededAfterEvent += after;
  }

  let cashInHandNow = 0;
  let promisedButNotReceived = 0;
  let totalSpentSoFar = 0;

  for (const record of moneyRecords) {
    const amt = Math.max(0, Math.round(record.amount || 0));
    if (record.type === "cash_in_hand") {
      cashInHandNow += amt;
    } else if (record.type === "promised_money") {
      promisedButNotReceived += amt;
    } else if (record.type === "paid_out") {
      totalSpentSoFar += amt;
    }
  }

  // Ready cash available after previous payouts
  const availableReadyCash = Math.max(0, cashInHandNow - totalSpentSoFar);

  // If event is within 3 weeks (<= 21 days), both booking advance and event-week cash are urgently needed
  const requiredRightNow =
    daysLeftUntilEvent <= 21
      ? advanceNeededNow + neededOnEventWeek
      : advanceNeededNow;

  const cashShortfallNow = Math.max(0, Math.round(requiredRightNow - availableReadyCash));

  let simpleWarning: string | undefined;
  if (cashShortfallNow > 0) {
    simpleWarning =
      `You need ₹${requiredRightNow.toLocaleString("en-IN")} ready cash right now for vendor advances, ` +
      `but have ₹${availableReadyCash.toLocaleString("en-IN")} available. ` +
      `Shortfall is ₹${cashShortfallNow.toLocaleString("en-IN")}.`;

    if (promisedButNotReceived > 0) {
      simpleWarning +=
        ` You have ₹${promisedButNotReceived.toLocaleString("en-IN")} in promised contributions/chanda ` +
        `that should be collected soon.`;
    }
  }

  return {
    advanceNeededNow,
    neededOnEventWeek,
    neededAfterEvent,
    cashInHandNow,
    promisedButNotReceived,
    totalSpentSoFar,
    cashShortfallNow,
    simpleWarning,
  };
}
