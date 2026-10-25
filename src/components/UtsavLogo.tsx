"use client";

import React from "react";

interface UtsavLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  /** "light" is for dark photos: only the wordmark colour changes */
  tone?: "dark" | "light";
}

export function UtsavLogo({
  size = "md",
  showText = true,
  className = "",
  tone = "dark",
}: UtsavLogoProps) {
  const iconDimensions = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  }[size];

  const titleSizes = {
    sm: "text-[15px]",
    md: "text-[18px]",
    lg: "text-[22px]",
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Modern Festive Diya / Celebration Crest SVG */}
      <div
        className={`${iconDimensions} rounded-xl bg-gradient-to-br from-[#1c1917] to-[#0c0a09] border border-amber-500/30 flex items-center justify-center p-1.5 shadow-sm group-hover:border-amber-400/60 transition-colors shrink-0`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* Radiant Celebration Aura / Sparkle */}
          <circle cx="16" cy="11" r="2.5" fill="#f59e0b" opacity="0.9" />
          <path
            d="M16 4V7M16 15V18M11 11H8M24 11H21"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Elegant Diya / Kalash Base Arc */}
          <path
            d="M7 17C7.5 22.5 11 26 16 26C21 26 24.5 22.5 25 17C21 18.5 11 18.5 7 17Z"
            fill="url(#utsavGoldGrad)"
          />

          {/* Auspicious Sacred Flame */}
          <path
            d="M16 7C14.5 9.5 13.5 11.5 14.5 13.5C15 14.5 16 15 16 15C16 15 17 14.5 17.5 13.5C18.5 11.5 17.5 9.5 16 7Z"
            fill="#ffffff"
          />

          <defs>
            <linearGradient
              id="utsavGoldGrad"
              x1="7"
              y1="17"
              x2="25"
              y2="26"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#fbbf24" />
              <stop offset="0.5" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <span
          className={`font-black ${titleSizes} tracking-tight uppercase ${tone === "light" ? "text-white" : "text-[#111111]"} leading-none whitespace-nowrap transition-colors duration-300`}
        >
          Utsav Planner
        </span>
      )}
    </div>
  );
}
