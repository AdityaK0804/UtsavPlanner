/**
 * Core Domain Interfaces for UtsavRipple
 * Plain-language, zero-jargon event planning engine.
 */

export type EventType = "wedding" | "birthday" | "colony_festival";

export type AppLanguage = "en" | "hinglish" | "hi";

export type BudgetStyle = "full_vendor_service" | "smart_mix" | "home_halwai_diy";

export type PriceStatus =
  | "typical_estimate"
  | "ai_idea"
  | "my_estimate"
  | "real_shop_price"
  | "paid";

export type HowItScales = "per_plate" | "fixed_price" | "size_limit_slab";

export interface GuestCount {
  invited: number;
  extraBufferPct: number; // default 0.15 (15% Indian buffer for family/extra guests)
  expectedTotal: number; // Math.ceil(invited * (1 + extraBufferPct))
  helperPlates: number; // plates for staff, cameraman, band, drivers
  totalPlatesToOrder: number; // expectedTotal + helperPlates
}

export interface SubEvent {
  id: string;
  name: string;
  dateTime: string; // ISO string or YYYY-MM-DD HH:mm
  guests: GuestCount;
  hallMaxCapacity?: number;
  fixedTimings?: { label: string; time: string }[];
}

export interface BudgetItem {
  id: string;
  category: string;
  howItScales: HowItScales;
  plannedAmount: number;
  actualPaid?: number;
  status: PriceStatus;
  doNotCut: boolean; // Must-Have (Do Not Cut Money 🔒)
  currentStyle: BudgetStyle;
  styleOptions: Record<BudgetStyle, string>;
  savingTip?: string;
  maxCapacityLimit?: number;
  advanceNeededPct: number;
  eventWeekNeededPct: number;
  note?: string;
}

export interface ExtraExpenseWarning {
  id: string;
  title: string;
  category: string;
  typicalAmount: number;
  simpleReason: string;
  addedToPlan: boolean;
}

export interface ChecklistTask {
  id: string;
  title: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  done: boolean;
  daysNeededBefore: number;
  isTightSchedule?: boolean;
  isLate?: boolean;
  helperType?: string;
}

export interface DayScheduleBlock {
  id: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  bufferMinutesAfter: number;
  blockType:
    | "getting_ready"
    | "procession_travel"
    | "main_ritual_program"
    | "food_serving"
    | "setup_cleanup";
  isOutdoor?: boolean;
  backupPlanNote?: string;
}

export interface VendorChecklist {
  id: string;
  helperType: string;
  daysBeforeToBook: number;
  questionsToAsk: string[];
  bookingStatus: "not_started" | "got_price" | "booked" | "completed";
  priceQuotes: { id: string; price: number; note?: string; date: string }[];
  savedContact?: { name?: string; phone?: string };
}

export interface MoneyRecord {
  id: string;
  type: "cash_in_hand" | "promised_money" | "paid_out";
  personName: string;
  amount: number;
  category?: string;
  note?: string;
  date: string;
}

export interface CashCheckSummary {
  advanceNeededNow: number;
  neededOnEventWeek: number;
  neededAfterEvent: number;
  cashInHandNow: number;
  promisedButNotReceived: number;
  totalSpentSoFar: number;
  cashShortfallNow: number;
  simpleWarning?: string;
}

export interface OptionComparison {
  label: string;
  invitedGuests: number;
  totalPlates: number;
  perPlateCost: number;
  totalFoodCost: number;
  remainingForOtherItems: number;
  fitsBudget: boolean;
  plainVerdict: string;
}

export interface EventPlan {
  id: string;
  type: EventType;
  language: AppLanguage;
  title: string;
  city?: string;
  citySize: "big_metro" | "medium_city" | "small_town";
  totalBudget: number;
  emergencyBufferPct: number;
  subEvents: SubEvent[];
  budgetItems: BudgetItem[];
  extraExpenseWarnings: ExtraExpenseWarning[];
  checklist: ChecklistTask[];
  daySchedule: DayScheduleBlock[];
  vendors: VendorChecklist[];
  moneyRecords: MoneyRecord[];
  preferences: {
    foodType?: string[];
    themeNote?: string;
    notes?: string;
  };
  aiSource: "ai" | "offline_backup";
  version: number;
  updatedAt: string;
}

export type ChangeAction =
  | { action: "change_guests"; subEventId?: string; newInvitedCount: number }
  | { action: "add_guests"; subEventId?: string; extraInvited: number }
  | { action: "move_date_by_days"; daysDelta: number }
  | { action: "set_new_date"; newDate: string }
  | { action: "change_total_budget"; newTotalBudget: number }
  | { action: "cut_or_grow_budget_pct"; pctDelta: number }
  | { action: "enter_real_shop_price"; category: string; realPrice: number }
  | { action: "set_do_not_cut"; category: string; doNotCut: boolean }
  | { action: "remove_sub_event"; subEventId: string };

export interface ChangePreviewDiff {
  budgetChanges: {
    category: string;
    oldAmount: number;
    newAmount: number;
    difference: number;
    doNotCut: boolean;
    oldStyle: BudgetStyle;
    newStyle: BudgetStyle;
    savingTip?: string;
  }[];
  totalSummary: {
    oldTotal: number;
    newTotal: number;
    totalBudgetLimit: number;
    overBudgetBy: number;
  };
  cashWarning?: string;
  taskWarnings: {
    id: string;
    title: string;
    status: "late" | "tight_schedule" | "date_moved";
  }[];
  vendorWarnings: {
    helperType: string;
    plainMessage: string;
  }[];
  plainSummaryMessages: string[];
}
