import type { ChangeAction, EventPlan, SubEvent } from "./types";

/**
 * Maps the words people (and the AI) use for a program to the real sub-event in a plan.
 * Works for ids ("custom-se-1"), names ("Haldi & Mehendi"), English / Hinglish aliases
 * ("shaadi", "wedding", "vivah") and Hindi names ("हल्दी", "शादी").
 */

/** Canonical program key -> every spelling we accept (all lower case). */
const ALIASES: Record<string, string[]> = {
  haldi: ["haldi", "halde", "haldee", "हल्दी", "हळद"],
  mehendi: ["mehendi", "mehndi", "mehandi", "henna", "मेहंदी", "मेहेंदी"],
  sangeet: ["sangeet", "sangit", "sangeeth", "cocktail", "संगीत"],
  ring: ["ring", "engagement", "sagai", "sagaai", "roka", "tilak", "सगाई", "रोका", "तिलक"],
  wedding: [
    "wedding",
    "shaadi",
    "shadi",
    "vivah",
    "vivaah",
    "phere",
    "pheras",
    "pheray",
    "baraat",
    "barat",
    "marriage",
    "शादी",
    "विवाह",
    "फेरे",
    "बारात",
  ],
  reception: ["reception", "रिसेप्शन", "भोज"],
  birthday: ["birthday", "bday", "janamdin", "janmdin", "जन्मदिन"],
  puja: ["puja", "pooja", "aarti", "aarati", "पूजा", "आरती"],
  bhandara: ["bhandara", "mahaprasad", "prasad", "भंडारा", "महाप्रसाद"],
  cultural: ["cultural", "competition", "programme", "program", "sanskritik", "सांस्कृतिक"],
};

const WORD_TO_KEY = new Map<string, string>();
for (const [key, words] of Object.entries(ALIASES)) {
  for (const w of words) WORD_TO_KEY.set(w, key);
}

/** Words that mean "every program". */
const ALL_WORDS = new Set(["all", "every", "everyone", "sab", "sabhi", "saare", "sare", "सभी", "सब"]);

function normalise(text: string): string {
  return text.normalize("NFKC").toLowerCase().trim();
}

function words(text: string): string[] {
  return normalise(text)
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean);
}

function keysOf(text: string): Set<string> {
  const keys = new Set<string>();
  for (const w of words(text)) {
    const key = WORD_TO_KEY.get(w);
    if (key) keys.add(key);
  }
  return keys;
}

export type SubEventLookup =
  | { ok: true; ids: string[] }
  | { ok: false; message: string };

/** "Haldi & Mehendi, Sangeet / Ring Ceremony" - used in plain messages and in the AI prompt. */
export function describePrograms(plan: EventPlan): string {
  return plan.subEvents.map((s) => `"${s.name}"`).join(", ");
}

/**
 * Finds the sub-event(s) a reference points to.
 * Order: exact id -> exact name -> alias/keyword match -> partial name match.
 * Never guesses: when nothing matches it says so, with the list of real programs.
 */
export function lookupSubEvents(plan: EventPlan, ref: string | undefined | null): SubEventLookup {
  const raw = (ref ?? "").trim();
  const list = plan.subEvents;
  const available = describePrograms(plan);

  if (!raw) return { ok: true, ids: list.map((s) => s.id) };

  // 1. exact id
  const byId = list.find((s) => s.id === raw);
  if (byId) return { ok: true, ids: [byId.id] };

  const q = normalise(raw);
  const qWords = words(raw);

  // "all programs"
  if (qWords.length > 0 && qWords.every((w) => ALL_WORDS.has(w))) {
    return { ok: true, ids: list.map((s) => s.id) };
  }

  // 2. exact name or id (case-insensitive)
  const exact = list.filter((s) => normalise(s.name) === q || normalise(s.id) === q);
  if (exact.length > 0) return { ok: true, ids: exact.map((s) => s.id) };

  // 3. alias match: same program key ("wedding" matches "Main Wedding & Reception")
  const wanted = keysOf(raw);
  if (wanted.size > 0) {
    const hits = list.filter((s) => {
      const have = keysOf(s.name);
      for (const k of wanted) if (have.has(k)) return true;
      return false;
    });
    if (hits.length > 0) {
      // "wedding" should prefer the program that really is the wedding, not a "dinner/party" one
      return { ok: true, ids: hits.map((s) => s.id) };
    }
  }

  // 4. partial text match (a word of the name appears in the reference or the other way round)
  if (q.length >= 3) {
    const partial = list.filter((s) => {
      const n = normalise(s.name);
      return n.includes(q) || (qWords.length > 0 && qWords.some((w) => w.length >= 4 && n.includes(w)));
    });
    if (partial.length > 0) return { ok: true, ids: partial.map((s) => s.id) };
  }

  return {
    ok: false,
    message: `Could not find a program called "${raw.slice(0, 60)}". Your programs are: ${available}.`,
  };
}

/** Sub-events whose name or alias is mentioned anywhere in a free-text sentence. */
export function findMentionedSubEvents(plan: EventPlan, text: string): SubEvent[] {
  const mentioned = keysOf(text);
  const lower = normalise(text);
  return plan.subEvents.filter((s) => {
    const have = keysOf(s.name);
    for (const k of mentioned) if (have.has(k)) return true;
    const first = normalise(s.name).split(/[^\p{L}\p{M}\p{N}]+/u).find((w) => w.length >= 4);
    return Boolean(first && lower.includes(first));
  });
}

/**
 * Rewrites any sub-event name/alias in the actions to the real id.
 * - one match -> that id; several matches (e.g. "wedding" in two programs) -> one action each
 * - no match -> the action is left as it was, so the engine can tell the user plainly
 * Never mutates its input. Safe to run twice.
 */
export function resolveSubEventRefs(plan: EventPlan, actions: ChangeAction[]): ChangeAction[] {
  const out: ChangeAction[] = [];
  for (const act of actions) {
    if (
      act &&
      typeof act === "object" &&
      (act.action === "change_guests" || act.action === "add_guests" || act.action === "remove_sub_event") &&
      typeof act.subEventId === "string" &&
      act.subEventId.trim() !== ""
    ) {
      const found = lookupSubEvents(plan, act.subEventId);
      if (found.ok) {
        // Removing is destructive: only rewrite when the reference points to exactly one program.
        if (act.action === "remove_sub_event" && found.ids.length !== 1) {
          out.push(act);
          continue;
        }
        for (const id of found.ids) out.push({ ...act, subEventId: id });
        continue;
      }
    }
    out.push(act);
  }
  return out;
}
