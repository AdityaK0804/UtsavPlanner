"use client";

import React, { useState, useEffect } from "react";
import type { AppLanguage } from "@/engine/types";
import {
  Sparkles,
  Users,
  Lock,
  Wallet,
  Calendar,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Compass,
} from "lucide-react";

interface OnboardingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage?: AppLanguage;
  onStartPlanning: () => void;
  onSelectLanguage?: (lang: AppLanguage) => void;
}

export function OnboardingGuideModal({
  isOpen,
  onClose,
  currentLanguage = "en",
  onStartPlanning,
  onSelectLanguage,
}: OnboardingGuideModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [modalLang, setModalLang] = useState<AppLanguage>("en");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLanguageSwitch = (lang: AppLanguage) => {
    setModalLang(lang);
    if (onSelectLanguage) {
      onSelectLanguage(lang);
    }
  };

  const stepsContent = [
    {
      stepNum: "01",
      badge: "Step 01: Guests & Shocks",
      titleHinglish: "Real-Life Headcount & 15% Buffer Law",
      titleHindi: "मेहमानों की सच्ची संख्या और 15% बफर नियम",
      titleEn: "Real-Life Headcount & 15% Buffer Law",
      descHinglish:
        "Shadi ya utsav me achanak rishtedar badhte hain! Hamara math engine aapke invited guests me automatically 15% buffer aur helper plates (photographer, driver, tent crew) add karke exact caterer plates calculate karta hai taaki khana kabhi kam na pade.",
      descHindi:
        "शादी या उत्सव में अचानक मेहमान बढ़ जाते हैं। हमारा मैथ इंजन आपके आमंत्रित मेहमानों में अपने आप 15% बफर और हेल्पर प्लेट्स जोड़कर हलवाई के लिए सही प्लेट्स बताता है ताकि खाना कभी कम न पड़े।",
      descEn:
        "Events always have surprise guests! Our deterministic engine automatically adds a 15% unexpected guest buffer plus helper plates (for cameramen, drivers, staff) so your caterer never runs short.",
      icon: Users,
      actionHint: "Section 1: Try adding +50 guests or moving date earlier to see the instant Diff Card.",
      targetId: "what-changed",
    },
    {
      stepNum: "02",
      badge: "Step 02: Honest Budget & Locks",
      titleHinglish: "Must-Have Locks & Real Shop Price Auto-Balancing",
      titleHindi: "प्राथमिकता सुरक्षा और दुकान के सही रेट का हिसाब",
      titleEn: "Must-Have Locks & Real Market Price Auto-Balancing",
      descHinglish:
        "Khana ya photography ko 'Must-Have 🔒' lock karein. Jab koi tent wala ya halwai apna real rate bataye, use enter karein—engine doosre flexible kharcho ko smart mix me shift karke total budget ko automatically balance rakhta hai.",
      descHindi:
        "खाने या फोटोग्राफी को 'Must-Have 🔒' लॉक करें। जब हलवाई या टेंट वाला अपना असली रेट बताए, तो उसे दर्ज करें—इंजन बाकी खर्चों को संतुलित करके आपके कुल बजट को कभी बिगड़ने नहीं देगा।",
      descEn:
        "Lock your non-negotiables (like Food or Photography) with 🔒 Must-Have. When a vendor quotes their actual price, enter it—our math engine auto-balances other flexible categories without ruining your celebration.",
      icon: Lock,
      actionHint: "Section 2: Click 'Enter Real Shop Price' on any category to auto-balance.",
      targetId: "budget-breakdown",
    },
    {
      stepNum: "03",
      badge: "Step 03: Cash & Vendors",
      titleHinglish: "Ready Cash in Hand vs Promised Money",
      titleHindi: "हाथ की नकद रकम बनाम वादा किया हुआ चंदा",
      titleEn: "Ready Cash in Hand vs Promised Money",
      descHinglish:
        "Asli tension tab hoti hai jab booking advance aaj dena hota hai par family ya colony ka chanda aane me time lagta hai. Utsav Planner advance cash aur promised money ko alag rakhta hai taaki event-week me cash ka jhatka na lage.",
      descHindi:
        "असली परेशानी तब होती है जब एडवांस आज देना होता है और चंदा या परिवार का हिस्सा बाद में मिलता है। उत्सव प्लानर हाथ की नकदी और आने वाले पैसे को अलग रखकर ऐन वक्त पर पैसे की तंगी से बचाता है।",
      descEn:
        "Most event panic happens when advances are due today while contributions are still promised. We strictly separate liquid cash from promised funds so families never face cash traps.",
      icon: Wallet,
      actionHint: "Section 3: Record cash in hand, see advance deadlines, and send WhatsApp updates in 1 click.",
      targetId: "cash-vendors",
    },
    {
      stepNum: "04",
      badge: "Step 04: Timeline & Schedule",
      titleHinglish: "Hourly Event Day Schedule & Instant WhatsApp Updates",
      titleHindi: "घंटे-दर-घंटे का समय चक्र और 1-क्लिक व्हाट्सएप",
      titleEn: "Hourly Day Schedule & 1-Click WhatsApp Updates",
      descHinglish:
        "Doli, Baraat, Makeup aur Dinner ke realistic time buffers. Sath hi Halwai, Tent wale aur Family group ke liye bina kisi formal jargon ke polite WhatsApp updates copy aur send karein.",
      descHindi:
        "बारात, मेकअप और भोजन के सही समय बफर के साथ दिन का शेड्यूल। साथ ही हलवाई, टेंट वाले और परिवार के लिए सहज और विनम्र व्हाट्सएप संदेश 1 क्लिक में भेजें।",
      descEn:
        "Realistic timing buffers for Baraat, Makeup, and Dinner blocks. Plus 1-click polite WhatsApp broadcasts to caterers, tent decorators, and family groups.",
      icon: Calendar,
      actionHint: "Section 4: Check schedule warnings and copy instant WhatsApp updates.",
      targetId: "checklist-timeline",
    },
  ];

  const curr = stepsContent[activeStep];
  const StepIcon = curr.icon;

  const getTitle = () => {
    if (modalLang === "hi") return curr.titleHindi;
    if (modalLang === "en") return curr.titleEn;
    return curr.titleHinglish;
  };

  const getDesc = () => {
    if (modalLang === "hi") return curr.descHindi;
    if (modalLang === "en") return curr.descEn;
    return curr.descHinglish;
  };

  const handleNext = () => {
    if (activeStep < stepsContent.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleCompleteGuide();
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleCompleteGuide = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("utsav_guide_dismissed", "true");
    }
    onClose();
    onStartPlanning();
  };

  const handleJumpToSection = () => {
    onClose();
    setTimeout(() => {
      document.getElementById(curr.targetId)?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How Utsav Planner Works"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-white text-[#111111] rounded-3xl p-5 sm:p-8 shadow-2xl border border-[#cacacb] relative flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        {/* Top Bar with Language Selector and Close Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e5e5e5] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#111111] text-[#f59e0b] flex items-center justify-center font-black shadow-xs shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#707072] block">
                Quick Interactive Walkthrough
              </span>
              <h2 className="text-[17px] sm:text-[19px] font-bold text-[#111111] tracking-tight">
                How Utsav Planner Works
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* In-Modal Language Switcher Tabs */}
            <div className="flex items-center bg-[#f5f5f5] p-1 rounded-full border border-[#cacacb]">
              <button
                type="button"
                onClick={() => handleLanguageSwitch("en")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  modalLang === "en"
                    ? "bg-[#111111] text-white shadow-xs"
                    : "text-[#707072] hover:text-[#111111]"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSwitch("hinglish")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  modalLang === "hinglish"
                    ? "bg-[#111111] text-white shadow-xs"
                    : "text-[#707072] hover:text-[#111111]"
                }`}
              >
                Hinglish
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSwitch("hi")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                  modalLang === "hi"
                    ? "bg-[#111111] text-white shadow-xs"
                    : "text-[#707072] hover:text-[#111111]"
                }`}
              >
                हिंदी
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close guide"
              className="w-8 h-8 rounded-full bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#111111] flex items-center justify-center transition-colors active:scale-95 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Steps Indicator Tabs */}
        <div className="grid grid-cols-4 gap-2 pt-4 pb-2">
          {stepsContent.map((step, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`py-2 px-1 text-center rounded-xl border transition-all ${
                activeStep === idx
                  ? "bg-[#111111] text-white border-[#111111] shadow-sm font-bold"
                  : idx < activeStep
                  ? "bg-[#f0fdf4] text-[#007d48] border-[#bbf7d0] font-semibold"
                  : "bg-[#f5f5f5] text-[#707072] border-transparent hover:border-[#cacacb]"
              }`}
            >
              <span className="text-[11px] block font-black">
                {idx < activeStep ? "✓" : step.stepNum}
              </span>
              <span className="text-[9px] uppercase tracking-wider block truncate">
                {step.stepNum === "01"
                  ? "Guests"
                  : step.stepNum === "02"
                  ? "Budget"
                  : step.stepNum === "03"
                  ? "Cash"
                  : "Schedule"}
              </span>
            </button>
          ))}
        </div>

        {/* Main Step Feature Showcase */}
        <div className="py-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#111111] text-white">
              STEP {curr.stepNum} OF 04
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
              {curr.badge}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f5f5f5] border border-[#cacacb] flex items-center justify-center shrink-0 text-[#111111]">
              <StepIcon className="w-6 h-6 text-[#111111]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-[20px] sm:text-[23px] font-extrabold text-[#111111] leading-tight tracking-tight">
                {getTitle()}
              </h3>
              <p className="text-[14px] sm:text-[15px] text-[#4b4b4d] leading-relaxed">
                {getDesc()}
              </p>
            </div>
          </div>

          {/* Action Hint Card with Direct Jump */}
          <div className="p-3.5 rounded-2xl bg-[#f5f5f5] border border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[13px] text-[#111111]">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#f59e0b] shrink-0" />
              <span className="font-medium text-[#4b4b4d]">
                <strong className="text-[#111111]">How to use:</strong> {curr.actionHint}
              </span>
            </div>
            <button
              type="button"
              onClick={handleJumpToSection}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#111111] hover:text-[#d97706] hover:underline shrink-0"
            >
              <span>Jump to Section</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-4 border-t border-[#e5e5e5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCompleteGuide}
            className="text-[13px] font-semibold text-[#707072] hover:text-[#111111] hover:underline px-2 py-1"
          >
            Skip to Planner
          </button>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 rounded-full bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[13px] font-bold text-[#111111] transition-all flex items-center gap-1.5 active:scale-95 border border-[#cacacb]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-black text-white text-[13px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
              <span>{activeStep === stepsContent.length - 1 ? "Start Planning 🚀" : "Next Step"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
