"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AppLanguage, EventPlan } from "@/engine/types";
import { DICTIONARY, type CelebrationCardId } from "./LanguageDictionary";
import {
  PRESET_WEDDING,
  PRESET_BIRTHDAY,
  PRESET_COLONY,
  createPlanFromTemplate,
} from "@/templates";
import { ArrowRight, ChevronDown } from "lucide-react";
import { goToSection } from "@/lib/nav";

/* ------------------------------------------------------------------ */
/*  Card data (names/tags live in LanguageDictionary, in 3 languages)  */
/* ------------------------------------------------------------------ */

type MotifName =
  | "rings"
  | "bloom"
  | "leaves"
  | "waves"
  | "balloons"
  | "crescent"
  | "linked"
  | "house"
  | "lotus"
  | "mandala"
  | "diya"
  | "flame";

interface CardDef {
  id: CelebrationCardId;
  guests: number;
  motif: MotifName;
  /** CSS gradient: lighter at the top, darker at the bottom (text sits at the bottom) */
  background: string;
  textColor: string;
  motifColor: string;
  buildPlan: (lang: AppLanguage) => EventPlan;
}

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function templatePlan(
  lang: AppLanguage,
  opts: {
    eventType: "wedding" | "birthday" | "colony_festival";
    title: string;
    city: string;
    citySize: "big_metro" | "medium_city" | "small_town";
    inDays: number;
    guests: number;
    budget: number;
  }
): EventPlan {
  return createPlanFromTemplate({
    eventType: opts.eventType,
    title: opts.title,
    city: opts.city,
    citySize: opts.citySize,
    eventDate: futureDate(opts.inDays),
    invitedGuests: opts.guests,
    totalBudget: opts.budget,
    mustHaveCategories: [],
    language: lang,
  });
}

export const CELEBRATION_CARDS: CardDef[] = [
  {
    id: "wedding",
    guests: 250,
    motif: "rings",
    background: "linear-gradient(180deg,#d30005 0%,#780700 100%)",
    textColor: "#ffffff",
    motifColor: "#fbbf24",
    buildPlan: (lang) => ({ ...PRESET_WEDDING, id: `wedding-${Date.now()}`, language: lang }),
  },
  {
    id: "haldi",
    guests: 120,
    motif: "bloom",
    background: "linear-gradient(180deg,#fde68a 0%,#f59e0b 100%)",
    textColor: "#111111",
    motifColor: "#b45309",
    buildPlan: (lang) =>
      templatePlan(lang, { eventType: "wedding", title: "Haldi Ceremony", city: "Indore", citySize: "medium_city", inDays: 35, guests: 120, budget: 150000 }),
  },
  {
    id: "mehendi",
    guests: 100,
    motif: "leaves",
    background: "linear-gradient(180deg,#007d48 0%,#064e3b 100%)",
    textColor: "#ffffff",
    motifColor: "#bbf7d0",
    buildPlan: (lang) =>
      templatePlan(lang, { eventType: "wedding", title: "Mehendi Evening", city: "Jaipur", citySize: "big_metro", inDays: 40, guests: 100, budget: 120000 }),
  },
  {
    id: "sangeet",
    guests: 180,
    motif: "waves",
    background: "linear-gradient(180deg,#1151ff 0%,#0a2a8a 100%)",
    textColor: "#ffffff",
    motifColor: "#fef3c7",
    buildPlan: (lang) =>
      templatePlan(lang, { eventType: "wedding", title: "Sangeet Night", city: "Jaipur", citySize: "big_metro", inDays: 42, guests: 180, budget: 350000 }),
  },
  {
    id: "birthday",
    guests: 40,
    motif: "balloons",
    background: "linear-gradient(180deg,#fef3c7 0%,#fbbf24 100%)",
    textColor: "#111111",
    motifColor: "#d30005",
    buildPlan: (lang) => ({ ...PRESET_BIRTHDAY, id: `birthday-${Date.now()}`, language: lang }),
  },
  {
    id: "babyshower",
    guests: 60,
    motif: "crescent",
    background: "linear-gradient(180deg,#ffe4e6 0%,#fda4af 100%)",
    textColor: "#111111",
    motifColor: "#9f1239",
    buildPlan: (lang) =>
      templatePlan(lang, { eventType: "birthday", title: "Godh Bharai (Baby Shower)", city: "Lucknow", citySize: "medium_city", inDays: 30, guests: 60, budget: 50000 }),
  },
  {
    id: "anniversary",
    guests: 90,
    motif: "linked",
    background: "linear-gradient(180deg,#4b4b4d 0%,#111111 100%)",
    textColor: "#ffffff",
    motifColor: "#f59e0b",
    buildPlan: (lang) =>
      templatePlan(lang, { eventType: "wedding", title: "Anniversary Dinner", city: "Pune", citySize: "big_metro", inDays: 50, guests: 90, budget: 180000 }),
  },
  {
    id: "housewarming",
    guests: 75,
    motif: "house",
    background: "linear-gradient(180deg,#ffedd5 0%,#fdba74 100%)",
    textColor: "#111111",
    motifColor: "#9a3412",
    buildPlan: (lang) =>
      templatePlan(lang, { eventType: "colony_festival", title: "Griha Pravesh Puja", city: "Lucknow", citySize: "medium_city", inDays: 45, guests: 75, budget: 45000 }),
  },
  {
    id: "ganesh",
    guests: 350,
    motif: "lotus",
    background: "linear-gradient(180deg,#d97706 0%,#78350f 100%)",
    textColor: "#ffffff",
    motifColor: "#fef3c7",
    buildPlan: (lang) => ({ ...PRESET_COLONY, id: `colony-${Date.now()}`, language: lang }),
  },
  {
    id: "navratri",
    guests: 300,
    motif: "mandala",
    background: "linear-gradient(180deg,#be123c 0%,#4c0519 100%)",
    textColor: "#ffffff",
    motifColor: "#fde68a",
    buildPlan: (lang) =>
      templatePlan(lang, { eventType: "colony_festival", title: "Navratri Garba Nights", city: "Ahmedabad", citySize: "big_metro", inDays: 60, guests: 300, budget: 200000 }),
  },
  {
    id: "diwali",
    guests: 200,
    motif: "diya",
    background: "linear-gradient(180deg,#39393b 0%,#0a0a0a 100%)",
    textColor: "#ffffff",
    motifColor: "#fbbf24",
    buildPlan: (lang) =>
      templatePlan(lang, { eventType: "colony_festival", title: "Diwali Milan", city: "Delhi", citySize: "big_metro", inDays: 55, guests: 200, budget: 100000 }),
  },
  {
    id: "lohri",
    guests: 80,
    motif: "flame",
    background: "linear-gradient(180deg,#ea580c 0%,#7c2d12 100%)",
    textColor: "#ffffff",
    motifColor: "#fde68a",
    buildPlan: (lang) =>
      templatePlan(lang, { eventType: "colony_festival", title: "Lohri Bonfire Evening", city: "Chandigarh", citySize: "medium_city", inDays: 65, guests: 80, budget: 40000 }),
  },
];

/* ------------------------------------------------------------------ */
/*  Card artwork: pure SVG, no remote images                           */
/* ------------------------------------------------------------------ */

function Motif({ name, c }: { name: MotifName; c: string }) {
  switch (name) {
    case "rings":
      return (
        <g fill="none" stroke={c} strokeWidth="4">
          {[100, 80, 60, 40, 20].map((r, i) => (
            <circle key={r} cx="150" cy="125" r={r} opacity={0.35 + i * 0.13} />
          ))}
          <circle cx="150" cy="125" r="8" fill={c} />
        </g>
      );
    case "bloom":
      return (
        <g fill={c}>
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={i} cx="150" cy="75" rx="15" ry="42" opacity="0.7" transform={`rotate(${i * 30} 150 125)`} />
          ))}
          <circle cx="150" cy="125" r="22" opacity="0.95" />
        </g>
      );
    case "leaves":
      return (
        <g fill={c}>
          {Array.from({ length: 8 }).map((_, i) => (
            <path key={i} d="M150 125 C128 90 130 50 150 22 C170 50 172 90 150 125Z" opacity="0.65" transform={`rotate(${i * 45} 150 125)`} />
          ))}
          <circle cx="150" cy="125" r="10" />
        </g>
      );
    case "waves":
      return (
        <g fill="none" stroke={c} strokeWidth="5" strokeLinecap="round">
          {[30, 55, 80, 105].map((r, i) => (
            <path key={r} d={`M${150 - r} 200 A ${r} ${r} 0 0 1 ${150 + r} 200`} opacity={0.95 - i * 0.18} />
          ))}
          <circle cx="150" cy="200" r="9" fill={c} stroke="none" />
        </g>
      );
    case "balloons":
      return (
        <g>
          {[
            { x: 95, y: 90, r: 38, o: 0.95 },
            { x: 155, y: 70, r: 44, o: 0.75 },
            { x: 215, y: 100, r: 36, o: 0.9 },
          ].map((b) => (
            <g key={b.x}>
              <ellipse cx={b.x} cy={b.y} rx={b.r} ry={b.r * 1.18} fill={c} opacity={b.o} />
              <path d={`M${b.x} ${b.y + b.r * 1.18} q-8 40 6 80`} stroke={c} strokeWidth="3" fill="none" />
            </g>
          ))}
        </g>
      );
    case "crescent":
      return (
        <g fill={c}>
          <path d="M190 40 A 78 78 0 1 0 190 205 A 62 62 0 1 1 190 40Z" opacity="0.85" />
          {[
            [215, 70, 9],
            [235, 120, 6],
            [205, 150, 7],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case "linked":
      return (
        <g fill="none" stroke={c} strokeWidth="9">
          <circle cx="120" cy="125" r="55" opacity="0.9" />
          <circle cx="180" cy="125" r="55" opacity="0.6" />
        </g>
      );
    case "house":
      return (
        <g fill={c}>
          <path d="M60 130 L150 50 L240 130Z" opacity="0.9" />
          <rect x="85" y="130" width="130" height="80" opacity="0.6" />
          <rect x="132" y="160" width="36" height="50" opacity="0.95" />
          {[100, 125, 150, 175, 200].map((x) => (
            <circle key={x} cx={x} cy="140" r="5" opacity="0.95" />
          ))}
        </g>
      );
    case "lotus":
      return (
        <g fill={c}>
          {[-60, -30, 0, 30, 60].map((a) => (
            <path key={a} d="M150 205 C120 160 125 105 150 62 C175 105 180 160 150 205Z" opacity={a === 0 ? 0.95 : 0.6} transform={`rotate(${a} 150 205)`} />
          ))}
          <rect x="95" y="205" width="110" height="8" rx="4" opacity="0.8" />
        </g>
      );
    case "mandala":
      return (
        <g fill={c}>
          {Array.from({ length: 16 }).map((_, i) => (
            <circle key={i} cx="150" cy="40" r="9" opacity="0.9" transform={`rotate(${i * 22.5} 150 125)`} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx="150" cy="75" r="11" opacity="0.65" transform={`rotate(${i * 45 + 22.5} 150 125)`} />
          ))}
          <circle cx="150" cy="125" r="18" />
        </g>
      );
    case "diya":
      return (
        <g fill={c}>
          <path d="M80 150 Q150 232 220 150Z" opacity="0.95" />
          <path d="M150 148 C112 105 138 72 150 36 C162 72 188 105 150 148Z" opacity="0.8" />
          <path d="M150 140 C132 118 146 100 150 84 C154 100 168 118 150 140Z" fill="#ffffff" opacity="0.9" />
          {[40, 90, 150, 210, 260].map((x, i) => (
            <circle key={x} cx={x} cy={30 + (i % 2) * 22} r="6" opacity="0.6" />
          ))}
        </g>
      );
    case "flame":
    default:
      return (
        <g fill={c}>
          <path d="M150 210 C85 180 90 110 150 25 C210 110 215 180 150 210Z" opacity="0.5" />
          <path d="M150 205 C105 180 112 125 150 70 C188 125 195 180 150 205Z" opacity="0.75" />
          <path d="M150 200 C128 182 134 150 150 122 C166 150 172 182 150 200Z" opacity="0.95" />
        </g>
      );
  }
}

const CARD_W = 300;
const CARD_H = 400;

interface CardFaceProps {
  def: CardDef;
  title: string;
  tag: string;
  line: string;
}

function CardFace({ def, title, tag, line }: CardFaceProps) {
  return (
    <div
      className="card-face relative overflow-hidden rounded-[28px]"
      style={{
        width: CARD_W,
        height: CARD_H,
        background: def.background,
        color: def.textColor,
        boxShadow: "16px 8px 40px rgba(17,17,17,0.28)",
      }}
    >
      <svg
        viewBox="0 0 300 250"
        className="absolute left-0 top-0 w-full"
        style={{ height: 250 }}
        aria-hidden="true"
        focusable="false"
      >
        <Motif name={def.motif} c={def.motifColor} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 p-6 text-right">
        <span className="block text-[12px] font-bold uppercase tracking-[0.14em]" style={{ opacity: 0.9 }}>
          {tag}
        </span>
        <span className="font-display-campaign mt-1 block text-[30px] leading-[1] [overflow-wrap:anywhere]">{title}</span>
        <span className="mt-3 block text-[13px] font-medium" style={{ opacity: 0.92 }}>
          {line}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The scroll-scrubbed arc                                            */
/* ------------------------------------------------------------------ */

const SCROLL_VH = 600; // total height of the scroll container, in vh
const TRAVEL_SLOTS = 7.5; // how many card slots the deck moves over the full scroll
const START_OFFSET = 0.5; // so the arc is already full when the section first appears
const LERP = 0.08; // smoothing: lower = floatier

interface Layout {
  W: number;
  H: number;
  mobile: boolean;
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Place one card. s runs 0 (far, top-right) to 1 (close, bottom-left). */
function placeCard(s: number, L: Layout) {
  const { W, H, mobile } = L;
  // Pull the far end tighter and spread the near end out, like perspective
  const q = Math.pow(s, 1.3);

  // Quadratic bezier: start top-right, bow toward the bottom-right, finish bottom-left
  const p0 = mobile ? { x: 1.12 * W, y: 0.34 * H } : { x: 1.1 * W, y: -0.1 * H };
  const p1 = mobile ? { x: 0.7 * W, y: 0.95 * H } : { x: 0.8 * W, y: 0.8 * H };
  const p2 = mobile ? { x: -0.22 * W, y: 0.8 * H } : { x: -0.16 * W, y: 0.64 * H };
  const u = 1 - q;
  const x = u * u * p0.x + 2 * u * q * p1.x + q * q * p2.x;
  const y = u * u * p0.y + 2 * u * q * p1.y + q * q * p2.y;

  const fit = mobile ? Math.min(0.72, (H * 0.34) / CARD_H) : Math.min(1.08, (H * 0.64) / CARD_H);
  const scale = fit * (0.4 + 0.6 * Math.pow(s, 1.1));
  const opacity = smoothstep(0, 0.035, s) * (1 - smoothstep(0.965, 1, s));
  return { x, y, scale, opacity, z: Math.round(s * 1000) };
}

interface CelebrationScrollSectionProps {
  currentLanguage: AppLanguage;
  onSelectCardPlan: (plan: EventPlan) => void;
}

export function CelebrationScrollSection({
  currentLanguage,
  onSelectCardPlan,
}: CelebrationScrollSectionProps) {
  const t = DICTIONARY[currentLanguage];
  const [reduced, setReduced] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // The card under the pointer or keyboard focus. It rides above its neighbours.
  const raisedRef = useRef(-1);
  const rerenderRef = useRef<() => void>(() => {});

  const N = CELEBRATION_CARDS.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    let layout: Layout = { W: 1280, H: 600, mobile: false };
    let cur = -1; // current (smoothed) deck position; -1 = not initialised
    let raf = 0;
    let last = 0;
    const tabState: boolean[] = [];

    const measure = () => {
      const r = sticky.getBoundingClientRect();
      layout = { W: r.width, H: r.height, mobile: r.width < 768 };
    };

    const getTarget = () => {
      const rect = section.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const total = Math.max(1, section.offsetHeight - sticky.offsetHeight);
      const r = Math.min(1, Math.max(0, (top - rect.top) / total));
      return START_OFFSET + r * TRAVEL_SLOTS;
    };

    const render = (pos: number) => {
      for (let i = 0; i < N; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        // Each card sits one slot behind the one before it; wrap so the track is endless
        const s = (((i + pos) % N) + N) % N / N;
        const p = placeCard(s, layout);
        el.style.transform = `translate3d(${(p.x - CARD_W / 2).toFixed(1)}px, ${(p.y - CARD_H / 2).toFixed(1)}px, 0) scale(${p.scale.toFixed(4)})`;
        el.style.opacity = p.opacity.toFixed(3);
        // 1050 sits above every card (max 1000) but still under the white text veil (1100)
        el.style.zIndex = String(raisedRef.current === i ? 1050 : p.z);
        el.style.visibility = p.opacity < 0.01 ? "hidden" : "visible";
        // Only cards you can actually see are reachable with the Tab key
        const reachable = s > 0.18 && s < 0.97;
        if (tabState[i] !== reachable) {
          tabState[i] = reachable;
          const b = btnRefs.current[i];
          if (b) b.tabIndex = reachable ? 0 : -1;
        }
      }
    };

    const tick = (now: number) => {
      raf = 0;
      const target = getTarget();
      if (cur < 0) cur = target;
      const dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      const k = 1 - Math.pow(1 - LERP, dt / 16.7);
      cur += (target - cur) * k;
      if (Math.abs(target - cur) < 0.0005) cur = target;
      render(cur);
      if (cur !== target) raf = requestAnimationFrame(tick);
      else last = 0;
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onResize = () => {
      measure();
      cur = -1;
      kick();
    };

    measure();
    cur = getTarget();
    render(cur);
    rerenderRef.current = () => render(cur < 0 ? getTarget() : cur);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(sticky);

    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      rerenderRef.current = () => {};
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, N]);

  const raise = (i: number) => {
    raisedRef.current = i;
    rerenderRef.current();
  };
  const lower = (i: number) => {
    if (raisedRef.current === i) {
      raisedRef.current = -1;
      rerenderRef.current();
    }
  };

  const handlePick = (def: CardDef) => {
    onSelectCardPlan(def.buildPlan(currentLanguage));
    setTimeout(() => goToSection("what-changed"), 150);
  };

  const cardLine = (def: CardDef) => `${t.cardSample} · ${def.guests} ${t.cardGuests}`;

  const textBlock = (
    <div className="pointer-events-none max-w-[560px]">
      <h2 className="font-display-campaign text-[40px] text-[#111111] sm:text-[56px] lg:text-[72px]">
        {t.cardsHeadline}
      </h2>
      <p className="mt-4 max-w-[26rem] text-[15px] leading-relaxed text-[#707072] sm:text-[17px]">
        {t.cardsSub}
      </p>
      <button
        type="button"
        onClick={() => goToSection("what-changed")}
        className="pointer-events-auto mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#111111] px-7 text-[14px] font-bold uppercase tracking-wider text-white transition-transform hover:bg-black active:scale-95"
      >
        <span>{t.cardsCta}</span>
        <ArrowRight className="h-4 w-4 text-[#f59e0b]" aria-hidden="true" />
      </button>
      <p className="mt-8 hidden items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-[#4b4b4d] md:flex" aria-hidden="true">
        <ChevronDown className="h-4 w-4 animate-bounce" />
        <span>{t.cardsHint}</span>
      </p>
    </div>
  );

  /* ---- Reduced motion: a calm, static grid. No scrub, no sticky, no transforms ---- */
  if (reduced) {
    return (
      <section
        id="cards-section"
        aria-label={t.cardsListAria}
        className="w-full border-b border-[#e5e5e5] bg-white px-4 py-24 sm:px-8 sm:py-32"
      >
        <div className="mx-auto max-w-[1280px]">
          {textBlock}
          <ul className="mt-12 flex flex-wrap gap-6">
            {CELEBRATION_CARDS.slice(0, 8).map((def) => {
              const text = t.cards[def.id];
              return (
                <li key={def.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(def)}
                    aria-label={t.cardPickAria.replace("{title}", text.title)}
                    className="rounded-[28px] text-left"
                  >
                    <CardFace def={def} title={text.title} tag={text.tag} line={cardLine(def)} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }

  /* ---- Full effect: tall container, sticky stage, one scroll value drives every card ---- */
  return (
    <section
      id="cards-section"
      ref={sectionRef}
      aria-label={t.cardsListAria}
      className="relative w-full border-b border-[#e5e5e5] bg-white"
      style={{ height: `${SCROLL_VH}vh` }}
    >
      <div
        ref={stickyRef}
        className="sticky top-[58px] h-[calc(100vh-58px)] w-full overflow-hidden sm:top-[64px] sm:h-[calc(100vh-64px)]"
      >
        {/* The moving track of cards */}
        <div className="absolute inset-0" role="list">
          {CELEBRATION_CARDS.map((def, i) => {
            const text = t.cards[def.id];
            return (
              <div
                key={def.id}
                role="listitem"
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="absolute left-0 top-0"
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") raise(i);
                }}
                onPointerLeave={() => lower(i)}
                onFocus={() => raise(i)}
                onBlur={() => lower(i)}
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  willChange: "transform",
                  opacity: 0,
                }}
              >
                <button
                  type="button"
                  ref={(el) => {
                    btnRefs.current[i] = el;
                  }}
                  onClick={() => handlePick(def)}
                  aria-label={t.cardPickAria.replace("{title}", text.title)}
                  className="card-pop block rounded-[28px] text-left focus-visible:outline-offset-4"
                >
                  <CardFace def={def} title={text.title} tag={text.tag} line={cardLine(def)} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Soft white fade so cards slide UNDER the fixed text */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1100] hidden w-[54%] bg-gradient-to-r from-white from-0% via-white/95 via-60% to-transparent md:block"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1100] h-[44%] bg-gradient-to-b from-white via-white/85 to-transparent md:hidden"
          aria-hidden="true"
        />

        {/* Fixed text block: never moves while the cards scrub past */}
        <div className="pointer-events-none absolute inset-0 z-[1200] mx-auto flex max-w-[1280px] items-start px-5 pt-8 sm:px-8 md:items-center md:pt-0">
          {textBlock}
        </div>

      </div>
    </section>
  );
}
