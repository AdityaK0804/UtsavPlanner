import type {
  AppLanguage,
  ChangeAction,
  ChangePreviewDiff,
  EventPlan,
} from "../engine/types";
import type {
  ChangeActionList,
  ParsedBrief,
  SimpleIdeas,
  WhatsAppMessages,
} from "./schemas";
import { buildWhatsAppLink, formatINR } from "../lib/whatsapp";
import { subtractDays } from "../engine/timeline";

/**
 * Fallback parser for raw event briefs without requiring an AI call.
 * Uses robust regex heuristics supporting Indian terms (Lakh, K, Hazar, Shadi, Mohalla).
 */
export function fallbackParseBrief(text: string, language: AppLanguage = "en"): ParsedBrief {
  const lower = text.toLowerCase();

  // 1. Detect Event Type
  let eventType: "wedding" | "birthday" | "colony_festival" = "wedding";
  if (
    lower.includes("birthday") ||
    lower.includes("bday") ||
    lower.includes("janamdin") ||
    lower.includes("cake")
  ) {
    eventType = "birthday";
  } else if (
    lower.includes("colony") ||
    lower.includes("mohalla") ||
    lower.includes("society") ||
    lower.includes("puja") ||
    lower.includes("pooja") ||
    lower.includes("utsav") ||
    lower.includes("ganesh") ||
    lower.includes("durga") ||
    lower.includes("navratri") ||
    lower.includes("chanda")
  ) {
    eventType = "colony_festival";
  }

  // 2. Extract Budget
  let totalBudget = eventType === "wedding" ? 500000 : eventType === "birthday" ? 25000 : 100000;
  // Match e.g. "8 lakh", "8.5 lakhs", "15k", "50 hazar", "₹8,00,000", "800000"
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i);
  const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:k|hazar|thousand)/i);
  const rawNumMatch = text.match(/(?:₹|rs\.?|inr)?\s*([1-9]\d{3,8})/i);

  if (lakhMatch) {
    totalBudget = Math.round(parseFloat(lakhMatch[1]) * 100000);
  } else if (kMatch) {
    totalBudget = Math.round(parseFloat(kMatch[1]) * 1000);
  } else if (rawNumMatch) {
    totalBudget = parseInt(rawNumMatch[1], 10);
  }

  // 3. Extract Guest Count
  let invitedGuests = eventType === "wedding" ? 150 : eventType === "birthday" ? 35 : 200;
  const guestMatch = lower.match(
    /(\d+)\s*(?:guests?|log|people|mehmaan|persons?|families|members)/i
  );
  if (guestMatch) {
    invitedGuests = Math.max(5, parseInt(guestMatch[1], 10));
  } else {
    // Try finding standalone numbers like 100, 200, 300, 50 that don't match year 2026/2027
    const altNum = lower.match(/\b([2-9]\d|[1-9]\d{2})\b/);
    if (altNum && parseInt(altNum[1], 10) !== 2026 && parseInt(altNum[1], 10) !== 2027) {
      invitedGuests = parseInt(altNum[1], 10);
    }
  }

  // 4. Extract City
  const cities = [
    "delhi", "mumbai", "jaipur", "lucknow", "bhopal", "indore", "kanpur",
    "pune", "hyderabad", "bangalore", "bengaluru", "kolkata", "ahmedabad",
    "nagpur", "patna", "chandigarh", "noida", "gurgaon"
  ];
  let city = "Jaipur";
  let citySize: "big_metro" | "medium_city" | "small_town" = "medium_city";
  for (const c of cities) {
    if (lower.includes(c)) {
      city = c.charAt(0).toUpperCase() + c.slice(1);
      if (["delhi", "mumbai", "bangalore", "bengaluru", "kolkata", "hyderabad"].includes(c)) {
        citySize = "big_metro";
      } else {
        citySize = "medium_city";
      }
      break;
    }
  }

  // 5. Must-Have Categories
  const mustHaveCategories: string[] = [];
  if (lower.includes("food") || lower.includes("khana") || lower.includes("catering") || lower.includes("halwai")) {
    mustHaveCategories.push("Food & Catering");
  }
  if (lower.includes("photo") || lower.includes("camera") || lower.includes("video")) {
    mustHaveCategories.push("Photo & Video");
  }
  if (lower.includes("decor") || lower.includes("flower") || lower.includes("balloon")) {
    mustHaveCategories.push("Stage & Flower Decoration");
  }

  // 6. Food Preference
  const foodType: string[] = [];
  if (lower.includes("jain")) foodType.push("jain");
  else if (lower.includes("pure veg") || lower.includes("vegetarian") || lower.includes("shakahari")) foodType.push("pure_veg");

  // Title
  let title = "Family Celebration";
  if (eventType === "wedding") title = "Traditional Wedding Celebration";
  else if (eventType === "birthday") title = "Birthday Party Celebration";
  else if (eventType === "colony_festival") title = "Colony Utsav & Mahaprasad";

  // Date (default 60 days from now)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 60);
  const eventDate = futureDate.toISOString().slice(0, 10);

  return {
    eventType,
    title,
    city,
    citySize,
    eventDate,
    invitedGuests,
    totalBudget,
    foodType,
    subEventNames: [],
    mustHaveCategories,
    language,
  };
}

/**
 * Fallback parser for "What Changed?" statements (supporting Hindi/Hinglish).
 */
export function fallbackParseChanges(
  text: string,
  currentPlan: EventPlan
): ChangeActionList {
  const lower = text.toLowerCase();
  const actions: ChangeAction[] = [];
  const notes: string[] = [];

  // 1. "Add X guests" / "X log badh gaye"
  const addMatch = lower.match(/(?:add|\+)\s*(\d+)\s*(?:guests?|log)?/i) ||
    lower.match(/(\d+)\s*(?:guests?|log|people)?\s*(?:badh gaye|extra|aur aa gaye|more)/i);

  // 2. "Guests went to X" / "new guest count X"
  const changeGuestMatch = lower.match(/(?:guests?(?:\s*count)?\s*(?:went to|became|is now|to))\s*(\d+)/i) ||
    lower.match(/(?:ab|now)\s*(\d+)\s*(?:guests?|log)/i);

  if (addMatch && !changeGuestMatch) {
    const extra = parseInt(addMatch[1], 10);
    actions.push({ action: "add_guests", extraInvited: extra });
    notes.push(`Added ${extra} extra guests.`);
  } else if (changeGuestMatch) {
    const count = parseInt(changeGuestMatch[1], 10);
    actions.push({ action: "change_guests", newInvitedCount: count });
    notes.push(`Updated total invited guests to ${count}.`);
  }

  // 3. Move date: "move date 14 days earlier" / "postpone by 7 days"
  const preponeMatch = lower.match(/(?:earlier|pehle|prepone)\s*(?:by)?\s*(\d+)\s*days?/i) ||
    lower.match(/(\d+)\s*days?\s*(?:earlier|pehle)/i);
  const postponeMatch = lower.match(/(?:postpone|later|aage|delay)\s*(?:by)?\s*(\d+)\s*days?/i) ||
    lower.match(/(\d+)\s*days?\s*(?:later|baad)/i);

  if (preponeMatch) {
    const d = parseInt(preponeMatch[1], 10);
    actions.push({ action: "move_date_by_days", daysDelta: -d });
    notes.push(`Moved event date ${d} days earlier.`);
  } else if (postponeMatch) {
    const d = parseInt(postponeMatch[1], 10);
    actions.push({ action: "move_date_by_days", daysDelta: d });
    notes.push(`Postponed event date by ${d} days.`);
  }

  // 4. Budget cuts / growths: "cut budget by 15%" / "budget badhao 20%"
  const cutPctMatch = lower.match(/(?:cut|reduce|kam karo)\s*(?:budget\s*)?(?:by\s*)?(\d+)%/i) ||
    lower.match(/(\d+)%\s*(?:cut|reduction|kam)/i);
  const growPctMatch = lower.match(/(?:increase|grow|badhao)\s*(?:budget\s*)?(?:by\s*)?(\d+)%/i);

  if (cutPctMatch) {
    const pct = parseInt(cutPctMatch[1], 10);
    actions.push({ action: "cut_or_grow_budget_pct", pctDelta: -pct });
    notes.push(`Reduced total budget by ${pct}%.`);
  } else if (growPctMatch) {
    const pct = parseInt(growPctMatch[1], 10);
    actions.push({ action: "cut_or_grow_budget_pct", pctDelta: pct });
    notes.push(`Increased total budget by ${pct}%.`);
  }

  // 5. Total budget update: "new total budget 800000"
  const newBudgetMatch = lower.match(/(?:total budget|new budget|budget is now)\s*(?:₹|rs\.?)?\s*(\d+)/i) ||
    lower.match(/(?:total budget|new budget)\s*(\d+(?:\.\d+)?)\s*lakh/i);
  if (newBudgetMatch) {
    const isLakh = newBudgetMatch[0].includes("lakh");
    const val = parseFloat(newBudgetMatch[1]);
    const budget = isLakh ? Math.round(val * 100000) : Math.round(val);
    actions.push({ action: "change_total_budget", newTotalBudget: budget });
    notes.push(`Set new total budget to ₹${budget.toLocaleString("en-IN")}.`);
  }

  // 6. Real shop prices: "venue quote 180000" / "halwai price 95000"
  const venuePriceMatch = lower.match(/(?:venue|hall|lawn|tent)\s*(?:quote|price|rate|cost|final)?\s*(?:is|of)?\s*(?:₹|rs\.?)?\s*(\d+)/i);
  const cateringPriceMatch = lower.match(/(?:catering|food|halwai|khana)\s*(?:quote|price|rate|cost|final)?\s*(?:is|of)?\s*(?:₹|rs\.?)?\s*(\d+)/i);
  const photoPriceMatch = lower.match(/(?:photo|photographer|video)\s*(?:quote|price|rate|cost|final)?\s*(?:is|of)?\s*(?:₹|rs\.?)?\s*(\d+)/i);

  if (venuePriceMatch && parseInt(venuePriceMatch[1], 10) > 1000) {
    const price = parseInt(venuePriceMatch[1], 10);
    const cat = currentPlan.budgetItems.find((b) =>
      b.category.toLowerCase().includes("hall") || b.category.toLowerCase().includes("tent")
    )?.category || "Hall / Marriage Garden & Tent";
    actions.push({ action: "enter_real_shop_price", category: cat, realPrice: price });
    notes.push(`Entered real shop price of ₹${price.toLocaleString("en-IN")} for ${cat}.`);
  }

  if (cateringPriceMatch && parseInt(cateringPriceMatch[1], 10) > 1000) {
    const price = parseInt(cateringPriceMatch[1], 10);
    const cat = currentPlan.budgetItems.find((b) =>
      b.category.toLowerCase().includes("food") || b.category.toLowerCase().includes("catering")
    )?.category || "Food & Catering";
    actions.push({ action: "enter_real_shop_price", category: cat, realPrice: price });
    notes.push(`Entered real shop price of ₹${price.toLocaleString("en-IN")} for ${cat}.`);
  }

  if (photoPriceMatch && parseInt(photoPriceMatch[1], 10) > 1000) {
    const price = parseInt(photoPriceMatch[1], 10);
    const cat = currentPlan.budgetItems.find((b) =>
      b.category.toLowerCase().includes("photo")
    )?.category || "Photo & Video";
    actions.push({ action: "enter_real_shop_price", category: cat, realPrice: price });
    notes.push(`Entered real shop price of ₹${price.toLocaleString("en-IN")} for ${cat}.`);
  }

  // 7. Lock / Unlock items: "lock food", "khana mat kaato"
  if (lower.includes("lock food") || lower.includes("khana mat kaato") || lower.includes("do not cut food")) {
    actions.push({ action: "set_do_not_cut", category: "Food & Catering", doNotCut: true });
    notes.push("Locked Food & Catering category.");
  } else if (lower.includes("unlock food")) {
    actions.push({ action: "set_do_not_cut", category: "Food & Catering", doNotCut: false });
    notes.push("Unlocked Food & Catering category.");
  }

  return {
    actions,
    plainExplanation: notes.length > 0
      ? notes.join(" ")
      : "Processed your event update accurately.",
  };
}

/**
 * Curated offline Indian idea bank for weddings, birthdays, and colony festivals.
 */
export function fallbackGenerateIdeas(
  plan: EventPlan,
  followUpPrompt?: string
): SimpleIdeas {
  const isWedding = plan.type === "wedding";
  const isBirthday = plan.type === "birthday";

  if (isBirthday) {
    return {
      themes: [
        {
          title: "Jungle Safari & Animal Adventure",
          simpleDescription: "Green leaf streamers, animal cutouts, and DIY face masks for all attending children.",
          estimatedCostRange: "₹2,500 - ₹4,000",
          status: "ai_idea",
        },
        {
          title: "Superhero Training Camp",
          simpleDescription: "Inexpensive cape and mask sets with simple obstacle course games in living room or park.",
          estimatedCostRange: "₹2,000 - ₹3,500",
          status: "ai_idea",
        },
      ],
      foodMenuIdeas: [
        {
          title: "Live Pav Bhaji & Mini Dosa Counter",
          simpleDescription: "Freshly tossed warm pav bhaji and crispy mini cheese dosas that kids and parents love.",
          estimatedCostRange: "₹180 - ₹240 per plate",
          status: "ai_idea",
        },
        {
          title: "Fresh Seasonal Fruit Skewers & Chocolate Fountain",
          simpleDescription: "Healthy banana, apple, and papaya chunks with warm chocolate dip bowl.",
          estimatedCostRange: "₹1,200 - ₹2,000 total",
          status: "ai_idea",
        },
      ],
      decorationIdeas: [
        {
          title: "DIY Balloon Arch Ring with Fairy Lights",
          simpleDescription: "Dual-tone pastel balloons wrapped around a rented metal circle hoop with warm LED strings.",
          estimatedCostRange: "₹1,500 - ₹2,500",
          status: "ai_idea",
        },
      ],
      savingTricks: [
        {
          title: "Order Whipped Cream Cake Over Heavy Fondant",
          simpleDescription: "Fondant adds ₹800/kg in non-edible icing weight. Whipped cream is softer, tastier, and cheaper.",
          estimatedCostRange: "Saves ₹1,200 - ₹2,000",
          status: "ai_idea",
        },
        {
          title: "Stationery Combo Gift Packs from Wholesale Market",
          simpleDescription: "Buy return gift drawing books and oil pastels by the dozen in wholesale bazaar.",
          estimatedCostRange: "Saves ₹800 - ₹1,500",
          status: "ai_idea",
        },
      ],
      rainOrPowerBackupIdeas: [
        {
          title: "Clubhouse / Covered Balcony Relocation Plan",
          simpleDescription: "Keep society community hall key handy with security guard in case of sudden rain showers.",
          estimatedCostRange: "₹0 - ₹500 (Tip)",
          status: "ai_idea",
        },
      ],
    };
  }

  if (isWedding) {
    return {
      themes: [
        {
          title: "Royal Marigold & Traditional Brass (Genda Utsav)",
          simpleDescription: "Vibrant yellow and orange fresh marigold drapes, brass urli with floating petals and diyas.",
          estimatedCostRange: "₹15,000 - ₹25,000",
          status: "ai_idea",
        },
        {
          title: "Pastel Sufi & Fairytale White Drapes",
          simpleDescription: "Soft blush pink satin fabric with warm fairy light curtains and fresh white mogra strings.",
          estimatedCostRange: "₹25,000 - ₹40,000",
          status: "ai_idea",
        },
      ],
      foodMenuIdeas: [
        {
          title: "Interactive Live Chaat & Kulhad Coffee Station",
          simpleDescription: "Dahi bhalla, golgappa with 3 flavors of pani, followed by hot frothy coffee in terracotta kulhads.",
          estimatedCostRange: "₹120 - ₹180 per plate",
          status: "ai_idea",
        },
        {
          title: "Regional Heritage Sweets (Moong Dal Halwa & Chenna Toast)",
          simpleDescription: "Warm winter halwa cooked in pure ghee alongside light spongy paneer sweets.",
          estimatedCostRange: "₹80 - ₹140 per plate",
          status: "ai_idea",
        },
      ],
      decorationIdeas: [
        {
          title: "Heritage Photobooth with Rented Scooter or Rickshaw",
          simpleDescription: "A painted vintage scooter decorated with marigold garlands for memorable family group photos.",
          estimatedCostRange: "₹3,500 - ₹6,000",
          status: "ai_idea",
        },
      ],
      savingTricks: [
        {
          title: "Direct Wholesale Raw Grocery Purchase for Halwai",
          simpleDescription: "Purchase grain, oil, desi ghee, sugar, and dry fruits yourself from grain mandi to eliminate halwai markup.",
          estimatedCostRange: "Saves ₹25,000 - ₹50,000",
          status: "ai_idea",
        },
        {
          title: "Opt for Digital WhatsApp Invitation Video",
          simpleDescription: "Skip expensive physical paper boxes and send a high-resolution animated card on WhatsApp.",
          estimatedCostRange: "Saves ₹10,000 - ₹25,000",
          status: "ai_idea",
        },
      ],
      rainOrPowerBackupIdeas: [
        {
          title: "Covered Dining Hall Backup & Sound Earthing",
          simpleDescription: "Ensure buffet counters are placed under waterproof tarpaulin with an on-site diesel generator standby.",
          estimatedCostRange: "₹8,000 - ₹12,000",
          status: "ai_idea",
        },
      ],
    };
  }

  // Colony Festival
  return {
    themes: [
      {
        title: "Eco-Friendly Matka & Bamboo Pandal Decor",
        simpleDescription: "Hand-painted terracotta pots, bamboo screens, and paper lanterns crafted by colony youth.",
        estimatedCostRange: "₹5,000 - ₹10,000",
        status: "ai_idea",
      },
    ],
    foodMenuIdeas: [
      {
        title: "Traditional Bhandara Khichdi & Poori Halwa",
        simpleDescription: "Desi ghee khichdi with mixed winter vegetables, accompanied by hot puris and semolina halwa.",
        estimatedCostRange: "₹60 - ₹90 per plate",
        status: "ai_idea",
      },
    ],
    decorationIdeas: [
      {
        title: "Colony Rangoli Competition at Pandal Entrance",
        simpleDescription: "Host an evening floral rangoli contest where society teams decorate the main walkway.",
        estimatedCostRange: "₹1,500 for prizes",
        status: "ai_idea",
      },
    ],
    savingTricks: [
      {
        title: "Door-to-Door Raw Grocery Sahyog (Flour & Oil)",
        simpleDescription: "Ask each flat to donate 2 kg wheat flour or 1 liter cooking oil directly for the bhandara.",
        estimatedCostRange: "Saves ₹15,000 - ₹25,000",
        status: "ai_idea",
      },
    ],
    rainOrPowerBackupIdeas: [
      {
        title: "Waterproof Sloping Tarpaulin over Pandal Stage",
        simpleDescription: "Ensure pandal roof has adequate slope with side drain trenches to prevent water stagnation.",
        estimatedCostRange: "₹2,000 - ₹4,000",
        status: "ai_idea",
      },
    ],
  };
}

/**
 * Fallback drafts 5 tailored WhatsApp messages with valid wa.me URLs.
 */
export function fallbackDraftMessages(
  plan: EventPlan,
  preview?: ChangePreviewDiff
): WhatsAppMessages & { whatsappLinks: { audience: string; link: string }[] } {
  const primaryDate = plan.subEvents[0]?.dateTime || "Upcoming Date";
  const totalPlates = plan.subEvents[0]?.guests.totalPlatesToOrder || 100;
  const lang = plan.language || "en";

  let halwaiMsg = "";
  let tentMsg = "";
  let familyMsg = "";
  let inviteMsg = "";
  let colonyMsg = "";

  if (lang === "hi") {
    halwaiMsg = `🙏 नमस्ते हलवाई / कैटरर जी,\nहमारे कार्यक्रम "${plan.title}" की तारीख ${primaryDate} है।\nकुल प्लेट ऑर्डर ${totalPlates} प्लेट्स (स्टाफ और एक्स्ट्रा बफर सहित) फाइनल रहेगा।\nकृपया प्रति-प्लेट रेट, सर्विस स्टाफ और पानी की व्यवस्था कन्फर्म करें।\nधन्यवाद!`;
    tentMsg = `🙏 नमस्ते टेंट और डेकोरेशन जी,\nकार्यक्रम "${plan.title}" के लिए शाम 4:00 बजे तक वाटरप्रूफ स्टेज, लाइटिंग और बैठने की व्यवस्था तैयार चाहिए।\nतारीख: ${primaryDate}। कृपया समय पर सेटअप पूरा करने की पुष्टि करें।`;
    familyMsg = `🎉 *परिवार सूचना: ${plan.title}* 🎉\nतारीख: ${primaryDate}\nसभी तैयारियां तय बजट (${formatINR(plan.totalBudget)}) के अनुसार चल रही हैं।\nकृपया समय से पहुंचें और अपनी जिम्मेदारियां संभालें!`;
    inviteMsg = `🌸 *हार्दिक निमंत्रण: ${plan.title}* 🌸\nआप सपरिवार हमारे इस शुभ अवसर पर सादर आमंत्रित हैं।\n📅 तारीख: ${primaryDate}\n📍 स्थान: ${plan.city || "हमारा निवास"}\nआपकी उपस्थिति हमारे उत्सव की शोभा बढ़ाएगी।\n- ${plan.title} परिवार`;
    colonyMsg = `🚩 *सोसायटी उत्सव सूचना: ${plan.title}* 🚩\n📅 तारीख: ${primaryDate}\nशाम 6:30 बजे महाआरती और 8:00 बजे महाप्रसाद वितरण रहेगा।\nसभी कॉलोनी निवासी सपरिवार सादर आमंत्रित हैं।\n- आयोजन समिति`;
  } else if (lang === "hinglish") {
    halwaiMsg = `🙏 Namaste Caterer / Halwai Ji,\nHamare function "${plan.title}" ki date ${primaryDate} hai.\nTotal plate count: ${totalPlates} plates (including staff & helper plates).\nKripya plate rate, waiter staff aur mineral water inclusion re-confirm kar dein.\nDhanyawad!`;
    tentMsg = `🙏 Namaste Tent / Decorator Ji,\n"${plan.title}" ke liye sham 4:00 PM tak stage, lightings aur sitting arrangement fully ready chahiye.\nDate: ${primaryDate}। Please setup completion time confirm karein.`;
    familyMsg = `🎉 *Family Update: ${plan.title}* 🎉\nDate: ${primaryDate}\nTotal Budget: ${formatINR(plan.totalBudget)}.\nSabhi tayyariyaan track par hain. Sabhi log time se pohchein aur help karein!`;
    inviteMsg = `🌸 *Warm Invitation: ${plan.title}* 🌸\nAap sabhi saparivaar hamare is celebration mein sadar aamantrit hain.\n📅 Date: ${primaryDate}\n📍 City: ${plan.city || "Venue"}\nAapki presence se hamara utsav aur khushnuma banega!\n- Family`;
    colonyMsg = `🚩 *Colony Notice: ${plan.title}* 🚩\n📅 Date: ${primaryDate}\nSham 6:30 PM Maha Aarti aur 8:00 PM Bhandara Mahaprasad rahega.\nSabhi society residents sa-parivar zaroor padharein!\n- Utsav Committee`;
  } else {
    halwaiMsg = `Dear Caterer,\nThis is regarding "${plan.title}" scheduled on ${primaryDate}.\nOur confirmed order is ${totalPlates} plates (including helper and driver plates).\nPlease re-confirm the per-plate rate, live counters, and service staff details.\nThank you!`;
    tentMsg = `Dear Decorator / Tent Manager,\nFor our upcoming event "${plan.title}" on ${primaryDate}, please ensure stage decor, seating, and generator lighting setup is 100% complete by 4:00 PM.\nPlease confirm completion timing.`;
    familyMsg = `🎉 *Family Coordination Update: ${plan.title}* 🎉\nDate: ${primaryDate}\nTotal Budget: ${formatINR(plan.totalBudget)}\nArrangements are moving smoothly. Let's ensure all assigned duties are coordinated on schedule!`;
    inviteMsg = `🌸 *Warm Celebration Invitation: ${plan.title}* 🌸\nWe cordially invite you with family to join us in celebrating our auspicious event.\n📅 Date: ${primaryDate}\n📍 Venue / City: ${plan.city || "Our Venue"}\nYour warm presence will make our celebration complete!`;
    colonyMsg = `🚩 *Colony Celebration Notice: ${plan.title}* 🚩\n📅 Date: ${primaryDate}\nEvening Aarti commences at 6:30 PM followed by community Mahaprasad at 8:00 PM.\nAll society families and children are warmly invited to attend.`;
  }

  const messages = [
    { audience: "caterer_halwai" as const, title: "Caterer / Halwai Confirmation", messageText: halwaiMsg },
    { audience: "decorator_tent" as const, title: "Tent & Stage Setup Confirmation", messageText: tentMsg },
    { audience: "family_group" as const, title: "Family Coordination Update", messageText: familyMsg },
    { audience: "guests_invite" as const, title: "Guest Invitation & RSVP", messageText: inviteMsg },
    { audience: "colony_group" as const, title: "Colony / Society Announcement", messageText: colonyMsg },
  ];

  const whatsappLinks = messages.map((m) => ({
    audience: m.audience,
    link: buildWhatsAppLink(m.messageText),
  }));

  return {
    messages,
    whatsappLinks,
  };
}
