import type {
  DayScheduleBlock,
  ExtraExpenseWarning,
  SubEvent,
  VendorChecklist,
} from "../engine/types";
import type { TemplateCategoryInput } from "../engine/budget";
import type { TaskTemplateInput } from "../engine/timeline";
import { calculateGuestPlates } from "../engine/guests";
import { subtractDays } from "../engine/timeline";

export function getWeddingSubEvents(eventDate: string, invitedGuests: number): SubEvent[] {
  const gMain = calculateGuestPlates(invitedGuests);
  const gPre = calculateGuestPlates(Math.round(invitedGuests * 0.6));

  const day1Date = subtractDays(eventDate, 1);

  return [
    {
      id: "we-1",
      name: "Haldi & Mehendi",
      dateTime: `${day1Date} 11:00`,
      guests: gPre,
      fixedTimings: [{ label: "Haldi Shubh Muhurat", time: "11:30" }],
    },
    {
      id: "we-2",
      name: "Sangeet / Ring Ceremony",
      dateTime: `${day1Date} 19:00`,
      guests: gPre,
    },
    {
      id: "we-3",
      name: "Main Wedding & Reception",
      dateTime: `${eventDate} 18:30`,
      guests: gMain,
      hallMaxCapacity: Math.round(gMain.expectedTotal * 1.25),
      fixedTimings: [
        { label: "Baraat Swagat", time: "19:00" },
        { label: "Varmala", time: "20:00" },
        { label: "Shubh Pheras", time: "22:30" },
      ],
    },
  ];
}

export const weddingCategories: TemplateCategoryInput[] = [
  {
    category: "Food & Catering",
    weightPct: 42,
    howItScales: "per_plate",
    doNotCut: true,
    advanceNeededPct: 30,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "Live chaat counters, 3 sabzi, tandoor breads, 2 hot desserts & ice cream",
      smart_mix: "Halwai preparation with family-purchased desi ghee & raw groceries, 4 snacks & sweet",
      home_halwai_diy: "Single wholesome celebratory meal (puri, sabzi, dal makhani, paneer, gulab jamun)",
    },
    savingTip: "Buy dry grocery, cooking oil and ghee directly from wholesale grain market to reduce halwai margin.",
    note: "Covers all functions including breakfast, high-tea, and dinner.",
  },
  {
    category: "Hall / Marriage Garden & Tent",
    weightPct: 20,
    howItScales: "size_limit_slab",
    maxCapacityLimit: 300,
    advanceNeededPct: 40,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "Air-conditioned premium marriage resort with rooms included",
      smart_mix: "Community banquet hall with attached lawn and desert air-coolers",
      home_halwai_diy: "Colony community center or ancestral courtyard with waterproof shamiana",
    },
    savingTip: "Opt for an afternoon wedding or week-day date for 20-30% lower venue booking rates.",
  },
  {
    category: "Stage & Flower Decoration",
    weightPct: 10,
    howItScales: "fixed_price",
    advanceNeededPct: 40,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "Imported orchid & rose stage backdrop with fairy light tunnel walkway",
      smart_mix: "Fresh marigold (genda) & jasmine (mogra) traditional floral drape stage",
      home_halwai_diy: "Satin fabric drapes with family-arranged LED fairy lights",
    },
    savingTip: "Use seasonal Indian marigold flowers and reusable brass diyas instead of imported flowers.",
  },
  {
    category: "Photo & Video",
    weightPct: 8,
    howItScales: "fixed_price",
    advanceNeededPct: 30,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "2 candid + 2 traditional photographers, drone coverage & teaser video",
      smart_mix: "1 candid photographer + 1 traditional video cameraman + glossy printed album",
      home_halwai_diy: "Talented family cousin with DSLR + digital Google Drive album",
    },
    savingTip: "Hire a local studio photographer for traditional shots and ask for digital soft copies only.",
  },
  {
    category: "Makeup & Clothes",
    weightPct: 8,
    howItScales: "fixed_price",
    advanceNeededPct: 30,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "Bridal studio HD airbrush makeup with family hairdressing",
      smart_mix: "Local salon bridal package + family self-styling",
      home_halwai_diy: "Home bridal makeup artist / sister styling",
    },
    savingTip: "Book hair and saree draping with a freelance home artist rather than full bridal studio packages.",
  },
  {
    category: "Music / DJ & Band",
    weightPct: 5,
    howItScales: "fixed_price",
    advanceNeededPct: 50,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "High-wattage line array DJ, lighting truss & 11-piece brass band",
      smart_mix: "Party DJ setup with dual speakers + 2 live dhol walas for Baraat",
      home_halwai_diy: "Rented Bluetooth party speaker + curated family wedding Spotify playlist",
    },
    savingTip: "Book 2 dhol players for the Baraat entry and connect a rented party speaker for the dance floor.",
  },
  {
    category: "Travel & Guest Stay",
    weightPct: 4,
    howItScales: "fixed_price",
    advanceNeededPct: 40,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "AC hotel rooms for all outstation families + reserved Innova cabs",
      smart_mix: "Dharamshala / guest house block booking + tempo traveler for group station pickup",
      home_halwai_diy: "Relatives accommodated at family homes + carpooling",
    },
    savingTip: "Book an entire community trust dharamshala floor early for clean, economical family lodging.",
  },
];

export const weddingExtraExpenses: ExtraExpenseWarning[] = [
  {
    id: "w-extra-1",
    title: "Generator Diesel & Power Backup",
    category: "Hall / Marriage Garden & Tent",
    typicalAmount: 12000,
    simpleReason: "Marriage halls charge diesel per hour (₹800-₹1,200/hr) during summer or peak loads.",
    addedToPlan: false,
  },
  {
    id: "w-extra-2",
    title: "Extra Helper, Driver & Band Plates",
    category: "Food & Catering",
    typicalAmount: 8000,
    simpleReason: "Band walas, sound operators, drivers, and decorators also eat dinner during the reception.",
    addedToPlan: false,
  },
  {
    id: "w-extra-3",
    title: "Pandit Ji Dakshina & Puja Samagri",
    category: "Ceremony & Rituals",
    typicalAmount: 11000,
    simpleReason: "Havan wood, dry fruits, ghee, supari, and cash dakshina for rituals across 2 days.",
    addedToPlan: false,
  },
  {
    id: "w-extra-4",
    title: "Outstation Guest Station Pickup Cabs",
    category: "Travel & Guest Stay",
    typicalAmount: 15000,
    simpleReason: "Multiple train arrivals between 4 AM and midnight require reserved cabs or auto fare.",
    addedToPlan: false,
  },
  {
    id: "w-extra-5",
    title: "Last-Minute Printing & Shagun Envelopes",
    category: "Stationery & Gifts",
    typicalAmount: 5000,
    simpleReason: "Mithai box packaging, shagun envelopes, and welcome entry signage.",
    addedToPlan: false,
  },
];

export const weddingVendors: VendorChecklist[] = [
  {
    id: "v-halwai",
    helperType: "Catering / Halwai",
    daysBeforeToBook: 90,
    questionsToAsk: [
      "Is plate price inclusive of water bottles, coffee, and waiter service charge?",
      "How many live counters and staff members are included in the quote?",
      "What is your policy if extra guests turn up on the day?",
      "Do you provide dustbins, plate collection, and cleaning after the function?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
  {
    id: "v-hall",
    helperType: "Hall & Marriage Garden",
    daysBeforeToBook: 120,
    questionsToAsk: [
      "Is generator diesel included in the rent or billed separately per hour?",
      "What is the checkout time for rooms and hall cleaning the next morning?",
      "Are there any hidden electricity meter or AC surcharge fees?",
      "Are outside decorators and halwais permitted without extra royalty fee?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
  {
    id: "v-decor",
    helperType: "Tent & Flower Decorator",
    daysBeforeToBook: 60,
    questionsToAsk: [
      "Will you use fresh natural flowers or artificial plastic flowers on the stage?",
      "Is entrance arch and pathway lighting included in this package?",
      "By what time will the stage be 100% ready for photography?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
  {
    id: "v-photo",
    helperType: "Photo & Video Team",
    daysBeforeToBook: 75,
    questionsToAsk: [
      "How many traditional and candid photographers will come in person?",
      "What is the delivery timeline for raw photos, highlight video, and printed album?",
      "Are drone shots permitted at the venue and included in the price?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
  {
    id: "v-dj",
    helperType: "Music, DJ & Band",
    daysBeforeToBook: 45,
    questionsToAsk: [
      "Do you have local police permission / license for loud music till 10:00 PM?",
      "Is dhol player included with the Baraat setup or separate?",
      "Do you carry backup speakers in case of amplifier failure?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
];

export const weddingTaskTemplates: TaskTemplateInput[] = [
  { title: "Book marriage hall or lawn", daysNeededBefore: 120, priority: "high", helperType: "Hall & Marriage Garden" },
  { title: "Finalize Halwai / Caterer & taste test", daysNeededBefore: 90, priority: "high", helperType: "Catering / Halwai" },
  { title: "Book photographer & videographer", daysNeededBefore: 75, priority: "medium", helperType: "Photo & Video Team" },
  { title: "Book stage decorator & florist", daysNeededBefore: 60, priority: "medium", helperType: "Tent & Flower Decorator" },
  { title: "Send digital WhatsApp invitation card", daysNeededBefore: 45, priority: "high" },
  { title: "Book DJ, dhol & Baraat band", daysNeededBefore: 45, priority: "medium", helperType: "Music, DJ & Band" },
  { title: "Finalize clothes fittings and bridal makeup artist", daysNeededBefore: 30, priority: "high" },
  { title: "Re-confirm guest head count with Halwai", daysNeededBefore: 7, priority: "high", helperType: "Catering / Halwai" },
  { title: "Arrange cash envelopes for vendors", daysNeededBefore: 2, priority: "high" },
];

export const weddingDaySchedule: DayScheduleBlock[] = [
  {
    id: "ds-1",
    title: "Morning Haldi & Chuda ritual",
    startTime: "10:00",
    durationMinutes: 120,
    bufferMinutesAfter: 30,
    blockType: "main_ritual_program",
    isOutdoor: false,
  },
  {
    id: "ds-2",
    title: "Bridal / Groom Makeup & Safa Tying",
    startTime: "14:00",
    durationMinutes: 120,
    bufferMinutesAfter: 30,
    blockType: "getting_ready",
  },
  {
    id: "ds-3",
    title: "Baraat Assembly & Dhol Entry",
    startTime: "17:00",
    durationMinutes: 75,
    bufferMinutesAfter: 45,
    blockType: "procession_travel",
  },
  {
    id: "ds-4",
    title: "Varmala Ceremony on Stage",
    startTime: "19:00",
    durationMinutes: 45,
    bufferMinutesAfter: 20,
    blockType: "main_ritual_program",
  },
  {
    id: "ds-5",
    title: "Dinner & Guest Reception",
    startTime: "19:45",
    durationMinutes: 150,
    bufferMinutesAfter: 30,
    blockType: "food_serving",
  },
  {
    id: "ds-6",
    title: "Pheras & Kanyadaan Ceremony",
    startTime: "22:30",
    durationMinutes: 150,
    bufferMinutesAfter: 30,
    blockType: "main_ritual_program",
  },
];
