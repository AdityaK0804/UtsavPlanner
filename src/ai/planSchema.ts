import { z } from "zod";
import type { ChangePreviewDiff, EventPlan } from "../engine/types";
import { ChangeActionSchema } from "./schemas";

/**
 * Zod schema for an EventPlan that arrives from the browser.
 * The browser is not trusted: shape, types, sizes and number ranges are all checked
 * before the plan reaches the engine or is put into an AI prompt.
 */

export const PLAN_LIMITS = {
  subEvents: 30,
  budgetItems: 60,
  extraExpenseWarnings: 40,
  checklist: 200,
  daySchedule: 80,
  vendors: 60,
  moneyRecords: 1000,
  priceQuotesPerVendor: 50,
  questionsPerVendor: 30,
  maxMoney: 1_000_000_000,
} as const;

const id = z.string().trim().min(1).max(100);
const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(1000);
const money = z.number().finite().min(0).max(PLAN_LIMITS.maxMoney);
const pct = z.number().finite().min(0).max(100);
const count = z.number().int().min(0).max(100_000);

const AppLanguageSchema = z.enum(["en", "hinglish", "hi"]);
const BudgetStyleSchema = z.enum(["full_vendor_service", "smart_mix", "home_halwai_diy"]);
const PriceStatusSchema = z.enum(["typical_estimate", "ai_idea", "my_estimate", "real_shop_price", "paid"]);

export const GuestCountSchema = z.object({
  invited: z.number().int().min(1).max(20000),
  extraBufferPct: z.number().finite().min(0).max(5),
  expectedTotal: count,
  helperPlates: z.number().int().min(0).max(5000),
  totalPlatesToOrder: count,
});

const SubEventSchema = z.object({
  id,
  name: shortText.min(1),
  dateTime: z.string().trim().min(4).max(40),
  guests: GuestCountSchema,
  hallMaxCapacity: count.optional(),
  fixedTimings: z
    .array(z.object({ label: shortText, time: z.string().trim().max(20) }))
    .max(20)
    .optional(),
});

const BudgetItemSchema = z.object({
  id,
  category: shortText.min(1),
  howItScales: z.enum(["per_plate", "fixed_price", "size_limit_slab"]),
  plannedAmount: money,
  actualPaid: money.optional(),
  status: PriceStatusSchema,
  doNotCut: z.boolean(),
  currentStyle: BudgetStyleSchema,
  styleOptions: z.object({
    full_vendor_service: shortText,
    smart_mix: shortText,
    home_halwai_diy: shortText,
  }),
  savingTip: longText.optional(),
  maxCapacityLimit: count.optional(),
  advanceNeededPct: pct,
  eventWeekNeededPct: pct,
  note: longText.optional(),
});

const ExtraExpenseWarningSchema = z.object({
  id,
  title: shortText,
  category: shortText,
  typicalAmount: money,
  simpleReason: longText,
  addedToPlan: z.boolean(),
});

const ChecklistTaskSchema = z.object({
  id,
  title: shortText,
  dueDate: z.string().trim().min(4).max(40),
  priority: z.enum(["high", "medium", "low"]),
  done: z.boolean(),
  daysNeededBefore: z.number().int().min(0).max(1000),
  isTightSchedule: z.boolean().optional(),
  isLate: z.boolean().optional(),
  helperType: shortText.optional(),
});

const DayScheduleBlockSchema = z.object({
  id,
  title: shortText,
  startTime: z.string().trim().max(20),
  durationMinutes: z.number().int().min(0).max(1440),
  bufferMinutesAfter: z.number().int().min(0).max(1440),
  blockType: z.enum([
    "getting_ready",
    "procession_travel",
    "main_ritual_program",
    "food_serving",
    "setup_cleanup",
  ]),
  isOutdoor: z.boolean().optional(),
  backupPlanNote: longText.optional(),
});

const VendorChecklistSchema = z.object({
  id,
  helperType: shortText,
  daysBeforeToBook: z.number().int().min(0).max(1000),
  questionsToAsk: z.array(longText).max(PLAN_LIMITS.questionsPerVendor),
  bookingStatus: z.enum(["not_started", "got_price", "booked", "completed"]),
  priceQuotes: z
    .array(
      z.object({
        id,
        price: money,
        note: longText.optional(),
        date: z.string().trim().max(40),
      })
    )
    .max(PLAN_LIMITS.priceQuotesPerVendor),
  savedContact: z
    .object({ name: shortText.optional(), phone: z.string().trim().max(30).optional() })
    .optional(),
});

const MoneyRecordSchema = z.object({
  id,
  type: z.enum(["cash_in_hand", "promised_money", "paid_out"]),
  personName: shortText,
  amount: money,
  category: shortText.optional(),
  note: longText.optional(),
  date: z.string().trim().max(40),
});

export const EventPlanSchema: z.ZodType<EventPlan, z.ZodTypeDef, unknown> = z.object({
  id,
  type: z.enum(["wedding", "birthday", "colony_festival"]),
  language: AppLanguageSchema,
  title: shortText.min(1),
  city: z.string().trim().max(80).optional(),
  citySize: z.enum(["big_metro", "medium_city", "small_town"]),
  totalBudget: money,
  emergencyBufferPct: z.number().finite().min(0).max(50),
  subEvents: z.array(SubEventSchema).max(PLAN_LIMITS.subEvents),
  budgetItems: z.array(BudgetItemSchema).min(1).max(PLAN_LIMITS.budgetItems),
  extraExpenseWarnings: z.array(ExtraExpenseWarningSchema).max(PLAN_LIMITS.extraExpenseWarnings),
  checklist: z.array(ChecklistTaskSchema).max(PLAN_LIMITS.checklist),
  daySchedule: z.array(DayScheduleBlockSchema).max(PLAN_LIMITS.daySchedule),
  vendors: z.array(VendorChecklistSchema).max(PLAN_LIMITS.vendors),
  moneyRecords: z.array(MoneyRecordSchema).max(PLAN_LIMITS.moneyRecords),
  preferences: z.object({
    foodType: z.array(z.string().trim().max(50)).max(20).optional(),
    themeNote: longText.optional(),
    notes: longText.optional(),
  }),
  aiSource: z.enum(["ai", "offline_backup"]).default("offline_backup"),
  version: z.number().int().min(0).max(1_000_000).default(1),
  updatedAt: z.string().trim().max(40),
});

/** Only the engine ever needs at least one sub-event, so enforce it here as well. */
export const ValidatedEventPlanSchema = EventPlanSchema.refine(
  (plan) => plan.subEvents.length >= 1,
  { message: "A plan needs at least one sub-event.", path: ["subEvents"] }
);

// A before/after preview that the browser sends back when asking for WhatsApp drafts.
export const ChangePreviewDiffSchema: z.ZodType<ChangePreviewDiff, z.ZodTypeDef, unknown> = z.object({
  budgetChanges: z
    .array(
      z.object({
        category: shortText,
        oldAmount: money,
        newAmount: money,
        difference: z.number().finite().min(-PLAN_LIMITS.maxMoney).max(PLAN_LIMITS.maxMoney),
        doNotCut: z.boolean(),
        oldStyle: BudgetStyleSchema,
        newStyle: BudgetStyleSchema,
        savingTip: longText.optional(),
      })
    )
    .max(PLAN_LIMITS.budgetItems),
  totalSummary: z.object({
    oldTotal: money,
    newTotal: money,
    totalBudgetLimit: money,
    overBudgetBy: z.number().finite().min(-PLAN_LIMITS.maxMoney).max(PLAN_LIMITS.maxMoney),
  }),
  cashWarning: longText.optional(),
  taskWarnings: z
    .array(
      z.object({
        id,
        title: shortText,
        status: z.enum(["late", "tight_schedule", "date_moved"]),
      })
    )
    .max(PLAN_LIMITS.checklist),
  vendorWarnings: z
    .array(z.object({ helperType: shortText, plainMessage: longText }))
    .max(PLAN_LIMITS.vendors),
  plainSummaryMessages: z.array(longText).max(100),
});

// ---------------------------------------------------------------------------
// Request bodies for each route
// ---------------------------------------------------------------------------

/** YYYY-MM-DD that is also a real calendar day. */
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date format YYYY-MM-DD.")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "That date does not exist.");

export const PlanRequestSchema = z.object({
  promptText: z.string().max(2000).nullish(),
  language: AppLanguageSchema.optional(),
  structuredInput: z.record(z.unknown()).nullish(),
});

export const ChangeRequestSchema = z.object({
  plan: ValidatedEventPlanSchema,
  changeText: z.string().max(1000).nullish(),
  directActions: z.array(ChangeActionSchema).max(20).nullish(),
  todayIso: IsoDateSchema.nullish(),
});

export const IdeasRequestSchema = z.object({
  plan: ValidatedEventPlanSchema,
  followUp: z.string().max(1000).nullish(),
  language: AppLanguageSchema.optional(),
});

export const MessagesRequestSchema = z.object({
  plan: ValidatedEventPlanSchema,
  previewDiff: ChangePreviewDiffSchema.nullish(),
  language: AppLanguageSchema.optional(),
});