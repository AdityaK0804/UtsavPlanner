import type { EventPlan, SubEvent } from "../engine/types";
import { ParsedBriefSchema, type ParsedBriefInput } from "../ai/schemas";
import { calculateGuestPlates } from "../engine/guests";
import { buildInitialBudget } from "../engine/budget";
import { buildChecklist } from "../engine/timeline";

import {
  getWeddingSubEvents,
  weddingCategories,
  weddingExtraExpenses,
  weddingVendors,
  weddingTaskTemplates,
  weddingDaySchedule,
} from "./wedding";

import {
  getBirthdaySubEvents,
  birthdayCategories,
  birthdayExtraExpenses,
  birthdayVendors,
  birthdayTaskTemplates,
  birthdayDaySchedule,
} from "./birthday";

import {
  getColonySubEvents,
  colonyCategories,
  colonyExtraExpenses,
  colonyVendors,
  colonyTaskTemplates,
  colonyDaySchedule,
} from "./colony";

/**
 * Creates a fully articulated, valid EventPlan from parsed brief data.
 * Pure deterministic composition combining domain templates and calculation engine.
 */
export function createPlanFromTemplate(rawInput: ParsedBriefInput): EventPlan {
  const input = ParsedBriefSchema.parse(rawInput);
  const eventDate = input.eventDate.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  // 1. Select Blueprint
  let templateCategories = weddingCategories;
  let templateExtraExpenses = weddingExtraExpenses;
  let templateVendors = weddingVendors;
  let templateTasks = weddingTaskTemplates;
  let templateSchedule = weddingDaySchedule;
  let defaultSubEvents: SubEvent[] = [];

  if (input.eventType === "wedding") {
    templateCategories = weddingCategories;
    templateExtraExpenses = weddingExtraExpenses;
    templateVendors = weddingVendors;
    templateTasks = weddingTaskTemplates;
    templateSchedule = weddingDaySchedule;
    defaultSubEvents = getWeddingSubEvents(eventDate, input.invitedGuests);
  } else if (input.eventType === "birthday") {
    templateCategories = birthdayCategories;
    templateExtraExpenses = birthdayExtraExpenses;
    templateVendors = birthdayVendors;
    templateTasks = birthdayTaskTemplates;
    templateSchedule = birthdayDaySchedule;
    defaultSubEvents = getBirthdaySubEvents(eventDate, input.invitedGuests);
  } else if (input.eventType === "colony_festival") {
    templateCategories = colonyCategories;
    templateExtraExpenses = colonyExtraExpenses;
    templateVendors = colonyVendors;
    templateTasks = colonyTaskTemplates;
    templateSchedule = colonyDaySchedule;
    defaultSubEvents = getColonySubEvents(eventDate, input.invitedGuests);
  }

  // 2. Configure Sub-Events
  let subEvents: SubEvent[] = [];
  if (input.subEventNames && input.subEventNames.length > 0) {
    const primaryGuests = calculateGuestPlates(input.invitedGuests);
    subEvents = input.subEventNames.map((name, idx) => ({
      id: `custom-se-${idx + 1}`,
      name,
      dateTime: `${eventDate} ${16 + idx}:00`,
      guests: idx === 0 ? primaryGuests : calculateGuestPlates(Math.round(input.invitedGuests * 0.7)),
      hallMaxCapacity: Math.round(primaryGuests.expectedTotal * 1.25),
    }));
  } else {
    subEvents = defaultSubEvents;
  }

  const primaryGuests = subEvents[0]?.guests || calculateGuestPlates(input.invitedGuests);

  // 3. Mark Must-Have (Do Not Cut) Categories
  const categoriesToUse = templateCategories.map((cat) => {
    const isMustHave =
      cat.doNotCut ||
      (input.mustHaveCategories &&
        input.mustHaveCategories.some((must) =>
          cat.category.toLowerCase().includes(must.toLowerCase()) ||
          must.toLowerCase().includes(cat.category.toLowerCase())
        ));

    return {
      ...cat,
      doNotCut: !!isMustHave,
    };
  });

  // 4. Build Initial Budget
  const budgetItems = buildInitialBudget(
    categoriesToUse,
    input.totalBudget,
    primaryGuests,
    10,
    input.citySize
  );

  // 5. Build Checklist
  const checklist = buildChecklist(eventDate, templateTasks, today);

  // 6. Deep copy templates to avoid reference leaks
  const vendors = JSON.parse(JSON.stringify(templateVendors));
  const daySchedule = JSON.parse(JSON.stringify(templateSchedule));
  const extraExpenseWarnings = JSON.parse(JSON.stringify(templateExtraExpenses));

  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: input.eventType,
    language: input.language || "en",
    title: input.title,
    city: input.city || "",
    citySize: input.citySize || "medium_city",
    totalBudget: input.totalBudget,
    emergencyBufferPct: 10,
    subEvents,
    budgetItems,
    extraExpenseWarnings,
    checklist,
    daySchedule,
    vendors,
    moneyRecords: [],
    preferences: {
      foodType: input.foodType || [],
    },
    aiSource: "offline_backup",
    version: 1,
    updatedAt: today,
  };
}

export * from "./wedding";
export * from "./birthday";
export * from "./colony";
export * from "./presets";
