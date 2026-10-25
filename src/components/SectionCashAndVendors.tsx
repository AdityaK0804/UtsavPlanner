"use client";

import React, { useState } from "react";
import type {
  AppLanguage,
  EventPlan,
  MoneyRecord,
  VendorChecklist,
} from "@/engine/types";
import { DICTIONARY } from "./LanguageDictionary";
import { Segmented, SegPanel, SeeAll, Caption } from "./SectionKit";
import { checkCashInHand } from "@/engine/cash";
import { summarizeMoneyTracker } from "@/engine/moneyTracker";
import { getDaysRemaining } from "@/engine/timeline";
import { buildWhatsAppLink, formatINR } from "@/lib/whatsapp";
import { fallbackDraftMessages } from "@/ai/fallback";
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, ChevronDown, Plus } from "lucide-react";

interface SectionCashAndVendorsProps {
  currentLanguage: AppLanguage;
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
}

export function SectionCashAndVendors({
  currentLanguage,
  plan,
  onUpdatePlan,
}: SectionCashAndVendorsProps) {
  const t = DICTIONARY[currentLanguage];

  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("vendors");
  const [vendorsExpanded, setVendorsExpanded] = useState(false);
  const [recordsExpanded, setRecordsExpanded] = useState(false);
  const [msgsExpanded, setMsgsExpanded] = useState(false);

  const [recordPerson, setRecordPerson] = useState("");
  const [recordAmount, setRecordAmount] = useState("");
  const [recordType, setRecordType] = useState<"cash_in_hand" | "promised_money" | "paid_out">("cash_in_hand");
  const [recordNote, setRecordNote] = useState("");

  const [copiedAudit, setCopiedAudit] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const primaryDate = plan.subEvents[0]?.dateTime || todayIso;
  const daysLeft = getDaysRemaining(primaryDate, todayIso);

  const cashSummary = checkCashInHand(plan.budgetItems, plan.moneyRecords, daysLeft);
  const moneySummary = summarizeMoneyTracker(plan.title, plan.moneyRecords, plan.totalBudget);
  const { messages, whatsappLinks } = fallbackDraftMessages(plan);

  const handleAddMoneyRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(recordAmount, 10);
    if (!recordPerson.trim() || isNaN(amt) || amt <= 0) return;

    const newRec: MoneyRecord = {
      id: `mr-${Date.now()}`,
      type: recordType,
      personName: recordPerson.trim(),
      amount: amt,
      note: recordNote.trim() || undefined,
      date: todayIso,
    };

    onUpdatePlan({
      ...plan,
      moneyRecords: [newRec, ...plan.moneyRecords],
      version: (plan.version || 1) + 1,
      updatedAt: todayIso,
    });

    setRecordPerson("");
    setRecordAmount("");
    setRecordNote("");
  };

  const handleVendorStatusChange = (
    vendorId: string,
    status: VendorChecklist["bookingStatus"]
  ) => {
    const updatedVendors = plan.vendors.map((v) =>
      v.id === vendorId ? { ...v, bookingStatus: status } : v
    );

    onUpdatePlan({
      ...plan,
      vendors: updatedVendors,
      version: (plan.version || 1) + 1,
      updatedAt: todayIso,
    });
  };

  const handleCopyAuditText = () => {
    navigator.clipboard.writeText(moneySummary.whatsappAuditText);
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };


  const vendorsShown = vendorsExpanded ? plan.vendors : plan.vendors.slice(0, 3);
  const recordsShown = recordsExpanded ? plan.moneyRecords.slice(0, 8) : plan.moneyRecords.slice(0, 3);
  const msgsShown = msgsExpanded ? messages : messages.slice(0, 2);

  const tabs = [
    { id: "vendors", label: `${t.segVendors} (${plan.vendors.length})` },
    { id: "money", label: t.segMoney },
    { id: "messages", label: t.segMsgs },
  ];

  const statRow = (label: string, value: string, color: string) => (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#e5e5e5] py-2 last:border-b-0">
      <span className="text-[13px] font-bold uppercase tracking-wide text-[#4b4b4d]">{label}</span>
      <span className={`text-[18px] font-bold ${color}`}>{value}</span>
    </div>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[5fr_7fr] lg:gap-8">
      {/* Left: the answer, three numbers and one verdict */}
      <div className="bg-white p-6 sm:p-8">
        <Caption>{daysLeft > 0 ? `${daysLeft} days to go` : "Event week!"}</Caption>
        <div className="mt-3">
          {statRow("Advance due now", formatINR(cashSummary.advanceNeededNow), "text-[#111111]")}
          {statRow("Event-week cash", formatINR(cashSummary.neededOnEventWeek), "text-[#111111]")}
          {statRow(
            "Ready in hand",
            formatINR(Math.max(0, cashSummary.cashInHandNow - cashSummary.totalSpentSoFar)),
            "text-[#007d48]"
          )}
        </div>

        {cashSummary.cashShortfallNow > 0 ? (
          <div className="mt-4 flex items-start gap-2.5 border-l-4 border-[#d30005] bg-[#fff1f2] p-3 text-[13px] text-[#111111]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#d30005]" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-bold text-[#d30005]">Missing {formatINR(cashSummary.cashShortfallNow)} ready cash right now.</p>
              <p className="leading-snug text-[#4b4b4d]">{cashSummary.simpleWarning}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 border-l-4 border-[#007d48] bg-[#f0fdf4] p-3 text-[13px] text-[#111111]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#007d48]" aria-hidden="true" />
            <span>
              <strong className="text-[#007d48]">Cash looks fine.</strong> Ready cash covers the advances needed today.
            </span>
          </div>
        )}
      </div>

      {/* Right: vendors, money book, messages */}
      <div className="min-w-0">
        <Segmented options={tabs} value={tab} onChange={setTab} ariaLabel={t.s3Title} idPrefix="s3" />

        <SegPanel idPrefix="s3" id="vendors" active={tab === "vendors"}>
          <ul className="space-y-2">
            {vendorsShown.map((vendor) => {
              const isExpanded = expandedVendorId === vendor.id;
              return (
                <li key={vendor.id} className="overflow-hidden border border-[#e5e5e5] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 pr-3">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedVendorId(isExpanded ? null : vendor.id)}
                      className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 px-2 text-left"
                    >
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#4b4b4d] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-bold text-[#111111]">{vendor.helperType}</span>
                        <span className="block text-[13px] text-[#4b4b4d]">Book {vendor.daysBeforeToBook} days before</span>
                      </span>
                    </button>
                    <select
                      value={vendor.bookingStatus}
                      aria-label={`${vendor.helperType} booking status`}
                      onChange={(e) => handleVendorStatusChange(vendor.id, e.target.value as VendorChecklist["bookingStatus"])}
                      className="h-11 rounded-full border border-[#cacacb] bg-[#f5f5f5] px-4 text-[14px] font-semibold text-[#111111] focus:outline-none"
                    >
                      <option value="not_started">Not started</option>
                      <option value="got_price">Got price</option>
                      <option value="booked">Booked</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  {isExpanded && (
                    <ul className="space-y-2 border-t border-[#e5e5e5] bg-[#f5f5f5] px-5 py-3 text-[14px] text-[#4b4b4d]">
                      {vendor.questionsToAsk.map((q, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-bold text-[#111111]">•</span>
                          <span className="leading-snug">{q}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <SeeAll
            expanded={vendorsExpanded}
            onToggle={() => setVendorsExpanded((v) => !v)}
            total={plan.vendors.length}
            shown={3}
            seeAllLabel={t.seeAll}
            lessLabel={t.showLess}
          />
        </SegPanel>

        <SegPanel idPrefix="s3" id="money" active={tab === "money"}>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2.5">
              <span className="block text-[11px] font-bold uppercase text-[#4b4b4d]">Collected</span>
              <span className="text-[15px] font-bold text-[#007d48]">{formatINR(moneySummary.totalCashInHand)}</span>
            </div>
            <div className="bg-white p-2.5">
              <span className="block text-[11px] font-bold uppercase text-[#4b4b4d]">Promised</span>
              <span className="text-[15px] font-bold text-[#b45309]">{formatINR(moneySummary.totalPromised)}</span>
            </div>
            <div className="bg-white p-2.5">
              <span className="block text-[11px] font-bold uppercase text-[#4b4b4d]">Spent</span>
              <span className="text-[15px] font-bold text-[#111111]">{formatINR(moneySummary.totalPaidOut)}</span>
            </div>
          </div>

          <form onSubmit={handleAddMoneyRecord} className="mt-3 grid gap-2 sm:grid-cols-[1.1fr_1.2fr_1fr_auto]">
            <select
              value={recordType}
              aria-label="Payment record type"
              onChange={(e) => setRecordType(e.target.value as "cash_in_hand" | "promised_money" | "paid_out")}
              className="h-11 rounded-full border border-[#cacacb] bg-white px-4 text-[14px] font-semibold text-[#111111] focus:outline-none"
            >
              <option value="cash_in_hand">Cash collected</option>
              <option value="promised_money">Promised (chanda)</option>
              <option value="paid_out">Paid out (kharcha)</option>
            </select>
            <input
              type="text"
              aria-label="Contributor person name, flat number, or shop name"
              value={recordPerson}
              onChange={(e) => setRecordPerson(e.target.value)}
              placeholder="Person / flat / shop"
              className="h-11 rounded-full border border-[#cacacb] bg-white px-4 text-[14px] text-[#111111] placeholder:text-[#4b4b4d] focus:border-[#111111] focus:outline-none"
            />
            <input
              type="number"
              min={1}
              aria-label="Contribution or payment amount in rupees"
              value={recordAmount}
              onChange={(e) => setRecordAmount(e.target.value)}
              placeholder="₹ amount"
              className="h-11 rounded-full border border-[#cacacb] bg-white px-4 text-[14px] text-[#111111] placeholder:text-[#4b4b4d] focus:border-[#111111] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!recordPerson.trim() || !recordAmount}
              className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#111111] px-5 text-[13px] font-bold text-white hover:bg-black active:scale-95 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add</span>
            </button>
          </form>

          {plan.moneyRecords.length > 0 && (
            <>
              <ul className="mt-3 space-y-1.5">
                {recordsShown.map((rec) => (
                  <li key={rec.id} className="flex items-center justify-between bg-white p-2.5 px-3">
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-bold text-[#111111]">{rec.personName}</span>
                      <span className="block text-[12px] text-[#4b4b4d]">
                        {rec.type === "cash_in_hand" ? "Cash in hand" : rec.type === "promised_money" ? "Promised" : "Paid out"}
                      </span>
                    </span>
                    <span
                      className={`text-[14px] font-bold ${
                        rec.type === "paid_out" ? "text-[#d30005]" : rec.type === "cash_in_hand" ? "text-[#007d48]" : "text-[#b45309]"
                      }`}
                    >
                      {rec.type === "paid_out" ? "-" : "+"}
                      {formatINR(rec.amount)}
                    </span>
                  </li>
                ))}
              </ul>
              <SeeAll
                expanded={recordsExpanded}
                onToggle={() => setRecordsExpanded((v) => !v)}
                total={Math.min(8, plan.moneyRecords.length)}
                shown={3}
                seeAllLabel={t.seeAll}
                lessLabel={t.showLess}
              />
            </>
          )}
          <button
            type="button"
            onClick={handleCopyAuditText}
            className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#111111] px-5 text-[14px] font-bold text-[#111111] hover:bg-[#111111] hover:text-white active:scale-95"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            <span>{copiedAudit ? "Copied" : "Copy for WhatsApp"}</span>
          </button>
        </SegPanel>

        <SegPanel idPrefix="s3" id="messages" active={tab === "messages"}>
          <ul className="space-y-2">
            {msgsShown.map((msg, idx) => {
              const link = whatsappLinks[idx]?.link || buildWhatsAppLink(msg.messageText);
              const isCopied = copiedMsgIdx === idx;
              return (
                <li key={idx} className="space-y-2 bg-white p-3 sm:px-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-[14px] font-bold text-[#111111]">{msg.title}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.messageText, idx)}
                        className="flex min-h-[44px] items-center gap-1 rounded-full border border-[#cacacb] bg-white px-3 text-[13px] font-semibold text-[#111111] hover:border-[#111111] active:scale-95 sm:min-h-[40px]"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isCopied ? "Copied" : "Copy"}</span>
                      </button>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[44px] items-center gap-1 rounded-full bg-[#111111] px-4 text-[13px] font-semibold text-white hover:bg-black active:scale-95 sm:min-h-[40px]"
                      >
                        <span>Send</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-[#4b4b4d]">{msg.messageText}</p>
                </li>
              );
            })}
          </ul>
          <SeeAll
            expanded={msgsExpanded}
            onToggle={() => setMsgsExpanded((v) => !v)}
            total={messages.length}
            shown={2}
            seeAllLabel={t.seeAll}
            lessLabel={t.showLess}
          />
        </SegPanel>
      </div>
    </div>
  );
}
