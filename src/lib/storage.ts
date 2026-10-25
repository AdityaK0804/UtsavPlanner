import type { EventPlan } from "../engine/types";

const DEFAULT_STORAGE_KEY = "utsav_ripple_active_plan";

/**
 * Safely saves the active EventPlan to browser localStorage.
 */
export function savePlanToStorage(plan: EventPlan, key = DEFAULT_STORAGE_KEY): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    const serialized = JSON.stringify(plan);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.error("Failed to save event plan to localStorage:", err);
    return false;
  }
}

/**
 * Safely retrieves the active EventPlan from browser localStorage.
 */
export function loadPlanFromStorage(key = DEFAULT_STORAGE_KEY): EventPlan | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EventPlan;
    if (parsed && typeof parsed === "object" && parsed.id && Array.isArray(parsed.budgetItems)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error("Failed to load event plan from localStorage:", err);
    return null;
  }
}

/**
 * Exports an EventPlan as a formatted JSON string.
 */
export function exportPlanAsJson(plan: EventPlan): string {
  return JSON.stringify(plan, null, 2);
}

/**
 * Validates and imports an EventPlan from a JSON string.
 */
export function importPlanFromJson(jsonStr: string): {
  success: boolean;
  plan?: EventPlan;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonStr) as EventPlan;
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Invalid JSON format." };
    }
    if (!parsed.id || !parsed.type || !Array.isArray(parsed.budgetItems) || !Array.isArray(parsed.subEvents)) {
      return { success: false, error: "Missing required EventPlan fields (id, type, budgetItems, subEvents)." };
    }
    return { success: true, plan: parsed };
  } catch (err) {
    return { success: false, error: `JSON Parse Error: ${err instanceof Error ? err.message : String(err)}` };
  }
}
