"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AppLanguage, EventPlan } from "@/engine/types";
import { DICTIONARY } from "./LanguageDictionary";
import { StepJourneyBar } from "./StepJourneyBar";
import { SectionWhatChanged } from "./SectionWhatChanged";
import { SectionBudgetLocks } from "./SectionBudgetLocks";
import { SectionCashAndVendors } from "./SectionCashAndVendors";
import { SectionTimelineAndIdeas } from "./SectionTimelineAndIdeas";
import { GOTO_STEP_EVENT, STEP_IDS } from "@/lib/nav";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PlannerWorkspaceProps {
  currentLanguage: AppLanguage;
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
  undoStack: EventPlan[];
  onUndo: () => void;
}

/**
 * One compact workspace for the four planning steps.
 * Only the open step takes up space; the others stay mounted (hidden) so nothing you typed is lost.
 */
export function PlannerWorkspace({ currentLanguage, plan, onUpdatePlan, undoStack, onUndo }: PlannerWorkspaceProps) {
  const t = DICTIONARY[currentLanguage];
  const [step, setStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const scrollToPlanner = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Anything on the page can open a step: nav, hero, cards, footer
  useEffect(() => {
    const onGoto = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const idx = (STEP_IDS as readonly string[]).indexOf(id);
      if (idx < 0) return;
      setStep(idx);
      requestAnimationFrame(() => requestAnimationFrame(scrollToPlanner));
    };
    window.addEventListener(GOTO_STEP_EVENT, onGoto);
    return () => window.removeEventListener(GOTO_STEP_EVENT, onGoto);
  }, []);

  const select = (idx: number) => {
    setStep(idx);
    // If the page is scrolled down inside the planner, bring the new step back to the top
    const top = sectionRef.current?.getBoundingClientRect().top ?? 0;
    if (top < -4) requestAnimationFrame(() => requestAnimationFrame(scrollToPlanner));
  };

  const titles = [t.s1Title, t.s2Title, t.s3Title, t.s4Title];
  const lines = [t.s1Line, t.s2Line, t.s3Line, t.s4Line];
  const nextLabels = [t.s1Next, t.s2Next, t.s3Next, ""];

  const go = (idx: number) => {
    setStep(idx);
    requestAnimationFrame(() => requestAnimationFrame(scrollToPlanner));
  };

  return (
    <section
      id="planner"
      ref={sectionRef}
      aria-label={t.stepsAria}
      className="relative w-full scroll-mt-[58px] border-b border-[#e5e5e5] bg-[#f5f5f5] sm:scroll-mt-[64px]"
    >
      <StepJourneyBar currentLanguage={currentLanguage} active={step} onSelect={select} />

      <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-8 sm:py-6">
        {STEP_IDS.map((id, idx) => (
          <div key={id} id={id} role="tabpanel" aria-labelledby={`step-tab-${idx}`} hidden={step !== idx}>
            <>
                <header className="mb-4 flex flex-col gap-1 sm:mb-5">
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#b45309]">
                    {t.stepLabel.replace("{n}", String(idx + 1))}
                  </p>
                  <h2 className="font-display-campaign text-[28px] text-[#111111] sm:text-[34px] lg:text-[34px]">{titles[idx]}</h2>
                  <p className="max-w-[48rem] text-[15px] leading-relaxed text-[#4b4b4d] sm:text-[16px]">{lines[idx]}</p>
                </header>

                {idx === 0 && (
                  <SectionWhatChanged
                    currentLanguage={currentLanguage}
                    plan={plan}
                    onUpdatePlan={onUpdatePlan}
                    undoStack={undoStack}
                    onUndo={onUndo}
                  />
                )}
                {idx === 1 && <SectionBudgetLocks currentLanguage={currentLanguage} plan={plan} onUpdatePlan={onUpdatePlan} />}
                {idx === 2 && <SectionCashAndVendors currentLanguage={currentLanguage} plan={plan} onUpdatePlan={onUpdatePlan} />}
                {idx === 3 && <SectionTimelineAndIdeas currentLanguage={currentLanguage} plan={plan} onUpdatePlan={onUpdatePlan} />}

                <div className="mt-5 flex items-center justify-between gap-3 sm:mt-5">
                  {idx > 0 ? (
                    <button
                      type="button"
                      onClick={() => go(idx - 1)}
                      className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[#111111] px-5 text-[14px] font-bold text-[#111111] hover:bg-[#111111] hover:text-white active:scale-95"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      <span>{t.stepBack}</span>
                    </button>
                  ) : (
                    <span />
                  )}
                  {idx < STEP_IDS.length - 1 && (
                    <button
                      type="button"
                      onClick={() => go(idx + 1)}
                      className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#111111] px-6 text-[14px] font-bold text-white hover:bg-black active:scale-95"
                    >
                      <span>{nextLabels[idx]}</span>
                      <ArrowRight className="h-4 w-4 text-[#f59e0b]" aria-hidden="true" />
                    </button>
                  )}
                </div>
            </>
          </div>
        ))}
      </div>
    </section>
  );
}
