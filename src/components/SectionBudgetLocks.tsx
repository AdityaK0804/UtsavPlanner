"use client";

import React, { useState } from "react";
import type {
  AppLanguage,
  BudgetItem,
  EventPlan,
  OptionComparison,
  PriceStatus,
} from "@/engine/types";
import { DICTIONARY } from "./LanguageDictionary";
import { Segmented, SegPanel, SeeAll, Caption } from "./SectionKit";
import { rebalanceBudget, comparePlateOptions } from "@/engine/budget";
import { formatINR } from "@/lib/whatsapp";
import { Lock, Unlock, Check, AlertCircle, Plus, Edit3 } from "lucide-react";

interface SectionBudgetLocksProps {
  currentLanguage: AppLanguage;
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
}

export function SectionBudgetLocks({
  currentLanguage,
  plan,
  onUpdatePlan,
}: SectionBudgetLocksProps) {
  const t = DICTIONARY[currentLanguage];

  // Inline Real Price Input state (category -> value string)
  const [realPriceInputs, setRealPriceInputs] = useState<Record<string, string>>({});
  const [activeEditCategory, setActiveEditCategory] = useState<string | null>(null);
  const [overBudgetWarning, setOverBudgetWarning] = useState<string | null>(null);

  const [tab, setTab] = useState<string>("items");
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [extrasExpanded, setExtrasExpanded] = useState(false);
  const [tipsExpanded, setTipsExpanded] = useState(false);

  // Plate Option Compare State
  const [optAGuests, setOptAGuests] = useState(
    Math.round((plan.subEvents[0]?.guests.invited || 100) * 0.75)
  );
  const [optAPrice, setOptAPrice] = useState(700);

  const [optBGuests, setOptBGuests] = useState(
    Math.round((plan.subEvents[0]?.guests.invited || 100) * 1.25)
  );
  const [optBPrice, setOptBPrice] = useState(420);

  // Run Plate Option Compare
  const plateComparisons: OptionComparison[] = comparePlateOptions(
    plan.totalBudget,
    45,
    [
      {
        label: "Option A: Fewer Guests, Royal Buffet",
        invitedGuests: optAGuests,
        perPlateCost: optAPrice,
      },
      {
        label: "Option B: More Guests, Wholesome Festive Meal",
        invitedGuests: optBGuests,
        perPlateCost: optBPrice,
      },
    ]
  );

  // 1-click toggle: protect an item from being cut
  const handleToggleLock = (itemId: string) => {
    const updatedItems = plan.budgetItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, doNotCut: !item.doNotCut };
      }
      return item;
    });

    const rebal = rebalanceBudget(
      updatedItems,
      {},
      plan.totalBudget,
      plan.emergencyBufferPct
    );

    setOverBudgetWarning(rebal.warning || null);

    onUpdatePlan({
      ...plan,
      budgetItems: rebal.items,
      version: (plan.version || 1) + 1,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };

  // Submit Real Shop Price for Category
  const handleApplyRealPrice = (category: string) => {
    const rawVal = realPriceInputs[category];
    const priceNum = parseInt(rawVal, 10);
    if (isNaN(priceNum) || priceNum < 0) return;

    const rebal = rebalanceBudget(
      plan.budgetItems,
      { realPrices: [{ category, price: priceNum }] },
      plan.totalBudget,
      plan.emergencyBufferPct
    );

    setOverBudgetWarning(rebal.warning || null);

    onUpdatePlan({
      ...plan,
      budgetItems: rebal.items,
      version: (plan.version || 1) + 1,
      updatedAt: new Date().toISOString().slice(0, 10),
    });

    setRealPriceInputs((prev) => ({ ...prev, [category]: "" }));
  };

  // Add Forgotten Extra Expense to Plan
  const handleAddExtraExpense = (extraId: string) => {
    const extra = plan.extraExpenseWarnings.find((w) => w.id === extraId);
    if (!extra || extra.addedToPlan) return;

    const updatedWarnings = plan.extraExpenseWarnings.map((w) =>
      w.id === extraId ? { ...w, addedToPlan: true } : w
    );

    const newItem: BudgetItem = {
      id: `extra-item-${Date.now()}`,
      category: extra.title,
      howItScales: "fixed_price",
      plannedAmount: extra.typicalAmount,
      status: "typical_estimate",
      doNotCut: true,
      currentStyle: "smart_mix",
      styleOptions: {
        full_vendor_service: extra.simpleReason,
        smart_mix: extra.simpleReason,
        home_halwai_diy: extra.simpleReason,
      },
      savingTip: extra.simpleReason,
      advanceNeededPct: 50,
      eventWeekNeededPct: 50,
    };

    const rebal = rebalanceBudget(
      [...plan.budgetItems, newItem],
      {},
      plan.totalBudget + extra.typicalAmount,
      plan.emergencyBufferPct
    );

    onUpdatePlan({
      ...plan,
      totalBudget: plan.totalBudget + extra.typicalAmount,
      budgetItems: rebal.items,
      extraExpenseWarnings: updatedWarnings,
      version: (plan.version || 1) + 1,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };


  // Price Status Pill Helper
  const renderStatusPill = (status: PriceStatus) => {
    switch (status) {
      case "real_shop_price":
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#fff1f2] text-[#d30005] border border-[#fecdd3]">
            Real Shop Price
          </span>
        );
      case "paid":
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#f0fdf4] text-[#007d48] border border-[#bbf7d0]">
            Paid
          </span>
        );
      case "ai_idea":
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#f5f5f5] text-[#111111] border border-[#cacacb]">
            Idea
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#f5f5f5] text-[#707072]">
            Typical Estimate
          </span>
        );
    }
  };

  const itemsWithSavingTips = plan.budgetItems.filter(
    (it) => it.savingTip && it.currentStyle !== "full_vendor_service"
  );

  const sortedItems = [...plan.budgetItems].sort((a, b) => b.plannedAmount - a.plannedAmount);
  const itemsShown = itemsExpanded ? sortedItems : sortedItems.slice(0, 4);
  const lockedCount = plan.budgetItems.filter((i) => i.doNotCut).length;
  const extras = plan.extraExpenseWarnings;
  const extrasShown = extrasExpanded ? extras : extras.slice(0, 3);
  const tipsShown = tipsExpanded ? itemsWithSavingTips : itemsWithSavingTips.slice(0, 3);

  const tabs = [
    { id: "items", label: t.segItems },
    ...(itemsWithSavingTips.length > 0 ? [{ id: "tips", label: t.segSave }] : []),
    { id: "compare", label: t.segCompare },
    ...(extras.length > 0 ? [{ id: "extras", label: `${t.segExtras} (${extras.length})` }] : []),
  ];

  const optionCard = (
    name: string,
    letter: string,
    guests: number,
    setGuests: (n: number) => void,
    price: number,
    setPrice: (n: number) => void,
    verdict: string | undefined,
    good: boolean
  ) => (
    <div className="space-y-3 bg-white p-4">
      <span className="block text-[14px] font-bold text-[#111111]">{name}</span>
      <label className="block">
        <span className="mb-1 block text-[13px] font-medium text-[#4b4b4d]">Invited guests</span>
        <input
          type="number"
          min={10}
          aria-label={`Option ${letter} invited guests count`}
          value={guests}
          onChange={(e) => setGuests(parseInt(e.target.value, 10) || 10)}
          className="h-11 w-full border border-[#cacacb] bg-white px-3 text-[15px] font-bold text-[#111111] focus:border-[#111111] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[13px] font-medium text-[#4b4b4d]">Price per plate (₹)</span>
        <input
          type="number"
          min={100}
          aria-label={`Option ${letter} per plate cost in rupees`}
          value={price}
          onChange={(e) => setPrice(parseInt(e.target.value, 10) || 100)}
          className="h-11 w-full border border-[#cacacb] bg-white px-3 text-[15px] font-bold text-[#111111] focus:border-[#111111] focus:outline-none"
        />
      </label>
      <p className={`text-[13px] font-semibold leading-snug ${good ? "text-[#007d48]" : "text-[#d30005]"}`}>{verdict}</p>
    </div>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[5fr_7fr] lg:gap-8">
      {/* Left: the answer */}
      <div className="flex flex-col bg-white p-6 sm:p-8">
        <Caption>{t.s2Total}</Caption>
        <p className="font-display-campaign mt-2 text-[48px] leading-none text-[#111111] sm:text-[56px] lg:text-[64px]">
          ₹{plan.totalBudget.toLocaleString("en-IN")}
        </p>

        {/* One slim bar shows how it is split */}
        <div className="mt-6 flex h-3 w-full overflow-hidden bg-[#f5f5f5]" aria-hidden="true">
          {plan.budgetItems.map((item, idx) => {
            const pct = Math.max(3, Math.round((item.plannedAmount / (plan.totalBudget || 1)) * 100));
            const palette = ["bg-[#111111]", "bg-[#39393b]", "bg-[#707072]", "bg-[#9e9ea0]", "bg-[#007d48]", "bg-[#d97706]", "bg-[#cacacb]"];
            return <div key={item.id} style={{ width: `${pct}%` }} className={`${palette[idx % palette.length]} h-full`} />;
          })}
        </div>
        <p className="mt-3 inline-flex items-center gap-2 text-[14px] font-bold text-[#111111]">
          <Lock className="h-4 w-4" aria-hidden="true" />
          {t.lockedCount.replace("{n}", String(lockedCount)).replace("{total}", String(plan.budgetItems.length))}
        </p>

        {overBudgetWarning && (
          <div role="status" className="mt-5 flex items-start gap-3 border-l-4 border-[#d30005] bg-[#fff1f2] p-3 text-[14px] text-[#111111]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#d30005]" aria-hidden="true" />
            <p>{overBudgetWarning}</p>
          </div>
        )}
      </div>

      {/* Right: costs, with the extra tools one tab away */}
      <div className="min-w-0">
        <Segmented options={tabs} value={tab} onChange={setTab} ariaLabel={t.s2Title} idPrefix="s2" />

        <SegPanel idPrefix="s2" id="items" active={tab === "items"}>
          <ul className="space-y-2">
            {itemsShown.map((item) => (
              <li
                key={item.id}
                className={`border bg-white p-3 sm:px-4 ${item.doNotCut ? "border-[#111111]" : "border-[#e5e5e5]"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
                    <h4 className="text-[15px] sm:truncate font-bold text-[#111111]">{item.category}</h4>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[16px] font-bold text-[#111111]">{formatINR(item.plannedAmount)}</span>
                      {renderStatusPill(item.status)}
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setActiveEditCategory(activeEditCategory === item.category ? null : item.category)}
                      aria-expanded={activeEditCategory === item.category}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full border border-[#cacacb] bg-[#f5f5f5] px-3 text-[13px] font-semibold text-[#111111] hover:bg-[#e5e5e5] active:scale-95 sm:min-h-[40px]"
                      title="Enter quote from market vendor"
                    >
                      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{activeEditCategory === item.category ? "Close" : "Shop price"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleLock(item.id)}
                      aria-pressed={item.doNotCut}
                      className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold active:scale-95 sm:min-h-[40px] ${
                        item.doNotCut
                          ? "bg-[#111111] text-white hover:bg-black"
                          : "border border-[#cacacb] bg-[#f5f5f5] text-[#111111] hover:bg-[#e5e5e5]"
                      }`}
                      title={item.doNotCut ? "Click to unlock" : "Click to lock and protect"}
                    >
                      {item.doNotCut ? <Lock className="h-3.5 w-3.5" aria-hidden="true" /> : <Unlock className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span>{item.doNotCut ? "Locked" : "Lock"}</span>
                    </button>
                  </div>
                </div>

                {activeEditCategory === item.category && (
                  <div className="mt-3 space-y-2 border-t border-[#e5e5e5] pt-3">
                    <p className="text-[13px] font-semibold text-[#39393b]">
                      Got a quote from the market? Enter the real shop price for {item.category}.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[#4b4b4d]">₹</span>
                        <input
                          type="number"
                          autoFocus
                          min={0}
                          aria-label={`Real shop price for ${item.category}`}
                          value={realPriceInputs[item.category] || ""}
                          onChange={(e) => setRealPriceInputs({ ...realPriceInputs, [item.category]: e.target.value })}
                          placeholder="e.g. 85000"
                          className="h-11 w-full rounded-full border border-[#cacacb] bg-white pl-9 pr-4 text-[15px] font-bold text-[#111111] placeholder:text-[#4b4b4d] focus:border-[#111111] focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleApplyRealPrice(item.category);
                          setActiveEditCategory(null);
                        }}
                        disabled={!realPriceInputs[item.category]}
                        className="h-11 shrink-0 rounded-full bg-[#111111] px-6 text-[13px] font-bold uppercase tracking-wider text-white hover:bg-black active:scale-95 disabled:opacity-40"
                      >
                        Balance budget
                      </button>
                    </div>
                    <p className="text-[12px] text-[#4b4b4d]">
                      Locked items stay safe. The rest adjust so your total stays {formatINR(plan.totalBudget)}.
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <SeeAll
            expanded={itemsExpanded}
            onToggle={() => setItemsExpanded((v) => !v)}
            total={sortedItems.length}
            shown={4}
            seeAllLabel={t.seeAll}
            lessLabel={t.showLess}
          />
        </SegPanel>

        <SegPanel idPrefix="s2" id="tips" active={tab === "tips"}>
          <ul className="space-y-2">
            {tipsShown.map((it) => (
              <li key={it.id} className="bg-white p-4 text-[15px] text-[#111111]">
                <strong className="block font-bold">{it.category}</strong>
                <p className="mt-1 leading-relaxed text-[#4b4b4d]">{it.savingTip}</p>
              </li>
            ))}
          </ul>
          <SeeAll
            expanded={tipsExpanded}
            onToggle={() => setTipsExpanded((v) => !v)}
            total={itemsWithSavingTips.length}
            shown={3}
            seeAllLabel={t.seeAll}
            lessLabel={t.showLess}
          />
        </SegPanel>

        <SegPanel idPrefix="s2" id="compare" active={tab === "compare"}>
          <div className="grid gap-3 sm:grid-cols-2">
            {optionCard("Option A: fewer guests", "A", optAGuests, setOptAGuests, optAPrice, setOptAPrice, plateComparisons[0]?.plainVerdict, true)}
            {optionCard("Option B: bigger gathering", "B", optBGuests, setOptBGuests, optBPrice, setOptBPrice, plateComparisons[1]?.plainVerdict, false)}
          </div>
        </SegPanel>

        <SegPanel idPrefix="s2" id="extras" active={tab === "extras"}>
          <ul className="space-y-2">
            {extrasShown.map((warning) => (
              <li key={warning.id} className="flex items-center justify-between gap-3 bg-white p-3 sm:px-4">
                <div className="min-w-0">
                  <span className="block truncate text-[14px] font-bold text-[#111111]">{warning.title}</span>
                  <span className="block truncate text-[13px] text-[#4b4b4d]">{warning.simpleReason}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[14px] font-bold text-[#111111]">{formatINR(warning.typicalAmount)}</span>
                  {warning.addedToPlan ? (
                    <span className="flex items-center gap-1 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[12px] font-bold text-[#007d48]">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddExtraExpense(warning.id)}
                      className="flex min-h-[44px] items-center gap-1 rounded-full bg-[#111111] px-4 text-[13px] font-semibold text-white hover:bg-black active:scale-95 sm:min-h-[40px]"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <SeeAll
            expanded={extrasExpanded}
            onToggle={() => setExtrasExpanded((v) => !v)}
            total={extras.length}
            shown={3}
            seeAllLabel={t.seeAll}
            lessLabel={t.showLess}
          />
        </SegPanel>
      </div>
    </div>
  );
}
