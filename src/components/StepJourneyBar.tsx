"use client";

import React, { useRef } from "react";
import type { AppLanguage } from "@/engine/types";
import { DICTIONARY } from "./LanguageDictionary";
import { STEP_IDS } from "@/lib/nav";

interface StepJourneyBarProps {
  currentLanguage: AppLanguage;
  active: number;
  onSelect: (index: number) => void;
}

/** The four planning steps as real tabs. Clicking one opens that step. */
export function StepJourneyBar({ currentLanguage, active, onSelect }: StepJourneyBarProps) {
  const t = DICTIONARY[currentLanguage];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (idx + 1) % STEP_IDS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + STEP_IDS.length) % STEP_IDS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = STEP_IDS.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onSelect(next);
      refs.current[next]?.focus();
    }
  };

  return (
    <div className="sticky top-[58px] z-30 border-b border-[#e5e5e5] bg-white/95 backdrop-blur sm:top-[64px]">
      <div className="mx-auto max-w-[1120px] px-2 sm:px-8">
        <div role="tablist" aria-label={t.stepsAria} className="grid grid-cols-4">
          {STEP_IDS.map((id, idx) => {
            const isActive = idx === active;
            return (
              <button
                key={id}
                ref={(el) => {
                  refs.current[idx] = el;
                }}
                type="button"
                role="tab"
                id={`step-tab-${idx}`}
                aria-selected={isActive}
                aria-controls={id}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelect(idx)}
                onKeyDown={(e) => onKeyDown(e, idx)}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-center transition-colors sm:flex-row sm:gap-3 ${
                  isActive ? "text-[#111111]" : "text-[#4b4b4d] hover:text-[#111111]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                    isActive ? "bg-[#111111] text-white" : "border border-[#cacacb] text-[#4b4b4d]"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="text-[12px] font-bold leading-tight sm:text-[14px]">{t.stepShort[idx]}</span>
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-0 h-[3px] transition-colors ${isActive ? "bg-[#d97706]" : "bg-transparent"}`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
