# PROJECT_CONTEXT.md — UtsavRipple (Plain-Language Indian Celebration & Event Planner)

## 1. Mission & Hackathon Context
- **Challenge:** Hack2skill PromptWars Virtual 2026 — Challenge 5: Celebration & Event Planner.
- **Brief:** Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas.
- **Core Differentiator:** Most planners generate a static Day-1 plan that breaks the moment real life happens. UtsavRipple is a **living, priority-aware event planner** designed for every Indian household (from ₹5,000 home birthdays and ₹2 Lakh Halwai/DIY weddings to multi-function weddings and Colony/Mohalla festivals).
- **6 Evaluation Criteria:**
  1. Code Quality (Strict TypeScript, pure engine separated from AI/UI)
  2. Security (Server-only API keys, Zod validation, input sanitization, prompt-injection delimiters, rate limiting, CSP headers)
  3. Efficiency (Deterministic local math, AI used only for 4 language tasks, input-hash caching, AbortController timeouts)
  4. Testing (Vitest unit test suite covering all engine rules, schemas, and AI fallbacks)
  5. Accessibility (WCAG AA contrast, keyboard navigation, explicit labels, aria-live announcements)
  6. Problem Statement Alignment (Budgets, Timelines, Vendor Checklists, Personalized Ideas, Editable & Refinable plans)

## 2. Hard Rules (Never Violate)
1. **Repo Size < 10 MB:** Never commit `node_modules`, `.next`, large media, or secrets. Keep `.env.example` updated.
2. **Zero Jargon / Ultra-Simple Everyday Language:**
   - The app must be immediately understandable by any person in India, regardless of formal education.
   - **BANNED WORDS in user-facing labels/messages:** "RWA", "Liquidity", "Anchor & Scale", "Deterministic", "Heuristic", "CostBasis", "CapEx", "Pledge", "SLA".
   - **USE INSTEAD:**
     - "Colony / Mohalla Festival" (instead of RWA)
     - "Invited Guests + Extra Guests Buffer + Helper Plates = Total Plates to Order" (instead of Headcount/Billable)
     - "Must-Have (Do Not Cut Money 🔒)" (instead of Priority Lock)
     - "Enter Real Shop Price" (instead of Anchor & Scale)
     - "Style: Full Service Booking vs Half Vendor / Half Self vs Home & Local Halwai Style" (instead of Scope Tiers)
     - "Cash Needed Now (Advance) vs Cash in Hand" (instead of Liquidity)
     - "Money in Hand vs Promised Money" (instead of Ledger/Pledges)
3. **3-Language Support:** Every AI prompt, fallback message, and template label supports:
   - `"en"`: Simple, everyday Indian English
   - `"hinglish"`: Natural conversational Hinglish (Roman script, e.g., "Khana ka budget mat kaato")
   - `"hi"`: Simple everyday Hindi (Devanagari script)
4. **Honest Money & Vendor Safety:**
   - NEVER invent fake shop names, vendor business names, or phone numbers.
   - Every rupee amount must carry a `PriceStatus`: `"typical_estimate"` | `"ai_idea"` | `"my_estimate"` | `"real_shop_price"` | `"paid"`.
5. **AI vs. Plain Code Separation:**
   - Gemini (`@google/genai`) is ONLY called in server routes (`/src/app/api/...`).
   - All money math, plate counts, date calculations, "Do Not Cut" locks, and Before/After change previews happen in 100% pure, deterministic TypeScript inside `/src/engine`.
   - Every AI call must validate with Zod, retry once on malformed JSON, and fall back to `/src/ai/fallback.ts` if Gemini fails or is unavailable.

## 3. Folder Architecture (Single Repo, Backend-First)
```text
/src
  /engine                 # 100% pure, deterministic, unit-tested TypeScript (NO AI, NO I/O)
    types.ts              # All TypeScript interfaces and types
    guests.ts             # Invited + 15% extra buffer + helper plates + caterer plate check
    budget.ts             # Initial allocation, "Do Not Cut" locks, Real Shop Price rebalance, Style swaps, Option Compare
    cash.ts               # Advance cash needed now vs Event-week cash vs Cash in hand
    timeline.ts           # Backward task checklist, tight-schedule & late flags, countdown
    schedule.ts           # Day-of-event hourly schedule & realistic time-buffer warnings
    moneyTracker.ts       # Family & Colony money tracker (Cash in Hand, Promised, Spent, WhatsApp summary)
    changes.ts            # "What Changed?" calculator: applyLifeChanges(plan, actions) -> { updatedPlan, preview }
  /templates              # India-first event blueprints & reference numbers
    benchmarks.json       # Typical % splits, city multipliers, extra expense warnings (with source + date)
    wedding.ts            # Shadi template (Haldi, Mehendi, Wedding, Reception)
    birthday.ts           # Birthday template (Home DIY or Hall party, return gifts)
    colony.ts             # Colony / Mohalla Festival template (Ganesh Puja, Navratri, Chanda collection)
    presets.ts            # 3 ready-to-load demo scenarios for instant testing
  /ai                     # Server-only Gemini AI layer + Offline Fallback
    schemas.ts            # Strict Zod schemas for all inputs and AI JSON outputs
    planSchema.ts         # Zod schema for an EventPlan sent by the browser + request schemas for each route
    prompts.ts            # System prompts with <event_data> injection protection & language rules
    gemini.ts             # Server wrapper with AbortController timeout, 1x retry (timeout/bad JSON/network/429/5xx only), input-hash cache (cached: true)
    fallback.ts           # Rule-based English/Hinglish parser, idea bank & message templates
  /lib                    # Shared utilities
    sanitize.ts           # Strip HTML/scripts, length caps, safe text helpers
    rateLimit.ts          # Best-effort in-memory rate limiter (bounded map) + trusted client-IP helper; per-container on serverless
    requestGuard.ts       # Body-size-capped JSON reading, 429 + Retry-After, plain-language 400 answers
    whatsapp.ts           # Format Indian currency (₹ / Lakh) & generate wa.me/?text= links
    storage.ts            # Safe localStorage load/save + JSON export/import helpers
  /app/api                # Next.js App Router Backend Endpoints (POST only)
    /plan/route.ts        # Parse plain text/form -> build complete initial EventPlan
    /change/route.ts      # Parse "What changed?" text -> run changes.ts -> return Before/After preview
    /ideas/route.ts       # Generate or refine budget-aware, culturally grounded ideas
    /messages/route.ts    # Generate ready-to-send WhatsApp messages per audience
/tests                    # Vitest automated unit & integration tests
```
