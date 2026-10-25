import type {
  DayScheduleBlock,
  ExtraExpenseWarning,
  SubEvent,
  VendorChecklist,
} from "../engine/types";
import type { TemplateCategoryInput } from "../engine/budget";
import type { TaskTemplateInput } from "../engine/timeline";
import { calculateGuestPlates } from "../engine/guests";

export function getBirthdaySubEvents(eventDate: string, invitedGuests: number): SubEvent[] {
  const g = calculateGuestPlates(invitedGuests, 0.10, 4); // 10% extra, 4 helpers

  return [
    {
      id: "bday-1",
      name: "Main Birthday Party",
      dateTime: `${eventDate} 17:30`,
      guests: g,
      hallMaxCapacity: Math.round(g.expectedTotal * 1.3),
      fixedTimings: [
        { label: "Guest Arrival & Snacks", time: "17:30" },
        { label: "Games & Magic Show", time: "18:15" },
        { label: "Cake Cutting", time: "19:30" },
        { label: "Dinner & Return Gifts", time: "20:00" },
      ],
    },
  ];
}

export const birthdayCategories: TemplateCategoryInput[] = [
  {
    category: "Food, Snacks & Cake",
    weightPct: 50,
    howItScales: "per_plate",
    doNotCut: true,
    advanceNeededPct: 40,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "Custom 3-tier designer fondant cake + live pasta & chaat station buffet",
      smart_mix: "2 kg themed cream cake + popular Indian snacks (pav bhaji, noodles, gulab jamun)",
      home_halwai_diy: "Fresh neighborhood bakery cake + homemade puri chole / samosa & frooti packs",
    },
    savingTip: "Order whipped cream cake rather than heavy fondant; tastes lighter and saves ₹600-₹1,000 per kg.",
    note: "Includes welcome drinks, party snacks, main celebration dinner, and birthday cake.",
  },
  {
    category: "Hall / Cafe or Home Tent",
    weightPct: 15,
    howItScales: "size_limit_slab",
    maxCapacityLimit: 60,
    advanceNeededPct: 50,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "Dedicated play-zone cafe or private restaurant party hall with arcade access",
      smart_mix: "Society clubhouse or rooftop terrace with rented air-coolers and chairs",
      home_halwai_diy: "Living room / home courtyard DIY setup with colorful floor mattresses & rugs",
    },
    savingTip: "Hosting at home or colony clubhouse saves ₹8,000-₹15,000 in cafe venue cover charges.",
  },
  {
    category: "Balloon & Theme Decoration",
    weightPct: 15,
    howItScales: "fixed_price",
    advanceNeededPct: 40,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "Grand balloon arch, 3D character cutouts, personalized neon sign & welcome board",
      smart_mix: "Professional balloon garland ring backdrop + happy birthday LED light",
      home_halwai_diy: "Amazon birthday decoration kit blown up with family & pinned with masking tape",
    },
    savingTip: "Buy a ₹500 DIY balloon garland strip online and blow balloons together as a family.",
  },
  {
    category: "Return Gifts for Kids",
    weightPct: 10,
    howItScales: "per_plate",
    advanceNeededPct: 60,
    eventWeekNeededPct: 40,
    styleOptions: {
      full_vendor_service: "Branded personalized cartoon gift hampers with water bottle & board game",
      smart_mix: "Useful stationary set + story book + small chocolate pouch",
      home_halwai_diy: "Classic comic/drawing book + crayon set packed with cheerful wrapping paper",
    },
    savingTip: "Buy return gift sets in dozen packs from local wholesale toy/stationery market.",
  },
  {
    category: "Photos & Games / Magic Show",
    weightPct: 10,
    howItScales: "fixed_price",
    advanceNeededPct: 50,
    eventWeekNeededPct: 50,
    styleOptions: {
      full_vendor_service: "Professional party anchor + 45-minute magic show + candid DSLR photographer",
      smart_mix: "Local magic show / tattoo artist + parent-hosted musical chairs & pass-the-parcel",
      home_halwai_diy: "Fun family games (musical statues, balloon burst) with smartphone photography",
    },
    savingTip: "Have an elder sibling or lively relative host musical chairs to save professional anchor fees.",
  },
];

export const birthdayExtraExpenses: ExtraExpenseWarning[] = [
  {
    id: "b-extra-1",
    title: "Extra Kids Accompanying Parents",
    category: "Food, Snacks & Cake",
    typicalAmount: 3000,
    simpleReason: "Young guests often bring younger siblings or parents who also stay for dinner.",
    addedToPlan: false,
  },
  {
    id: "b-extra-2",
    title: "Extra Return Gifts Buffer (5 packs)",
    category: "Return Gifts for Kids",
    typicalAmount: 1500,
    simpleReason: "Unplanned kid attendees will feel left out if return gifts run short.",
    addedToPlan: false,
  },
  {
    id: "b-extra-3",
    title: "Cake Table & Party Poppers/Candles",
    category: "Balloon & Theme Decoration",
    typicalAmount: 1200,
    simpleReason: "Musical sparkler candles, party poppers, birthday caps, and paper napkins.",
    addedToPlan: false,
  },
];

export const birthdayVendors: VendorChecklist[] = [
  {
    id: "v-cake",
    helperType: "Bakery / Cake Artist",
    daysBeforeToBook: 7,
    questionsToAsk: [
      "Does the cake price include delivery to venue in temperature-controlled box?",
      "Are customized topper, candles, and safe wooden knife provided?",
      "Can we choose eggless sponge with fresh seasonal fruits?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
  {
    id: "v-anchor",
    helperType: "Party Anchor / Magician",
    daysBeforeToBook: 14,
    questionsToAsk: [
      "What age group are your games and magic tricks best suited for?",
      "Do you bring your own small sound box and microphone?",
      "Will you help organize the cake cutting and keep all kids gathered?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
  {
    id: "v-balloon",
    helperType: "Balloon Decorator",
    daysBeforeToBook: 10,
    questionsToAsk: [
      "Do you use metallic/pastel balloons and safe wall tape that won't ruin paint?",
      "How much time before the party will decoration be fully completed?",
      "Do you bring your own backdrop stand so nothing needs to be nailed into walls?",
    ],
    bookingStatus: "not_started",
    priceQuotes: [],
  },
];

export const birthdayTaskTemplates: TaskTemplateInput[] = [
  { title: "Decide party theme & guest count", daysNeededBefore: 21, priority: "high" },
  { title: "Book venue or confirm colony clubhouse", daysNeededBefore: 15, priority: "high", helperType: "Hall / Cafe" },
  { title: "Book balloon decorator or buy DIY kit", daysNeededBefore: 10, priority: "medium", helperType: "Balloon Decorator" },
  { title: "Order custom theme birthday cake", daysNeededBefore: 7, priority: "high", helperType: "Bakery / Cake Artist" },
  { title: "Purchase return gifts & wrap them", daysNeededBefore: 5, priority: "medium" },
  { title: "Send WhatsApp digital invite with timing & Google map location", daysNeededBefore: 5, priority: "high" },
  { title: "Confirm snacks, cold drinks & juice boxes", daysNeededBefore: 2, priority: "high" },
];

export const birthdayDaySchedule: DayScheduleBlock[] = [
  {
    id: "bds-1",
    title: "Decoration setup & cake delivery",
    startTime: "15:30",
    durationMinutes: 90,
    bufferMinutesAfter: 30,
    blockType: "setup_cleanup",
  },
  {
    id: "bds-2",
    title: "Birthday boy/girl dressing & family photos",
    startTime: "17:00",
    durationMinutes: 45,
    bufferMinutesAfter: 15,
    blockType: "getting_ready",
  },
  {
    id: "bds-3",
    title: "Guest welcome, juice & warm snacks",
    startTime: "17:30",
    durationMinutes: 45,
    bufferMinutesAfter: 15,
    blockType: "food_serving",
  },
  {
    id: "bds-4",
    title: "Kids games, tattoo artist & magic show",
    startTime: "18:15",
    durationMinutes: 60,
    bufferMinutesAfter: 15,
    blockType: "main_ritual_program",
  },
  {
    id: "bds-5",
    title: "Cake cutting ceremony & celebration song",
    startTime: "19:30",
    durationMinutes: 30,
    bufferMinutesAfter: 15,
    blockType: "main_ritual_program",
  },
  {
    id: "bds-6",
    title: "Dinner buffet & return gift distribution",
    startTime: "20:00",
    durationMinutes: 75,
    bufferMinutesAfter: 20,
    blockType: "food_serving",
  },
];
