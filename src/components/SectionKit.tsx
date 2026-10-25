"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export interface SegmentOption {
  id: string;
  label: string;
}

/**
 * A small row of tabs. Only one panel is shown at a time, so a step never gets long.
 * Keyboard: Left/Right/Home/End move between tabs, Tab leaves the row.
 */
export function Segmented({
  options,
  value,
  onChange,
  ariaLabel,
  idPrefix,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  idPrefix: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (idx + 1) % options.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(options[next].id);
      refs.current[next]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-full border border-[#cacacb] bg-white p-1"
    >
      {options.map((opt, idx) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${opt.id}`}
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${opt.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.id)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 text-[13px] font-bold transition-colors sm:min-h-[40px] ${
              active ? "bg-[#111111] text-white" : "text-[#111111] hover:bg-[#f5f5f5]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function SegPanel({
  idPrefix,
  id,
  active,
  children,
}: {
  idPrefix: string;
  id: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      hidden={!active}
      className="mt-4"
    >
      {active ? children : null}
    </div>
  );
}

/** "See all (12)" / "Show less" under a short list. */
export function SeeAll({
  expanded,
  onToggle,
  total,
  shown,
  seeAllLabel,
  lessLabel,
}: {
  expanded: boolean;
  onToggle: () => void;
  total: number;
  shown: number;
  seeAllLabel: string;
  lessLabel: string;
}) {
  if (total <= shown) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-[14px] font-bold text-[#111111] hover:underline"
    >
      <span>{expanded ? lessLabel : seeAllLabel.replace("{n}", String(total))}</span>
      <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
    </button>
  );
}

/** Small uppercase caption above a number. */
export function Caption({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#4b4b4d]">{children}</p>;
}
