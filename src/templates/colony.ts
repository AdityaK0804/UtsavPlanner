import type {
  DayScheduleBlock,
  ExtraExpenseWarning,
  SubEvent,
  VendorChecklist,
} from "../engine/types";
import type { TemplateCategoryInput } from "../engine/budget";
import type { TaskTemplateInput } from "../engine/timeline";
import { calculateGuestPlates } from "../engine/guests";

export function getColonySubEvents(eventDate: string, invitedGuests: number): SubEvent[] {
  const g = calculateGuestPlates(invitedGuests, 0.20, 15); // 20% walk-in colony buffer, 15 helper plates

  return [
    {
      id: "col-1",
      name: "Main Puja, Cultural Night & Mahaprasad",
      dateTime: `${eventDate} 17:00`,
      guests: g,
      hallMaxCapacity: Math.round(g.expectedTotal * 1.2),
      fixedTimings: [
        { label: "Maha Aarti", time: "18:30" },
        { label: "Colony Kids Cultural Program", time: "19:15" },
        { label: "Bhandara / Mahaprasad Distribution", time: "20:30" },
      ],
    },
  ];
}

export const colonyCategories: TemplateCategoryInput[] = [
  {
    category: "Mahaprasad / Bhandara Food",
    weightPct: 45,
    howItScales: "per_plate",
    doNotCut: true,
    advanceNeededPct: 35,
    eventWeekNeededPct: 55,
    styleOptions: {
      full_vendor_service: "Full catering agency setup with buffet counters, staff & compostable plates",
      smart_mix: "Halwai cooking live with colony-purchased groceries, volunteer serving teams",
      home_halwai_diy: "Colony kitchen community cooking (puri, sabzi, kheer/halwa) by resident volunteers",
    },
    savingTip: "Organize dry grocery collection (atta, oil, sugar, spices) directly from resident families to cut cost by 40%.",
    note: "Includes evening Mahaprasad bhandara, sweet prasad, drinking water dispensers and leaf plates.",
  },
  {
    category: "Pandal, Tent & Sound/Mic",
    weightPct: 25,
    howItScales: "size_limit_slab",
    maxCapacityLimit: 400,
    advanceNeededPct: 40,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "German hanger waterproof pandal, stage truss, 4-speaker sound & podium mic",
      smart_mix: "Traditional waterproof shamiana tent with clean floor carpet darri, 50 chairs & 2 mics",
      home_halwai_diy: "Open-air canopy / society park gazebo with colony PA system & basic tarpaulin",
    },
    savingTip: "Rent floor carpets and mattresses instead of expensive banquet chairs to accommodate 3x more people.",
  },
  {
    category: "Murti / Idol & Puja Samagri",
    weightPct: 12,
    howItScales: "fixed_price",
    advanceNeededPct: 50,
    eventWeekNeededPct: 40,
    styleOptions: {
      full_vendor_service: "6-foot artisan clay idol + complete puja kit, Pandit Ji dakshina & daily flowers",
      smart_mix: "Eco-friendly 3-4 foot clay murti + puja samagri box + senior neighborhood priest",
      home_halwai_diy: "Eco-friendly clay idol crafted by colony kids + colony resident chanting Aarti",
    },
    savingTip: "Choose an eco-friendly clay (shadu mati) idol that dissolves easily in local society drum.",
  },
  {
    category: "Light Decoration & Gate",
    weightPct: 10,
    howItScales: "fixed_price",
    advanceNeededPct: 30,
    eventWeekNeededPct: 60,
    styleOptions: {
      full_vendor_service: "Illuminated welcoming LED gate, tree wrapping lights & color floodlights",
      smart_mix: "Bright fairy lights around pandal perimeter + 2 focus lights on stage",
      home_halwai_diy: "Colony Diwali string lights pooled from residents & hung by volunteers",
    },
    savingTip: "Borrow string lights from society flats rather than commercial rental.",
  },
  {
    category: "Cultural Program / Kids Prizes",
    weightPct: 8,
    howItScales: "fixed_price",
    advanceNeededPct: 60,
    eventWeekNeededPct: 40,
    styleOptions: {
      full_vendor_service: "Engraved brass trophies, drawing competition kits & certificates for all participants",
      smart_mix: "Medals, drawing book sets, educational gift packs & participation chocolates",
      home_halwai_diy: "Handcrafted certificates, stationary kits & sweet boxes for all participants",
    },
    savingTip: "Reach out to local tuition centers or neighborhood businesses to sponsor kids' prizes.",
  },
];

export const colonyExtraExpenses: ExtraExpenseWarning[] = [
  {
    id: "c-extra-1",
    title: "Visarjan / Procession Tempo & Sound",
    category: "Pandal, Tent & Sound/Mic",
    typicalAmount: 8000,
    simpleReason: "Tempo truck rental, dhol walas, and floral garlands for idol immersion procession.",
    addedToPlan: false,
  },
  {
    id: "c-extra-2",
    title: "Generator Fuel for Power Cuts",
    category: "Pandal, Tent & Sound/Mic",
    typicalAmount: 6000,
    simpleReason: "Diesel charges to prevent sound and light outage during main evening Maha Aarti.",
    addedToPlan: false,
  },
  {
    id: "c-extra-3",
    title: "Post-Event Colony Cleaning Labor",
    category: "Emergency & Cleaning Buffer",
    typicalAmount: 4000,
    simpleReason: "Hiring sanitization helpers to clear disposable leaf plates, water cups, and pandal waste.",
    addedToPlan: false,
  },
  {
    id: "c-extra-4",
    title: "Local Electrician & Meter Permission",
    category: "Light Decoration & Gate",
    typicalAmount: 3500,
    simpleReason: "Temporary load connection, MCB box setup, and certified earthing wire installation.",
    addedToPlan: false,
  },
];

export const colonyVendors: VendorChecklist[] = [
  {
    id: "v-pandal",
    helperType: "Tent & Pandal Vendor",
    daysBeforeToBook: 20,
    questionsToAsk: [
      "Is the shamiana waterproof and secured with sandbags for wind?",
      "Are carpet, floor darri, and adequate chairs included?",
      "What is the setup completion time on the morning of Sthapana?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
  {
    id: "v-sound",
    helperType: "Sound & Electrician",
    daysBeforeToBook: 15,
    questionsToAsk: [
      "Will an operator stay through evening Aarti and announcements?",
      "Is separate wiring done with proper earthing to prevent shock?",
      "Do you provide at least 2 wireless mics for Aarti and cultural performances?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
  {
    id: "v-bhandara",
    helperType: "Halwai for Mahaprasad / Bhandara",
    daysBeforeToBook: 12,
    questionsToAsk: [
      "Will you bring large kadhais, gas burners, and serving buckets?",
      "Does raw grocery list (patal, dona, oil, spices) get provided 3 days in advance?",
      "Can food be prepared cleanly in the society courtyard without mess?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
];

export const colonyTaskTemplates: TaskTemplateInput[] = [
  { title: "Hold society general meeting & form volunteer committees", daysNeededBefore: 25, priority: "high" },
  { title: "Start door-to-door chanda (contribution) collection", daysNeededBefore: 20, priority: "high" },
  { title: "Book eco-friendly idol with local clay artisan", daysNeededBefore: 18, priority: "high" },
  { title: "Book pandal, tent, darri & sound system", daysNeededBefore: 15, priority: "high", helperType: "Tent & Pandal Vendor" },
  { title: "Purchase grocery items for Bhandara / Mahaprasad", daysNeededBefore: 4, priority: "high" },
  { title: "Inspect electrical earthing & setup MCB safety box", daysNeededBefore: 2, priority: "high", helperType: "Sound & Electrician" },
  { title: "Post transparent chanda collection list in WhatsApp group", daysNeededBefore: 1, priority: "medium" },
];

export const colonyDaySchedule: DayScheduleBlock[] = [
  {
    id: "cds-1",
    title: "Pandal inspection, electrical checks & stage cleaning",
    startTime: "09:00",
    durationMinutes: 90,
    bufferMinutesAfter: 30,
    blockType: "setup_cleanup",
  },
  {
    id: "cds-2",
    title: "Halwai arrives & starts cooking Mahaprasad / Bhandara",
    startTime: "13:00",
    durationMinutes: 180,
    bufferMinutesAfter: 30,
    blockType: "food_serving",
  },
  {
    id: "cds-3",
    title: "Evening Aarti, Dhol & Shlok Chanting",
    startTime: "18:30",
    durationMinutes: 45,
    bufferMinutesAfter: 15,
    blockType: "main_ritual_program",
  },
  {
    id: "cds-4",
    title: "Colony kids singing, dance & drama performances",
    startTime: "19:30",
    durationMinutes: 60,
    bufferMinutesAfter: 15,
    blockType: "main_ritual_program",
  },
  {
    id: "cds-5",
    title: "Bhandara Mahaprasad distribution to all residents",
    startTime: "20:45",
    durationMinutes: 120,
    bufferMinutesAfter: 30,
    blockType: "food_serving",
  },
  {
    id: "cds-6",
    title: "Pandal cleanup & waste disposal by volunteer team",
    startTime: "23:15",
    durationMinutes: 60,
    bufferMinutesAfter: 15,
    blockType: "setup_cleanup",
  },
];
