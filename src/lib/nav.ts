/** The four planner steps. Each one is a tab inside the single #planner section. */
export const STEP_IDS = ["what-changed", "budget-breakdown", "cash-vendors", "checklist-timeline"] as const;
export type StepId = (typeof STEP_IDS)[number];

export const GOTO_STEP_EVENT = "utsav:goto-step";

export function isStepId(id: string): id is StepId {
  return (STEP_IDS as readonly string[]).includes(id);
}

/** Go to a part of the page. Planner steps open the right tab; everything else just scrolls. */
export function goToSection(id: string) {
  if (typeof window === "undefined") return;
  if (isStepId(id)) {
    window.dispatchEvent(new CustomEvent(GOTO_STEP_EVENT, { detail: id }));
    return;
  }
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}
