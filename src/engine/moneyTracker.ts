import type { MoneyRecord } from "./types";

export interface ContributorSummary {
  personName: string;
  cashInHand: number;
  promisedMoney: number;
  paidOut: number;
}

export interface MoneyTrackerSummary {
  totalCashInHand: number;
  totalPromised: number;
  totalPaidOut: number;
  readyCashBalance: number;
  netProjectedBalance: number;
  contributors: ContributorSummary[];
  whatsappAuditText: string;
}

/**
 * Summarizes community (Colony/Mohalla festival) or family money records:
 * - Aggregates contributions by person
 * - Compares Ready Cash in Hand vs Pending Promises vs Actual Expenses
 * - Creates a shareable WhatsApp audit message for complete transparency
 */
export function summarizeMoneyTracker(
  planTitle: string,
  records: MoneyRecord[],
  totalPlannedBudget: number
): MoneyTrackerSummary {
  let totalCashInHand = 0;
  let totalPromised = 0;
  let totalPaidOut = 0;

  const contributorMap = new Map<string, ContributorSummary>();

  for (const rec of records) {
    const amt = Math.max(0, Math.round(rec.amount || 0));
    const name = rec.personName.trim() || "Anonymous Contributor";

    if (!contributorMap.has(name)) {
      contributorMap.set(name, {
        personName: name,
        cashInHand: 0,
        promisedMoney: 0,
        paidOut: 0,
      });
    }

    const c = contributorMap.get(name)!;

    if (rec.type === "cash_in_hand") {
      totalCashInHand += amt;
      c.cashInHand += amt;
    } else if (rec.type === "promised_money") {
      totalPromised += amt;
      c.promisedMoney += amt;
    } else if (rec.type === "paid_out") {
      totalPaidOut += amt;
      c.paidOut += amt;
    }
  }

  const readyCashBalance = Math.max(0, totalCashInHand - totalPaidOut);
  const netProjectedBalance = totalCashInHand + totalPromised - totalPaidOut;
  const contributors = Array.from(contributorMap.values());

  // Generate WhatsApp-friendly plain text summary
  const lines: string[] = [
    `✨ *Hisaab-Kitaab / Money Tracker: ${planTitle}* ✨`,
    `📋 Planned Budget: ₹${totalPlannedBudget.toLocaleString("en-IN")}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💵 *Cash Collected (In Hand):* ₹${totalCashInHand.toLocaleString("en-IN")}`,
    `🤝 *Promised Chanda / Sahyog:* ₹${totalPromised.toLocaleString("en-IN")}`,
    `💸 *Total Paid Out / Kharcha:* ₹${totalPaidOut.toLocaleString("en-IN")}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *Available Ready Cash:* ₹${readyCashBalance.toLocaleString("en-IN")}`,
    `📈 *Net Balance (with promises):* ₹${netProjectedBalance.toLocaleString("en-IN")}`,
  ];

  if (contributors.length > 0) {
    lines.push(``);
    lines.push(`👥 *Contributor Details:*`);
    for (const c of contributors) {
      const parts: string[] = [];
      if (c.cashInHand > 0) parts.push(`₹${c.cashInHand.toLocaleString("en-IN")} (Paid)`);
      if (c.promisedMoney > 0) parts.push(`₹${c.promisedMoney.toLocaleString("en-IN")} (Promised)`);
      if (c.paidOut > 0) parts.push(`₹${c.paidOut.toLocaleString("en-IN")} (Expense)`);
      lines.push(`• ${c.personName}: ${parts.join(" | ")}`);
    }
  }

  lines.push(``);
  lines.push(`_Utsav Planner Transparent Event Ledger_ 🙏`);

  const whatsappAuditText = lines.join("\n");

  return {
    totalCashInHand,
    totalPromised,
    totalPaidOut,
    readyCashBalance,
    netProjectedBalance,
    contributors,
    whatsappAuditText,
  };
}
