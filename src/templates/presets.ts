import type { EventPlan } from "../engine/types";
import { createPlanFromTemplate } from "./index";

/**
 * 3 rich, ready-to-use demo EventPlan presets for 1-click testing & evaluation.
 */

// 1. Wedding Preset: Middle-class North Indian wedding in Lucknow / Jaipur
export const PRESET_WEDDING: EventPlan = (() => {
  const plan = createPlanFromTemplate({
    eventType: "wedding",
    title: "Sharma Family Wedding (Rahul & Priya)",
    city: "Jaipur",
    citySize: "medium_city",
    eventDate: "2026-12-10",
    invitedGuests: 200,
    totalBudget: 800000,
    foodType: ["pure_veg", "rajasthani_special"],
    subEventNames: ["Haldi & Mehendi", "Sangeet & Ring Ceremony", "Main Wedding & Reception"],
    mustHaveCategories: ["Food & Catering", "Photo & Video"],
    language: "en",
  });

  plan.moneyRecords = [
    {
      id: "mr-w1",
      type: "cash_in_hand",
      personName: "Sharma Family Savings",
      amount: 300000,
      category: "Savings Account",
      date: "2026-10-01",
    },
    {
      id: "mr-w2",
      type: "cash_in_hand",
      personName: "Maternal Uncle (Mama Ji) Contribution",
      amount: 100000,
      category: "Family Contribution",
      date: "2026-10-15",
    },
    {
      id: "mr-w3",
      type: "promised_money",
      personName: "Elder Brother Bonus (November)",
      amount: 150000,
      note: "Salary bonus expected by Nov 10",
      date: "2026-10-20",
    },
    {
      id: "mr-w4",
      type: "paid_out",
      personName: "Marriage Garden Advance Token",
      amount: 80000,
      category: "Hall / Marriage Garden & Tent",
      date: "2026-10-10",
    },
  ];

  return plan;
})();

// 2. Birthday Preset: Tight budget DIY home celebration
export const PRESET_BIRTHDAY: EventPlan = (() => {
  const plan = createPlanFromTemplate({
    eventType: "birthday",
    title: "Aarav's 1st Birthday at Home",
    city: "Bhopal",
    citySize: "medium_city",
    eventDate: "2026-11-15",
    invitedGuests: 35,
    totalBudget: 15000, // Tight budget (₹15,000 / ~43 plates = ₹348/plate -> home_halwai_diy style)
    foodType: ["pure_veg", "kid_friendly"],
    subEventNames: ["Main Birthday Party"],
    mustHaveCategories: ["Food, Snacks & Cake"],
    language: "hinglish",
  });

  plan.moneyRecords = [
    {
      id: "mr-b1",
      type: "cash_in_hand",
      personName: "Papa UPI Wallet",
      amount: 10000,
      date: "2026-10-20",
    },
    {
      id: "mr-b2",
      type: "cash_in_hand",
      personName: "Mummy Cash Envelope",
      amount: 5000,
      date: "2026-10-20",
    },
    {
      id: "mr-b3",
      type: "paid_out",
      personName: "Bakery Advance Token for 2kg Cake",
      amount: 1000,
      category: "Food, Snacks & Cake",
      date: "2026-10-22",
    },
  ];

  return plan;
})();

// 3. Colony / Mohalla Festival Preset: Community Ganesh Utsav with Chanda collection
export const PRESET_COLONY: EventPlan = (() => {
  const plan = createPlanFromTemplate({
    eventType: "colony_festival",
    title: "Shanti Nagar Colony Ganesh Utsav",
    city: "Indore",
    citySize: "medium_city",
    eventDate: "2026-11-28",
    invitedGuests: 250,
    totalBudget: 120000,
    foodType: ["satvik_prasad", "pure_veg"],
    subEventNames: ["Main Puja, Cultural Night & Mahaprasad"],
    mustHaveCategories: ["Mahaprasad / Bhandara Food", "Murti / Idol & Puja Samagri"],
    language: "hi",
  });

  plan.moneyRecords = [
    {
      id: "mr-c1",
      type: "cash_in_hand",
      personName: "Tower A Residents Chanda (30 flats)",
      amount: 35000,
      date: "2026-10-10",
    },
    {
      id: "mr-c2",
      type: "cash_in_hand",
      personName: "Tower B Residents Chanda (25 flats)",
      amount: 30000,
      date: "2026-10-12",
    },
    {
      id: "mr-c3",
      type: "promised_money",
      personName: "Tower C Residents Pending Collection",
      amount: 25000,
      note: "Volunteer Deepak collection in progress",
      date: "2026-10-15",
    },
    {
      id: "mr-c4",
      type: "promised_money",
      personName: "Local Grocery Store Sponsor (Gupta Kirana)",
      amount: 10000,
      note: "Promised 2 oil tins + ₹5,000 cash",
      date: "2026-10-16",
    },
    {
      id: "mr-c5",
      type: "paid_out",
      personName: "Murti Clay Artisan Advance",
      amount: 6000,
      category: "Murti / Idol & Puja Samagri",
      date: "2026-10-18",
    },
    {
      id: "mr-c6",
      type: "paid_out",
      personName: "Shamiana Tent Booking Token",
      amount: 10000,
      category: "Pandal, Tent & Sound/Mic",
      date: "2026-10-20",
    },
  ];

  return plan;
})();
