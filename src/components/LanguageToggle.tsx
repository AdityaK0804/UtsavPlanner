"use client";

import React, { useState } from "react";
import { Globe } from "lucide-react";
import type { AppLanguage } from "@/engine/types";
import { DICTIONARY } from "./LanguageDictionary";

const ORDER: AppLanguage[] = ["en", "hinglish", "hi"];
const NAMES: Record<AppLanguage, string> = { en: "English", hinglish: "Hinglish", hi: "हिन्दी" };

interface LanguageToggleProps {
  currentLanguage: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  /** Extra classes for the icon button (colours on dark or light backgrounds) */
  buttonClassName?: string;
}

/** One globe icon, no visible text. Each press moves to the next language: English, Hinglish, Hindi, then English again. */
export function LanguageToggle({ currentLanguage, onLanguageChange, buttonClassName = "" }: LanguageToggleProps) {
  const t = DICTIONARY[currentLanguage];
  const [announcement, setAnnouncement] = useState("");

  const label = t.langAria.replace("{name}", NAMES[currentLanguage]);

  const next = () => {
    const idx = ORDER.indexOf(currentLanguage);
    const nextLang = ORDER[(idx + 1) % ORDER.length];
    onLanguageChange(nextLang);
    setAnnouncement(DICTIONARY[nextLang].langAnnounce.replace("{name}", NAMES[nextLang]));
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={next}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${buttonClassName || "text-[#111111] hover:bg-[#f5f5f5]"}`}
      >
        <Globe className="h-5 w-5" aria-hidden="true" />
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
