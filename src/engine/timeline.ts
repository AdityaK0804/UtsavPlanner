import type { ChecklistTask } from "./types";

/**
 * Parses date string in YYYY-MM-DD format as UTC midnight to avoid timezone offsets.
 */
function parseUtcDateOnly(dateStr: string): Date {
  const clean = dateStr.slice(0, 10);
  const [year, month, day] = clean.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

/**
 * Subtracts days from a date and returns YYYY-MM-DD in UTC.
 */
export function subtractDays(dateIso: string, days: number): string {
  const d = parseUtcDateOnly(dateIso);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculates days remaining between today and the event date.
 * Positive number = days until event, 0 = today, negative = event passed.
 */
export function getDaysRemaining(eventDateIso: string, todayIso: string): number {
  const event = parseUtcDateOnly(eventDateIso);
  const today = parseUtcDateOnly(todayIso);
  const diffMs = event.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export interface TaskTemplateInput {
  id?: string;
  title: string;
  daysNeededBefore: number;
  priority: "high" | "medium" | "low";
  helperType?: string;
}

/**
 * Builds backward-scheduled checklist from event date.
 * Automatically flags tight schedules and late items based on current date.
 */
export function buildChecklist(
  eventDateIso: string,
  taskTemplates: TaskTemplateInput[],
  todayIso: string
): ChecklistTask[] {
  const todayClean = todayIso.slice(0, 10);
  const daysRemaining = getDaysRemaining(eventDateIso, todayIso);

  return taskTemplates.map((template, idx) => {
    const safeDays = Math.max(0, Math.round(template.daysNeededBefore));
    const dueDate = subtractDays(eventDateIso, safeDays);

    const isTightSchedule = daysRemaining < safeDays;
    const isLate = dueDate < todayClean;
    const priority = isLate || isTightSchedule ? "high" : template.priority;

    return {
      id: template.id || `task-${idx + 1}`,
      title: template.title,
      dueDate,
      priority,
      done: false,
      daysNeededBefore: safeDays,
      isTightSchedule,
      isLate,
      helperType: template.helperType,
    };
  });
}
