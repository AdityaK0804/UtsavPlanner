"use client";

import React, { useState, useEffect, useRef } from "react";
import type { AppLanguage } from "@/engine/types";
import { DICTIONARY } from "./LanguageDictionary";
import { UtsavLogo } from "./UtsavLogo";
import { LanguageToggle } from "./LanguageToggle";
import { goToSection } from "@/lib/nav";
import { Menu, X, HelpCircle } from "lucide-react";

interface AppleNavbarProps {
  currentLanguage: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  onPlanNowClick?: () => void;
  onSearchPrompt?: (prompt: string) => void;
  onOpenGuide?: () => void;
}

export function AppleNavbar({ currentLanguage, onLanguageChange, onPlanNowClick, onOpenGuide }: AppleNavbarProps) {
  const t = DICTIONARY[currentLanguage];
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Four plain links. Everything else is one tap away inside the planner.
  const links = [
    { id: "cards-section", label: t.navCards },
    { id: "budget-breakdown", label: t.navBudget },
    { id: "cash-vendors", label: t.navCashVendors },
    { id: "checklist-timeline", label: t.navChecklist },
  ];

  // Clear over the hero photo at the very top, solid once you scroll
  useEffect(() => {
    const update = () => {
      // Solid as soon as the page starts moving, so moving text never runs under see-through links
      setScrolled(window.scrollY > 48);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const solid = scrolled || menuOpen;

  // Escape closes the mobile menu and gives focus back to its button
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    goToSection(id);
  };

  const planNow = () => {
    setMenuOpen(false);
    if (onPlanNowClick) onPlanNowClick();
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out motion-reduce:transition-none ${
        solid
          ? "border-[#e5e5e5] bg-white/95 shadow-[0_1px_0_rgba(17,17,17,0.04)] backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[58px] max-w-[1280px] items-center justify-between gap-4 px-4 sm:h-[64px] sm:px-8">
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Utsav Planner, back to top"
          className="flex min-h-[44px] shrink-0 items-center rounded-full"
        >
          <UtsavLogo size="md" tone={solid ? "dark" : "light"} />
        </button>

        <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
          {links.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => go(l.id)}
              className={`group relative min-h-[44px] text-[14px] font-medium transition-colors duration-300 ${
                solid ? "text-[#39393b] hover:text-[#111111]" : "text-white hover:text-[#fbbf24]"
              }`}
            >
              {l.label}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-2 h-px origin-left scale-x-0 bg-[#d97706] transition-transform duration-200 group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageToggle
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
            buttonClassName={
              solid
                ? "text-[#111111] hover:bg-[#f5f5f5]"
                : "text-white hover:bg-white/15"
            }
          />

          <button
            type="button"
            onClick={planNow}
            className={`hidden h-11 items-center rounded-full px-6 text-[14px] font-semibold transition-colors duration-300 active:scale-95 sm:inline-flex ${
              solid ? "bg-[#111111] text-white hover:bg-black" : "bg-[#fbbf24] text-[#111111] hover:bg-[#f59e0b]"
            }`}
          >
            {t.navPlanNow}
          </button>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? t.menuClose : t.menuOpen}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 lg:hidden ${
              solid ? "text-[#111111] hover:bg-[#f5f5f5]" : "text-white hover:bg-white/15"
            }`}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          ref={panelRef}
          className="absolute inset-x-0 top-full border-b border-[#cacacb] bg-white px-4 pb-5 pt-2 shadow-[0_16px_32px_rgba(17,17,17,0.12)] sm:px-8 lg:hidden"
        >
          <nav aria-label="Menu" className="flex flex-col">
            {links.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => go(l.id)}
                className="flex min-h-[52px] items-center border-b border-[#e5e5e5] text-left text-[17px] font-semibold text-[#111111]"
              >
                {l.label}
              </button>
            ))}
            {onOpenGuide && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenGuide();
                }}
                className="flex min-h-[52px] items-center gap-2 border-b border-[#e5e5e5] text-left text-[17px] font-semibold text-[#111111]"
              >
                <HelpCircle className="h-5 w-5 text-[#4b4b4d]" aria-hidden="true" />
                <span>{t.guideLabel}</span>
              </button>
            )}
          </nav>
          <button
            type="button"
            onClick={planNow}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#111111] text-[15px] font-semibold text-white active:scale-95"
          >
            {t.navPlanNow}
          </button>
        </div>
      )}
    </header>
  );
}
