import { describe, it, expect } from "vitest";
import { buildChecklist, getDaysRemaining, subtractDays } from "@/engine/timeline";
import { checkDaySchedule } from "@/engine/schedule";
import { summarizeMoneyTracker } from "@/engine/moneyTracker";
import { previewLifeChanges } from "@/engine/changes";
import type {
  DayScheduleBlock,
  EventPlan,
  MoneyRecord,
} from "@/engine/types";

describe("Engine: Timeline & Checklist (timeline.ts)", () => {
  it("calculates backward due dates and days remaining accurately", () => {
    // 2026-11-20 minus 30 days = 2026-10-21
    const due = subtractDays("2026-11-20", 30);
    expect(due).toBe("2026-10-21");

    // Days remaining across month boundary
    const days = getDaysRemaining("2026-11-20", "2026-10-20");
    expect(days).toBe(31);

    // Leap year boundary check (Feb 2028: 2028 is leap year)
    const leapDays = getDaysRemaining("2028-03-01", "2028-02-28");
    expect(leapDays).toBe(2);
  });

  it("builds backward checklist and flags tight schedules and late tasks", () => {
    const templates = [
      { title: "Book Hall / Marriage Lawn", daysNeededBefore: 60, priority: "high" as const },
      { title: "Confirm Halwai Menu", daysNeededBefore: 20, priority: "medium" as const },
      { title: "Send WhatsApp Invites", daysNeededBefore: 15, priority: "medium" as const },
    ];

    // Today is 2026-11-01, Event is 2026-11-20 (only 19 days left)
    // 60 days before would be in September -> LATE!
    // 20 days before would be 2026-10-31 -> LATE!
    // 15 days before is 2026-11-05 -> TIGHT (19 days remaining vs 15 needed)!
    const checklist = buildChecklist("2026-11-20", templates, "2026-11-01");

    expect(checklist).toHaveLength(3);

    const hallTask = checklist.find((t) => t.title.includes("Book Hall"));
    expect(hallTask?.isLate).toBe(true);
    expect(hallTask?.priority).toBe("high");

    const inviteTask = checklist.find((t) => t.title.includes("Send WhatsApp"));
    expect(inviteTask?.dueDate).toBe("2026-11-05");
    expect(inviteTask?.isLate).toBe(false);
  });
});

describe("Engine: Day Schedule Checks (schedule.ts)", () => {
  it("identifies missing gaps, short makeup time, tight baraat buffers, and outdoor rain risks", () => {
    const badSchedule: DayScheduleBlock[] = [
      {
        id: "b1",
        title: "Bridal Makeup & Safa Tying",
        startTime: "16:00",
        durationMinutes: 45, // < 90 mins -> should warn
        bufferMinutesAfter: 10, // < 15 mins -> should warn
        blockType: "getting_ready",
      },
      {
        id: "b2",
        title: "Baraat Procession & Dhol Entry",
        startTime: "17:00",
        durationMinutes: 60,
        bufferMinutesAfter: 15, // < 30 mins for procession -> should warn
        blockType: "procession_travel",
      },
      {
        id: "b3",
        title: "Lawn Varmala & Dinner",
        startTime: "18:15",
        durationMinutes: 120,
        bufferMinutesAfter: 20,
        blockType: "main_ritual_program",
        isOutdoor: true,
        backupPlanNote: "", // Outdoor with no backup -> should warn
      },
    ];

    const warnings = checkDaySchedule(badSchedule);
    expect(warnings.length).toBeGreaterThanOrEqual(4);

    expect(warnings.some((w) => w.includes("Bridal Makeup") && w.includes("under 90 minutes"))).toBe(true);
    expect(warnings.some((w) => w.includes("15 minutes gap after"))).toBe(true);
    expect(warnings.some((w) => w.includes("Baraat Procession") && w.includes("under 30 minutes buffer"))).toBe(true);
    expect(warnings.some((w) => w.includes("Lawn Varmala") && w.includes("no rain or heat backup"))).toBe(true);
  });

  it("passes cleanly when schedule has generous buffers and covered backups", () => {
    const goodSchedule: DayScheduleBlock[] = [
      {
        id: "g1",
        title: "Family Makeup & Dressing",
        startTime: "14:00",
        durationMinutes: 120,
        bufferMinutesAfter: 30,
        blockType: "getting_ready",
      },
      {
        id: "g2",
        title: "Baraat & Welcome",
        startTime: "16:30",
        durationMinutes: 60,
        bufferMinutesAfter: 45,
        blockType: "procession_travel",
      },
      {
        id: "g3",
        title: "Main Ceremony",
        startTime: "18:15",
        durationMinutes: 90,
        bufferMinutesAfter: 30,
        blockType: "main_ritual_program",
        isOutdoor: true,
        backupPlanNote: "Attached Banquet AC Hall booked in case of rain",
      },
    ];

    const warnings = checkDaySchedule(goodSchedule);
    expect(warnings).toHaveLength(0);
  });
});

describe("Engine: Money Tracker & WhatsApp Summary (moneyTracker.ts)", () => {
  it("summarizes collections, promises, expenses and builds WhatsApp audit text", () => {
    const records: MoneyRecord[] = [
      {
        id: "r1",
        type: "cash_in_hand",
        personName: "Sharma Ji (Flat 402)",
        amount: 5000,
        date: "2026-10-01",
      },
      {
        id: "r2",
        type: "cash_in_hand",
        personName: "Gupta Ji (Flat 104)",
        amount: 3000,
        date: "2026-10-02",
      },
      {
        id: "r3",
        type: "promised_money",
        personName: "Verma Ji (Flat 201)",
        amount: 4000,
        date: "2026-10-02",
      },
      {
        id: "r4",
        type: "paid_out",
        personName: "Tent Booking Advance",
        amount: 2500,
        date: "2026-10-05",
      },
    ];

    const summary = summarizeMoneyTracker("Ganesh Utsav 2026", records, 25000);

    expect(summary.totalCashInHand).toBe(8000);
    expect(summary.totalPromised).toBe(4000);
    expect(summary.totalPaidOut).toBe(2500);
    expect(summary.readyCashBalance).toBe(5500); // 8,000 - 2,500
    expect(summary.netProjectedBalance).toBe(9500); // 8,000 + 4,000 - 2,500

    expect(summary.whatsappAuditText).toContain("Ganesh Utsav 2026");
    expect(summary.whatsappAuditText).toContain("Cash Collected (In Hand):* ₹8,000");
    expect(summary.whatsappAuditText).toContain("Promised Chanda / Sahyog:* ₹4,000");
    expect(summary.whatsappAuditText).toContain("Total Paid Out / Kharcha:* ₹2,500");
    expect(summary.whatsappAuditText).toContain("Sharma Ji (Flat 402)");
  });
});

describe("Engine: Life Changes Simulator (changes.ts)", () => {
  const samplePlan: EventPlan = {
    id: "plan-test-1",
    type: "wedding",
    language: "en",
    title: "Ankit & Sneha Wedding",
    city: "Lucknow",
    citySize: "medium_city",
    totalBudget: 200000,
    emergencyBufferPct: 10,
    subEvents: [
      {
        id: "sub-main",
        name: "Main Wedding & Reception",
        dateTime: "2026-12-15 19:00",
        guests: {
          invited: 100,
          extraBufferPct: 0.15,
          expectedTotal: 115,
          helperPlates: 10,
          totalPlatesToOrder: 125,
        },
      },
    ],
    budgetItems: [
      {
        id: "cat-catering",
        category: "Catering / Halwai",
        howItScales: "per_plate",
        plannedAmount: 90000,
        status: "typical_estimate",
        doNotCut: false,
        currentStyle: "smart_mix",
        styleOptions: {
          full_vendor_service: "3-course live buffet",
          smart_mix: "Halwai package with fresh sweets",
          home_halwai_diy: "Single wholesome celebratory meal",
        },
        advanceNeededPct: 25,
        eventWeekNeededPct: 60,
      },
      {
        id: "cat-tent",
        category: "Community Hall / Venue",
        howItScales: "size_limit_slab",
        maxCapacityLimit: 130, // capacity limit is 130 guests!
        plannedAmount: 50000,
        status: "typical_estimate",
        doNotCut: false,
        currentStyle: "smart_mix",
        styleOptions: {
          full_vendor_service: "Banquet Hall with centralized AC",
          smart_mix: "Community hall with air coolers",
          home_halwai_diy: "Colony club house or courtyard",
        },
        advanceNeededPct: 50,
        eventWeekNeededPct: 50,
      },
      {
        id: "cat-photo",
        category: "Photography",
        howItScales: "fixed_price",
        plannedAmount: 40000,
        status: "typical_estimate",
        doNotCut: false,
        currentStyle: "smart_mix",
        styleOptions: {
          full_vendor_service: "Cinematic 4K 2-photographer team",
          smart_mix: "Single traditional photographer + album",
          home_halwai_diy: "Family cousin with DSLR + digital copies",
        },
        advanceNeededPct: 30,
        eventWeekNeededPct: 50,
      },
      {
        id: "emergency-buffer-line",
        category: "Emergency Buffer (Extra Cash)",
        howItScales: "fixed_price",
        plannedAmount: 20000,
        status: "typical_estimate",
        doNotCut: true,
        currentStyle: "smart_mix",
        styleOptions: {
          full_vendor_service: "Bank cash buffer",
          smart_mix: "Bank cash buffer",
          home_halwai_diy: "Bank cash buffer",
        },
        advanceNeededPct: 0,
        eventWeekNeededPct: 100,
      },
    ],
    extraExpenseWarnings: [],
    checklist: [
      {
        id: "t1",
        title: "Confirm Halwai Menu",
        dueDate: "2026-11-25",
        priority: "medium",
        done: false,
        daysNeededBefore: 20,
      },
    ],
    daySchedule: [],
    vendors: [
      {
        id: "v1",
        helperType: "Catering / Halwai",
        daysBeforeToBook: 30,
        questionsToAsk: ["What is your plate charge?"],
        bookingStatus: "booked",
        priceQuotes: [{ id: "q1", price: 90000, date: "2026-10-10" }],
      },
    ],
    moneyRecords: [
      {
        id: "m1",
        type: "cash_in_hand",
        personName: "Bank Savings",
        amount: 60000,
        date: "2026-10-01",
      },
    ],
    preferences: {},
    aiSource: "offline_backup",
    version: 1,
    updatedAt: "2026-10-01",
  };

  it("handles guest count jumps, scales per_plate costs, and detects capacity slab breach", () => {
    // Guest jump from 100 to 140 invited
    // 140 * 1.15 = 161 expected + 10 helpers = 171 total plates
    // 161 expectedTotal > 130 maxCapacityLimit of the hall!
    const { updatedPlan, preview } = previewLifeChanges(
      samplePlan,
      [{ action: "change_guests", newInvitedCount: 140 }],
      "2026-10-25"
    );

    // Plan version incremented
    expect(updatedPlan.version).toBe(2);
    // Input not mutated
    expect(samplePlan.subEvents[0].guests.invited).toBe(100);

    // Guest count updated
    expect(updatedPlan.subEvents[0].guests.invited).toBe(140);
    expect(updatedPlan.subEvents[0].guests.totalPlatesToOrder).toBe(171);

    // Hall capacity breach warning triggered
    const capacityWarn = preview.vendorWarnings.find((w) =>
      w.plainMessage.includes("capacity limit")
    );
    expect(capacityWarn).toBeDefined();
    expect(capacityWarn?.plainMessage).toContain("Community Hall");

    // Caterer vendor notice triggered
    const catererWarn = preview.vendorWarnings.find((w) =>
      w.helperType.includes("Catering")
    );
    expect(catererWarn).toBeDefined();

    // Budget rebalanced
    expect(preview.budgetChanges.length).toBeGreaterThan(0);
  });

  it("handles date changes, shifts tasks, flags late/tight tasks, and checks cash readiness", () => {
    // Move date closer by 25 days (from Dec 15 to Nov 20)
    // If today is 2026-11-01, new date is 2026-11-20 (19 days away <= 21 days!)
    const { updatedPlan, preview } = previewLifeChanges(
      samplePlan,
      [{ action: "move_date_by_days", daysDelta: -25 }],
      "2026-11-01"
    );

    expect(updatedPlan.subEvents[0].dateTime).toContain("2026-11-20");

    // Task warning for date move
    expect(preview.taskWarnings.length).toBeGreaterThan(0);

    // Booked vendor notification
    const vendorNotice = preview.vendorWarnings.find((w) =>
      w.helperType.includes("Booked Vendors")
    );
    expect(vendorNotice).toBeDefined();

    // Cash check triggers because <= 21 days
    expect(preview.cashWarning).toBeDefined();
  });

  it("handles budget cuts with Do Not Cut protection and automatic style downgrades", () => {
    // Cut total budget from 2,00,000 to 1,40,000
    // Lock Photography so it cannot be cut
    const { updatedPlan, preview } = previewLifeChanges(
      samplePlan,
      [
        { action: "set_do_not_cut", category: "Photography", doNotCut: true },
        { action: "change_total_budget", newTotalBudget: 140000 },
      ],
      "2026-10-25"
    );

    expect(updatedPlan.totalBudget).toBe(140000);

    // Photography should remain 40,000
    const photo = updatedPlan.budgetItems.find((i) => i.category.includes("Photography"));
    expect(photo?.plannedAmount).toBe(40000);
    expect(photo?.doNotCut).toBe(true);

    // Unlocked items dropped and stepped down style
    const changedCatering = preview.budgetChanges.find((c) =>
      c.category.includes("Catering")
    );
    expect(changedCatering).toBeDefined();
    expect(changedCatering?.newStyle).toBe("home_halwai_diy");
    expect(changedCatering?.savingTip).toBeDefined();
  });

  it("handles real shop prices cleanly", () => {
    const { updatedPlan, preview } = previewLifeChanges(
      samplePlan,
      [{ action: "enter_real_shop_price", category: "Catering", realPrice: 110000 }],
      "2026-10-25"
    );

    const catering = updatedPlan.budgetItems.find((i) => i.category.includes("Catering"));
    expect(catering?.plannedAmount).toBe(110000);
    expect(catering?.status).toBe("real_shop_price");

    // Summary reflects change
    expect(preview.plainSummaryMessages.some((m) => m.includes("real shop price"))).toBe(true);
  });

  it("gracefully rejects invalid actions without throwing exceptions", () => {
    const { preview } = previewLifeChanges(
      samplePlan,
      [
        { action: "change_guests", newInvitedCount: -50 },
        { action: "remove_sub_event", subEventId: "sub-main" }, // Only 1 sub-event exists!
      ],
      "2026-10-25"
    );

    expect(
      preview.plainSummaryMessages.some((m) => m.includes("Guest count must be at least 1"))
    ).toBe(true);
    expect(
      preview.plainSummaryMessages.some((m) => m.includes("Cannot remove the only remaining"))
    ).toBe(true);
  });
});
