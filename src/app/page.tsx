"use client";

import React, { useState, useEffect } from "react";
import type { AppLanguage, EventPlan } from "@/engine/types";
import { AppleNavbar } from "@/components/AppleNavbar";
import { HeroSection } from "@/components/HeroSection";
import { CelebrationScrollSection } from "@/components/CelebrationScrollSection";
import { PlannerWorkspace } from "@/components/PlannerWorkspace";
import { LanguageToggle } from "@/components/LanguageToggle";
import { goToSection } from "@/lib/nav";
import { OnboardingGuideModal } from "@/components/OnboardingGuideModal";
import { UtsavLogo } from "@/components/UtsavLogo";
import { DICTIONARY } from "@/components/LanguageDictionary";
import {
  savePlanToStorage,
  loadPlanFromStorage,
  exportPlanAsJson,
  importPlanFromJson,
} from "@/lib/storage";
import { PRESET_WEDDING } from "@/templates";
import { formatINR } from "@/lib/whatsapp";
import {
  Save,
  Download,
  Upload,
  Printer,
  RotateCcw,
  Check,
  HelpCircle,
} from "lucide-react";

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>("hinglish");
  const [plan, setPlan] = useState<EventPlan>(() => ({
    ...PRESET_WEDDING,
    language: "hinglish",
  }));
  const [undoStack, setUndoStack] = useState<EventPlan[]>([]);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const t = DICTIONARY[currentLanguage];

  // Load saved plan from localStorage on mount & check first-time visitor guide
  useEffect(() => {
    const saved = loadPlanFromStorage();
    if (saved) {
      setPlan(saved);
      if (saved.language) {
        setCurrentLanguage(saved.language);
      }
    }

    // Auto-prompt guide for first-time visitors after short pause
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("utsav_guide_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setIsGuideOpen(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleUpdatePlan = (newPlan: EventPlan) => {
    setUndoStack((prev) => [plan, ...prev.slice(0, 15)]);
    setPlan(newPlan);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [previous, ...rest] = undoStack;
    setPlan(previous);
    setUndoStack(rest);
  };

  const handleSaveToBrowser = () => {
    const success = savePlanToStorage(plan);
    if (success) {
      setSaveToast("Saved to browser 💾");
      setTimeout(() => setSaveToast(null), 2500);
    }
  };

  const handleDownloadJson = () => {
    const jsonStr = exportPlanAsJson(plan);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utsav-planner-${plan.type}-${plan.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importPlanFromJson(content);
      if (res.success && res.plan) {
        handleUpdatePlan(res.plan);
        if (res.plan.language) {
          setCurrentLanguage(res.plan.language);
        }
        setSaveToast("Plan imported!");
        setTimeout(() => setSaveToast(null), 2500);
      } else {
        alert(res.error || "Failed to parse imported plan.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleLanguageChange = (lang: AppLanguage) => {
    setCurrentLanguage(lang);
    setPlan((prev) => ({ ...prev, language: lang }));
  };

  const handleBuildPlanFromPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: promptText.trim(),
          language: currentLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to build event plan.");
      }

      handleUpdatePlan(data.plan);
      setSaveToast("New celebration plan generated!");
      setTimeout(() => setSaveToast(null), 2500);
      setTimeout(() => {
        goToSection("what-changed");
      }, 150);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Plan creation failed. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="top" className="min-h-screen bg-white text-[#111111] flex flex-col font-sans">
      {/* 1. Header Navigation with Language Toggle, Search & Guide */}
      <AppleNavbar
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onSearchPrompt={handleBuildPlanFromPrompt}
        onOpenGuide={() => setIsGuideOpen(true)}
        onPlanNowClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          document.getElementById("hero-prompt-input")?.focus();
        }}
      />

      {/* First-Time Visitor Onboarding Guide Modal */}
      <OnboardingGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleLanguageChange}
        onStartPlanning={() => {
          setIsGuideOpen(false);
          goToSection("what-changed");
        }}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 2. Towering Editorial Campaign Hero */}
        <HeroSection
          currentLanguage={currentLanguage}
          onPlanCreated={(newPlan) => {
            handleUpdatePlan(newPlan);
            setSaveToast("New celebration plan generated!");
            setTimeout(() => setSaveToast(null), 2500);
          }}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />

        {/* 3. Scroll-scrubbed celebration cards: pins, sweeps along an arc, then lets go */}
        <CelebrationScrollSection
          currentLanguage={currentLanguage}
          onSelectCardPlan={(selectedPlan) => {
            handleUpdatePlan(selectedPlan);
            setSaveToast(`Loaded: ${selectedPlan.title}`);
            setTimeout(() => setSaveToast(null), 2500);
          }}
        />

        {/* 4. One compact planner: four steps as tabs, one short panel at a time */}
        <PlannerWorkspace
          currentLanguage={currentLanguage}
          plan={plan}
          onUpdatePlan={handleUpdatePlan}
          undoStack={undoStack}
          onUndo={handleUndo}
        />
      </main>

      {/* Footer: brand, where things are, what you can do with your plan, language */}
      <footer className="w-full border-t border-[#cacacb] bg-[#f5f5f5] px-4 pb-28 pt-16 text-[#4b4b4d] sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
            {/* Brand + one line + language */}
            <div className="space-y-6 sm:col-span-2 lg:col-span-1">
              <UtsavLogo size="md" />
              <p className="max-w-sm text-[16px] leading-relaxed text-[#4b4b4d]">{t.footBlurb}</p>
              <LanguageToggle
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
                buttonClassName="border border-[#cacacb] bg-white text-[#111111] hover:bg-[#ececec]"
              />
            </div>

            {/* Where things are on this page */}
            <nav aria-label={t.footPlan}>
              <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-[#111111]">{t.footPlan}</h2>
              <ul className="space-y-1 text-[16px]">
                {[
                  { id: "cards-section", label: t.navCards },
                  { id: "what-changed", label: t.navWhatChanged },
                  { id: "budget-breakdown", label: t.navBudget },
                  { id: "cash-vendors", label: t.navCashVendors },
                  { id: "checklist-timeline", label: t.navChecklist },
                ].map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => goToSection(link.id)}
                      className="inline-flex min-h-[44px] items-center text-left hover:text-[#111111] hover:underline"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* What you can do with your plan */}
            <div>
              <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-[#111111]">{t.footYourPlan}</h2>
              <ul className="space-y-1 text-[16px]">
                <li>
                  <button type="button" onClick={handleSaveToBrowser} className="inline-flex min-h-[44px] items-center gap-2 text-left hover:text-[#111111] hover:underline">
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>{t.footSave}</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={handleDownloadJson} className="inline-flex min-h-[44px] items-center gap-2 text-left hover:text-[#111111] hover:underline">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>{t.footExport}</span>
                  </button>
                </li>
                <li>
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-left hover:text-[#111111] hover:underline focus-within:outline focus-within:outline-2 focus-within:outline-[#f59e0b]">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    <span>{t.footImport}</span>
                    <input type="file" accept=".json" onChange={handleImportJson} className="sr-only" />
                  </label>
                </li>
                <li>
                  <button type="button" onClick={() => window.print()} className="inline-flex min-h-[44px] items-center gap-2 text-left hover:text-[#111111] hover:underline">
                    <Printer className="h-4 w-4" aria-hidden="true" />
                    <span>{t.footPrint}</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Honest note + copyright */}
          <div className="mt-14 flex flex-col gap-4 border-t border-[#cacacb] pt-6 text-[14px] text-[#4b4b4d] sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl">{t.footNote}</p>
            <div className="flex items-center gap-5">
              <span>{t.footCopy}</span>
              <a href="#top" className="inline-flex min-h-[44px] items-center font-semibold text-[#111111] hover:underline">
                {t.footBackToTop} ↑
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Small, quiet help button */}
      <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={() => setIsGuideOpen(true)}
          aria-label="Open the planning guide"
          className="flex h-12 items-center gap-2 rounded-full border border-[#39393b] bg-[#111111] px-4 text-white shadow-[0_8px_24px_rgba(17,17,17,0.28)] transition-colors hover:bg-black active:scale-95 sm:px-5"
        >
          <HelpCircle className="h-5 w-5 text-[#fbbf24]" aria-hidden="true" />
          <span className="hidden text-[14px] font-semibold 2xl:inline">{t.guideLabel}</span>
        </button>
      </div>
    </div>
  );
}
