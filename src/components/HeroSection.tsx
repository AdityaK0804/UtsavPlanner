"use client";

import React, { useState, useRef, useEffect } from "react";
import type { AppLanguage, EventPlan } from "@/engine/types";
import { DICTIONARY } from "./LanguageDictionary";
import {
  PRESET_WEDDING,
  PRESET_BIRTHDAY,
  PRESET_COLONY,
  createPlanFromTemplate,
} from "@/templates";
import { ArrowRight, Search } from "lucide-react";
import { goToSection } from "@/lib/nav";

interface HeroSectionProps {
  currentLanguage: AppLanguage;
  onPlanCreated: (plan: EventPlan) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

export function HeroSection({
  currentLanguage,
  onPlanCreated,
  isLoading = false,
  setIsLoading,
}: HeroSectionProps) {
  const t = DICTIONARY[currentLanguage];
  const [promptInput, setPromptInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const heroSearchRef = useRef<HTMLDivElement>(null);

  // Close search template popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    if (isSearchFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchFocused]);

  // Quick preset triggers
  const quickPresets = [
    {
      label: "Jaipur Shadi (₹8L)",
      fn: () => ({ ...PRESET_WEDDING, language: currentLanguage }),
    },
    {
      label: "1st Birthday at Home (₹15K)",
      fn: () => ({ ...PRESET_BIRTHDAY, language: currentLanguage }),
    },
    {
      label: "Colony Ganesh Utsav (₹1.2L)",
      fn: () => ({ ...PRESET_COLONY, language: currentLanguage }),
    },
    {
      label: "Griha Pravesh & Bhoj (₹35K)",
      fn: () =>
        createPlanFromTemplate({
          eventType: "colony_festival",
          title: "Griha Pravesh & Puja Bhoj",
          city: "Lucknow",
          citySize: "medium_city",
          eventDate: "2026-11-20",
          invitedGuests: 80,
          totalBudget: 35000,
          mustHaveCategories: ["Mahaprasad / Bhandara Food"],
          language: currentLanguage,
        }),
    },
  ];

  const handleBuildPlan = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = (customPrompt || promptInput).trim();
    if (!query) return;

    setErrorMessage(null);
    setIsSearchFocused(false);
    if (setIsLoading) setIsLoading(true);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: query,
          language: currentLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to build event plan.");
      }

      onPlanCreated(data.plan);
      setTimeout(() => {
        goToSection("what-changed");
      }, 100);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Plan creation failed. Please check your connection and try again."
      );
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  };

  const handleSelectQuick = (fn: () => EventPlan) => {
    const plan = fn();
    plan.language = currentLanguage;
    onPlanCreated(plan);
    setIsSearchFocused(false);
    setTimeout(() => {
      goToSection("what-changed");
    }, 100);
  };

  const handleSelectTemplateOption = (item: { type: "prompt" | "scroll"; value: string; label: string }) => {
    setIsSearchFocused(false);
    if (item.type === "scroll") {
      goToSection(item.value);
    } else {
      setPromptInput(item.value);
      handleBuildPlan(undefined, item.value);
    }
  };

  // Search Template Categories for interactive focus popover
  const searchTemplates = [
    {
      group: t.heroBlueprints,
      items: [
        { label: "Grand Jaipur wedding (₹8L, 250 guests)", type: "prompt" as const, value: "Grand Jaipur Wedding 250 guests 8 lakh" },
        { label: "Haldi ceremony (₹1.5L, 120 guests)", type: "prompt" as const, value: "Phoolon ki Haldi 120 guests 1.5 lakh" },
        { label: "First birthday (₹18K, 40 guests)", type: "prompt" as const, value: "1st Birthday party 40 guests 18000" },
        { label: "Mohalla Ganesh Utsav (₹1.2L, 350 families)", type: "prompt" as const, value: "Mohalla Ganesh Utsav 350 guests 1.2 lakh" },
        { label: "Griha Pravesh (₹45K, 75 guests)", type: "prompt" as const, value: "Griha Pravesh & Shanti Havan 75 guests 45000" },
      ],
    },
    {
      group: t.stepsAria,
      items: [
        { label: `1. ${t.stepShort[0]}`, type: "scroll" as const, value: "what-changed" },
        { label: `2. ${t.stepShort[1]}`, type: "scroll" as const, value: "budget-breakdown" },
        { label: `3. ${t.stepShort[2]}`, type: "scroll" as const, value: "cash-vendors" },
        { label: `4. ${t.stepShort[3]}`, type: "scroll" as const, value: "checklist-timeline" },
      ],
    },
  ];

  // Language-specific redefined taglines and headlines
  const getHeadlineContent = () => {
    if (currentLanguage === "hi") {
      return {
        line1: "हर उत्सव का सच्चा हिसाब",
        line2: "खुल के मनाओ हर पल",
        subtitle: "बुकिंग से पहले जानिए, हर रुपया कहां जाएगा।",
        placeholder: "जैसे: बहन की शादी 200 मेहमान, ₹8 लाख बजट, इंदौर में...",
        btnLabel: "प्लान बनाएं",
      };
    }
    if (currentLanguage === "en") {
      return {
        line1: "EVERY CELEBRATION",
        line2: "CALCULATED RIGHT",
        subtitle: "Know where every rupee goes, before you book anything.",
        placeholder: "e.g. 200 guests wedding in Jaipur, ₹8 Lakh budget, Indore...",
        btnLabel: "Build my plan",
      };
    }
    // Default: Hinglish
    return {
      line1: "HAR CELEBRATION KA SAHI HISAB",
      line2: "KHUL KE MANAO UTSAV",
      subtitle: "Booking se pehle jaano, har rupaya kahan jayega.",
      placeholder: "e.g. 250 log ki shadi, 8 lakh budget, Indore me, pure veg...",
      btnLabel: "Plan banao",
    };
  };

  const copy = getHeadlineContent();

  return (
    <section id="hero" className="relative w-full overflow-hidden border-b border-[#39393b] text-white">
      {/* Background photo with a calm dark scrim on the text side, so every word stays easy to read */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2000&q=85"
          alt="Marigold flowers and a decorated Indian wedding stage"
          className="h-full w-full object-cover object-center saturate-[1.08]"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "linear-gradient(to right, rgba(12,10,9,0.9) 0%, rgba(12,10,9,0.78) 55%, rgba(12,10,9,0.25) 100%)" }}
        />
        <div className="absolute inset-0 bg-[#0c0a09]/60 md:hidden" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09]/60 via-[#0c0a09]/15 to-[#0c0a09]/30" />
        {/* Keeps the see-through navigation easy to read */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0c0a09]/70 to-transparent" />
        {/* Fine paper-like line texture, very faint */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 8px)",
          }}
        />
      </div>

      {/* Main content, left aligned */}
      <div className="relative z-10 mx-auto max-w-[1280px] space-y-8 px-4 pb-14 pt-[calc(58px+3rem)] sm:space-y-9 sm:px-8 sm:pb-20 sm:pt-[calc(64px+4.5rem)]">
        <div className="max-w-3xl text-left">
          {/* A small gold ornament instead of a badge */}
          <div className="mb-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px w-12 bg-[#fbbf24]" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[#fbbf24]" />
          </div>

          <h1 className="font-display-campaign text-[34px] uppercase leading-[1] text-white [letter-spacing:-0.02em] [text-shadow:0_2px_22px_rgba(0,0,0,0.5)] sm:text-[48px] md:text-[60px]">
            {copy.line1} <br />
            <span className="text-[#fbbf24]">{copy.line2}</span>
          </h1>

          <p className="mt-5 max-w-2xl text-[16px] font-normal leading-[1.65] text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.55)] sm:text-[18px]">
            {copy.subtitle}
          </p>
        </div>

        {/* Describe your celebration */}
        <div ref={heroSearchRef} className="relative max-w-4xl text-left">
          <form
            onSubmit={(e) => handleBuildPlan(e)}
            className="flex flex-col items-stretch gap-2 rounded-[28px] border border-white/30 bg-[#0c0a09]/72 p-2 backdrop-blur-md transition-colors focus-within:border-[#fbbf24] sm:flex-row sm:items-center sm:rounded-full"
          >
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none ml-4 mr-1 h-5 w-5 shrink-0 text-white/70" aria-hidden="true" />
              <input
                id="hero-prompt-input"
                type="text"
                aria-label="Describe your celebration"
                value={promptInput}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={copy.placeholder}
                className="h-12 w-full bg-transparent px-2 text-[16px] text-white placeholder:text-white/70 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !promptInput.trim()}
              className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#fbbf24] px-8 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#f59e0b] active:scale-95 disabled:opacity-50"
            >
              <span>{isLoading ? "…" : copy.btnLabel}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          {/* Examples list while typing */}
          {isSearchFocused && (
            <div className="absolute left-0 right-0 top-full z-50 mt-3 rounded-2xl border border-white/20 bg-[#0c0a09]/96 p-4 text-left shadow-2xl backdrop-blur-xl">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {searchTemplates.map((section, sIdx) => (
                  <div key={sIdx}>
                    <span className="mb-2 block px-1 text-[12px] font-bold uppercase tracking-[0.14em] text-white/75">
                      {section.group}
                    </span>
                    <div className="space-y-1">
                      {section.items.map((item, iIdx) => (
                        <button
                          key={iIdx}
                          type="button"
                          onClick={() => handleSelectTemplateOption(item)}
                          className="group flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-3 text-left transition-colors hover:bg-white/10"
                        >
                          <span className="text-[14px] font-medium text-white">{item.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/50 transition-transform group-hover:translate-x-0.5 group-hover:text-[#fbbf24]" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMessage && <p className="mt-2 pl-2 text-[13px] font-semibold text-[#ffb4b4]">{errorMessage}</p>}

          {/* Quick starting points */}
          <div className="-mx-4 mt-5 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 text-left [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            <span className="mr-1 shrink-0 whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.14em] text-white/80">{t.heroBlueprints}</span>
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectQuick(preset.fn)}
                className="min-h-[44px] shrink-0 whitespace-nowrap rounded-full border border-white/40 bg-[#0c0a09]/35 px-3.5 text-[13px] font-medium text-white transition-colors hover:border-white hover:bg-white/15 active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Three plain promises, on a quiet dark band */}
      <div className="relative z-10 border-t border-white/15 bg-[#0c0a09]/78 backdrop-blur-sm">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 py-6 sm:px-8 sm:py-8 md:grid-cols-3 md:gap-10">
          {[
            { n: "01", h: t.heroRule1, p: t.heroRule1Line },
            { n: "02", h: t.heroRule2, p: t.heroRule2Line },
            { n: "03", h: t.heroRule3, p: t.heroRule3Line },
          ].map((r) => (
            <div key={r.n} className="flex gap-4 text-left">
              <span className="font-display-campaign pt-0.5 text-[20px] text-[#fbbf24]" aria-hidden="true">
                {r.n}
              </span>
              <div>
                <h3 className="text-[16px] font-bold text-white">{r.h}</h3>
                <p className="mt-1 text-[14px] leading-normal text-[#e5e5e5]">{r.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
