"use client";

import React, { useState } from "react";
import type {
  AppLanguage,
  ChangeAction,
  ChangePreviewDiff,
  EventPlan,
} from "@/engine/types";
import { DICTIONARY } from "./LanguageDictionary";
import { Segmented, SegPanel, SeeAll, Caption } from "./SectionKit";
import { checkCatererPlateQuote, type CatererPlateQuoteCheck } from "@/engine/guests";
import { previewLifeChanges } from "@/engine/changes";
import { formatINR } from "@/lib/whatsapp";
import { Check, X, RotateCcw, ShieldAlert } from "lucide-react";

interface SectionWhatChangedProps {
  currentLanguage: AppLanguage;
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
  undoStack?: EventPlan[];
  onUndo?: () => void;
}

export function SectionWhatChanged({
  currentLanguage,
  plan,
  onUpdatePlan,
  undoStack = [],
  onUndo,
}: SectionWhatChangedProps) {
  const t = DICTIONARY[currentLanguage];

  // User "What Changed" plain text
  const [changeTextInput, setChangeTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Caterer Quote Check State
  const [quotedPlatesInput, setQuotedPlatesInput] = useState<string>("");
  const [catererCheckResult, setCatererCheckResult] = useState<CatererPlateQuoteCheck | null>(null);

  // Which small tool is open (one at a time keeps the step short)
  const [tab, setTab] = useState<string>("change");
  const [fnExpanded, setFnExpanded] = useState(false);
  const [catExpanded, setCatExpanded] = useState(false);

  // Pending Before/After Diff Preview
  const [pendingDiff, setPendingDiff] = useState<{
    updatedPlan: EventPlan;
    preview: ChangePreviewDiff;
    actions: ChangeAction[];
  } | null>(null);

  // Representative primary sub-event
  const primarySubEvent = plan.subEvents[0] || {
    id: "se-1",
    name: "Main Celebration",
    dateTime: plan.updatedAt,
    guests: {
      invited: 100,
      extraBufferPct: 0.15,
      expectedTotal: 115,
      helperPlates: 10,
      totalPlatesToOrder: 125,
    },
  };

  const guests = primarySubEvent.guests;
  const extraBufferGuests = guests.expectedTotal - guests.invited;

  // Handle Caterer Plate Quote Evaluation
  const handleCheckCatererQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(quotedPlatesInput, 10);
    if (!isNaN(num) && num > 0) {
      const result = checkCatererPlateQuote(num, guests);
      setCatererCheckResult(result);
    }
  };

  // Run Life Change (via /api/change with local deterministic engine fallback)
  const runChangeAction = async (payload: { changeText?: string; directActions?: ChangeAction[] }) => {
    setIsLoading(true);
    const todayIso = new Date().toISOString().slice(0, 10);

    try {
      const res = await fetch("/api/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          changeText: payload.changeText,
          directActions: payload.directActions,
          todayIso,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPendingDiff({
          updatedPlan: data.updatedPlan,
          preview: data.preview,
          actions: data.actions || [],
        });
      } else {
        const localActions: ChangeAction[] = payload.directActions || [];
        const localDiff = previewLifeChanges(plan, localActions, todayIso);
        setPendingDiff({
          updatedPlan: localDiff.updatedPlan,
          preview: localDiff.preview,
          actions: localActions,
        });
      }
    } catch {
      const localActions: ChangeAction[] = payload.directActions || [];
      const localDiff = previewLifeChanges(plan, localActions, todayIso);
      setPendingDiff({
        updatedPlan: localDiff.updatedPlan,
        preview: localDiff.preview,
        actions: localActions,
      });
    } finally {
      setIsLoading(false);
      setChangeTextInput("");
    }
  };

  const handleCustomChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeTextInput.trim()) return;
    runChangeAction({ changeText: changeTextInput.trim() });
  };

  const handleAcceptChange = () => {
    if (!pendingDiff) return;
    onUpdatePlan(pendingDiff.updatedPlan);
    setPendingDiff(null);
  };

  const handleCancelChange = () => {
    setPendingDiff(null);
  };

  // Quick "what changed" shortcuts
  const shockPresets: { label: string; action: ChangeAction }[] = [
    { label: "+50 guests", action: { action: "add_guests", extraInvited: 50 } },
    { label: "Budget 15% lower", action: { action: "cut_or_grow_budget_pct", pctDelta: -15 } },
    { label: "Date 3 weeks earlier", action: { action: "move_date_by_days", daysDelta: -21 } },
    {
      label: "Hall quoted ₹2,10,000",
      action: { action: "enter_real_shop_price", category: "Hall / Marriage Garden & Tent", realPrice: 210000 },
    },
    { label: "Keep food locked", action: { action: "set_do_not_cut", category: "Food & Catering", doNotCut: true } },
  ];

  const tabs = [
    { id: "change", label: t.segChange },
    { id: "caterer", label: t.segCaterer },
    { id: "functions", label: `${t.segFunctions} (${plan.subEvents.length})` },
  ];

  const subEventsShown = fnExpanded ? plan.subEvents : plan.subEvents.slice(0, 3);

  return (
    <div className="grid gap-5 lg:grid-cols-[5fr_7fr] lg:gap-8">
      {/* Left: the answer, first and big */}
      <div className="flex flex-col justify-between bg-white p-6 sm:p-8">
        <div>
          <Caption>{t.platesTitle}</Caption>
          <p className="font-display-campaign mt-2 text-[72px] leading-none text-[#111111] lg:text-[92px]">
            {guests.totalPlatesToOrder}
          </p>
          <p className="mt-4 text-[16px] leading-relaxed text-[#4b4b4d]">
            {t.platesLine
              .replace("{invited}", String(guests.invited))
              .replace("{extra}", String(extraBufferGuests))
              .replace("{helpers}", String(guests.helperPlates))}
          </p>
        </div>
        {undoStack.length > 0 && onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 self-start text-[15px] font-bold text-[#111111] hover:underline"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Undo last change</span>
          </button>
        )}
      </div>

      {/* Right: the one thing to do */}
      <div className="min-w-0">
        {pendingDiff ? (
          <div aria-live="polite" className="space-y-4 border-2 border-[#111111] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display-campaign text-[22px] text-[#111111]">Before and after</h3>
              <span className="rounded-full bg-[#d30005] px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-white">
                Not saved yet
              </span>
            </div>

            <div className="space-y-1">
              {pendingDiff.preview.plainSummaryMessages.slice(0, 2).map((msg, i) => (
                <p key={i} className="text-[14px] leading-relaxed text-[#111111]">
                  {msg}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#f5f5f5] p-4">
              <div>
                <span className="block text-[12px] font-bold uppercase text-[#4b4b4d]">Old total</span>
                <span className="text-[17px] font-bold text-[#4b4b4d] line-through">
                  {formatINR(pendingDiff.preview.totalSummary.oldTotal)}
                </span>
              </div>
              <div>
                <span className="block text-[12px] font-bold uppercase text-[#4b4b4d]">New total</span>
                <span className="text-[18px] font-bold text-[#111111]">
                  {formatINR(pendingDiff.preview.totalSummary.newTotal)}
                </span>
              </div>
            </div>

            {pendingDiff.preview.budgetChanges.length > 0 && (
              <div>
                <div className={`space-y-2 ${catExpanded ? "max-h-52 overflow-y-auto pr-1" : ""}`}>
                  {(catExpanded ? pendingDiff.preview.budgetChanges : pendingDiff.preview.budgetChanges.slice(0, 3)).map(
                    (ch, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 bg-[#f5f5f5] p-3 text-[13px]">
                        <span className="min-w-0 truncate font-bold text-[#111111]">{ch.category}</span>
                        <span className="shrink-0 text-right">
                          <span className="mr-2 text-[#4b4b4d] line-through">{formatINR(ch.oldAmount)}</span>
                          <span
                            className={`font-bold ${
                              ch.difference > 0 ? "text-[#d30005]" : ch.difference < 0 ? "text-[#007d48]" : "text-[#111111]"
                            }`}
                          >
                            {formatINR(ch.newAmount)}
                          </span>
                        </span>
                      </div>
                    )
                  )}
                </div>
                <SeeAll
                  expanded={catExpanded}
                  onToggle={() => setCatExpanded((v) => !v)}
                  total={pendingDiff.preview.budgetChanges.length}
                  shown={3}
                  seeAllLabel={t.seeAll}
                  lessLabel={t.showLess}
                />
              </div>
            )}

            {(pendingDiff.preview.vendorWarnings.length > 0 ||
              pendingDiff.preview.taskWarnings.length > 0 ||
              pendingDiff.preview.cashWarning) && (
              <div className="space-y-1 border-l-4 border-[#d30005] bg-[#fff1f2] p-3 text-[13px] text-[#111111]">
                <div className="flex items-center gap-1.5 font-bold text-[#d30005]">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                  <span>Watch out</span>
                </div>
                {pendingDiff.preview.cashWarning && (
                  <p className="font-semibold text-[#d30005]">• {pendingDiff.preview.cashWarning}</p>
                )}
                {pendingDiff.preview.vendorWarnings.slice(0, 2).map((vw, i) => (
                  <p key={i}>• {vw.plainMessage}</p>
                ))}
                {pendingDiff.preview.taskWarnings.slice(0, 2).map((tw, i) => (
                  <p key={i}>
                    • Task &quot;{tw.title}&quot; is now {tw.status.replace("_", " ")}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAcceptChange}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-[#111111] px-5 text-[14px] font-bold uppercase tracking-wider text-white hover:bg-black active:scale-95"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Accept change</span>
              </button>
              <button
                type="button"
                onClick={handleCancelChange}
                className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-[#111111] ring-1 ring-[#cacacb] hover:bg-[#f5f5f5] active:scale-95"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>Discard</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <Segmented options={tabs} value={tab} onChange={setTab} ariaLabel={t.s1Title} idPrefix="s1" />

            <SegPanel idPrefix="s1" id="change" active={tab === "change"}>
              <form onSubmit={handleCustomChangeSubmit} className="space-y-4">
                <label htmlFor="what-changed-input" className="block text-[17px] font-semibold text-[#111111]">
                  {t.s1Label}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="what-changed-input"
                    type="text"
                    value={changeTextInput}
                    onChange={(e) => setChangeTextInput(e.target.value)}
                    placeholder={t.s1Placeholder}
                    className="h-14 w-full rounded-full border border-[#cacacb] bg-white px-6 text-[16px] text-[#111111] placeholder:text-[#4b4b4d] focus:border-[#111111] focus:outline-none sm:flex-1"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !changeTextInput.trim()}
                    className="h-14 shrink-0 rounded-full bg-[#111111] px-8 text-[15px] font-bold text-white transition-transform hover:bg-black active:scale-95 disabled:opacity-40"
                  >
                    {isLoading ? "…" : t.s1Apply}
                  </button>
                </div>
                <div>
                  <p className="mb-2 text-[14px] font-semibold text-[#4b4b4d]">{t.s1Quick}</p>
                  <div className="flex flex-wrap gap-2">
                    {shockPresets.map((shock, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => runChangeAction({ directActions: [shock.action] })}
                        className="min-h-[44px] rounded-full border border-[#cacacb] bg-white px-4 text-[14px] font-semibold text-[#111111] transition-colors hover:bg-[#111111] hover:text-white active:scale-95"
                      >
                        {shock.label}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </SegPanel>

            <SegPanel idPrefix="s1" id="caterer" active={tab === "caterer"}>
              <div className="space-y-4">
                <p className="text-[16px] text-[#4b4b4d]">{t.catererLine}</p>
                <form onSubmit={handleCheckCatererQuote} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    min={1}
                    aria-label={t.catererToggle}
                    value={quotedPlatesInput}
                    onChange={(e) => setQuotedPlatesInput(e.target.value)}
                    placeholder={`e.g. ${guests.totalPlatesToOrder + 40}`}
                    className="h-14 w-full rounded-full border border-[#cacacb] bg-white px-6 text-[16px] text-[#111111] placeholder:text-[#4b4b4d] focus:border-[#111111] focus:outline-none sm:flex-1"
                  />
                  <button
                    type="submit"
                    className="h-14 shrink-0 rounded-full bg-[#111111] px-8 text-[15px] font-semibold text-white hover:bg-black active:scale-95"
                  >
                    OK
                  </button>
                </form>
                {catererCheckResult && (
                  <div
                    role="status"
                    className={`p-4 text-[15px] leading-relaxed ${
                      catererCheckResult.isHigh
                        ? "border-l-4 border-[#d30005] bg-[#fff1f2] text-[#d30005]"
                        : "border-l-4 border-[#007d48] bg-[#f0fdf4] text-[#007d48]"
                    }`}
                  >
                    {catererCheckResult.plainAdvice}
                  </div>
                )}
              </div>
            </SegPanel>

            <SegPanel idPrefix="s1" id="functions" active={tab === "functions"}>
              <ul className="space-y-2">
                {subEventsShown.map((se) => (
                  <li key={se.id} className="flex items-center justify-between gap-4 bg-white p-4">
                    <span className="min-w-0">
                      <span className="block truncate text-[16px] font-bold text-[#111111]">{se.name}</span>
                      <span className="block text-[13px] text-[#4b4b4d]">
                        {se.dateTime} · {se.guests.invited} invited
                        {se.hallMaxCapacity ? ` · hall holds ${se.hallMaxCapacity}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[22px] font-bold text-[#111111]">{se.guests.totalPlatesToOrder}</span>
                      <span className="block text-[12px] uppercase text-[#4b4b4d]">plates</span>
                    </span>
                  </li>
                ))}
              </ul>
              <SeeAll
                expanded={fnExpanded}
                onToggle={() => setFnExpanded((v) => !v)}
                total={plan.subEvents.length}
                shown={3}
                seeAllLabel={t.seeAll}
                lessLabel={t.showLess}
              />
            </SegPanel>
          </>
        )}
      </div>
    </div>
  );
}
