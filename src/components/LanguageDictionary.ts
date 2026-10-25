import type { AppLanguage } from "@/engine/types";

export type CelebrationCardId =
  | "wedding"
  | "haldi"
  | "mehendi"
  | "sangeet"
  | "birthday"
  | "babyshower"
  | "anniversary"
  | "housewarming"
  | "ganesh"
  | "navratri"
  | "diwali"
  | "lohri";

export interface TranslationStrings {
  brandName: string;
  brandTagline: string;
  navCards: string;
  navWhatChanged: string;
  navBudget: string;
  navCashVendors: string;
  navChecklist: string;
  navPlanNow: string;
  statusAiOnline: string;
  statusOfflineSafe: string;

  // Hero Section
  heroEyebrow: string;
  heroHeadlineMain: string;
  heroHeadlineHighlight: string;
  heroSubtitle: string;
  promptPlaceholder: string;
  btnBuildPlan: string;
  btnBuilding: string;
  quickTryLabel: string;

  // 3D Card Deck
  fanDeckTitle: string;
  fanDeckSubtitle: string;
  cardPreviewTitle: string;
  btnUseThisPlan: string;
  btnClose: string;
  badgePlates: string;
  badgeFunctions: string;

  // Section Headers & Tools
  sectionWhatChangedTitle: string;
  sectionWhatChangedSubtitle: string;
  sectionBudgetTitle: string;
  sectionBudgetSubtitle: string;
  sectionCashTitle: string;
  sectionCashSubtitle: string;
  sectionChecklistTitle: string;
  sectionChecklistSubtitle: string;

  // Labels & Actions
  labelDoNotCut: string;
  labelRealShopPrice: string;
  labelCashInHand: string;
  labelPromisedMoney: string;
  labelSpentSoFar: string;
  labelShortfall: string;
  labelStyleFull: string;
  labelStyleSmart: string;
  labelStyleDiy: string;
  btnSendWhatsApp: string;
  btnExportJson: string;

  // Celebration cards scroll section
  cards: Record<CelebrationCardId, { title: string; tag: string }>;
  cardsHeadline: string;
  cardsSub: string;
  cardsHint: string;
  cardsCta: string;
  cardGuests: string;
  cardSample: string;
  cardPickAria: string;
  cardsListAria: string;
  stepLabel: string;
  s1Title: string;
  s1Line: string;
  s1Label: string;
  s1Placeholder: string;
  s1Apply: string;
  s1Quick: string;
  platesTitle: string;
  platesLine: string;
  functionsToggle: string;
  catererToggle: string;
  catererLine: string;
  s1Next: string;
  s2Title: string;
  s2Line: string;
  s2Total: string;
  s2TipsToggle: string;
  s2CompareToggle: string;
  s2ExtrasToggle: string;
  s2Next: string;
  s3Title: string;
  s3Line: string;
  s3VendorsToggle: string;
  s3MoneyToggle: string;
  s3MsgToggle: string;
  s3Next: string;
  s4Title: string;
  s4Line: string;
  s4IdeasToggle: string;
  s4Print: string;
  s4Done: string;
  tabChecklist: string;
  tabSchedule: string;
  // Round 2: planner workspace, menus
  langAria: string;
  langAnnounce: string;
  menuOpen: string;
  menuClose: string;
  stepShort: [string, string, string, string];
  stepsAria: string;
  stepBack: string;
  seeAll: string;
  showLess: string;
  segChange: string;
  segCaterer: string;
  segFunctions: string;
  segItems: string;
  segSave: string;
  segCompare: string;
  segExtras: string;
  segVendors: string;
  segMoney: string;
  segMsgs: string;
  segIdeas: string;
  doneCount: string;
  nextUp: string;
  lockedCount: string;
  allDone: string;
  heroRule1: string;
  heroRule1Line: string;
  heroRule2: string;
  heroRule2Line: string;
  heroRule3: string;
  heroRule3Line: string;
  heroBlueprints: string;
  guideLabel: string;
  footBlurb: string;
  footPlan: string;
  footYourPlan: string;
  footLanguage: string;
  footSave: string;
  footExport: string;
  footImport: string;
  footPrint: string;
  footNote: string;
  footCopy: string;
  footBackToTop: string;
}

export const DICTIONARY: Record<AppLanguage, TranslationStrings> = {
  en: {
    brandName: "Utsav Planner",
    brandTagline: "Plain-Language Indian Celebration Planner",
    navCards: "Celebrations",
    navWhatChanged: "What Changed",
    navBudget: "Budget",
    navCashVendors: "Cash & Vendors",
    navChecklist: "Timeline",
    navPlanNow: "Plan now",
    statusAiOnline: "AI Online",
    statusOfflineSafe: "Engine Active",

    heroEyebrow: "A MILLION REASONS TO CELEBRATE — BIG OR SMALL",
    heroHeadlineMain: "HAR KHUSHI KA",
    heroHeadlineHighlight: "APNA PLAN",
    heroSubtitle:
      "Plan weddings, birthdays, or colony festivals in simple everyday words. Change guests, dates, or prices anytime—your plan adjusts automatically with zero financial jargon.",
    promptPlaceholder:
      "e.g., Sister's wedding in Jaipur, 200 guests, ₹8 Lakh budget, keep catering locked, smart mix style...",
    btnBuildPlan: "Build My Plan",
    btnBuilding: "Organizing your celebration...",
    quickTryLabel: "Or click any celebration card to test live:",

    fanDeckTitle: "Explore Real Celebration Blueprints",
    fanDeckSubtitle: "Hover to pick a card, click to see full guest counts and budgets",
    cardPreviewTitle: "Celebration Scenario Preview",
    btnUseThisPlan: "Use This Plan & Customize 👇",
    btnClose: "Close",
    badgePlates: "Plates",
    badgeFunctions: "Programs",

    sectionWhatChangedTitle: "What Changed in Real Life?",
    sectionWhatChangedSubtitle:
      "Indian celebrations never stay static. Tell us in plain words if guests increased, dates shifted, or you got a real shop price.",
    sectionBudgetTitle: "Budget Allocation & Style Swaps",
    sectionBudgetSubtitle:
      "Transparent breakdown with 'Do Not Cut' locks and real shop price rebalancing.",
    sectionCashTitle: "Cash Needed Now vs Cash in Hand",
    sectionCashSubtitle:
      "Know exactly how much advance cash is due today versus during the event week.",
    sectionChecklistTitle: "Backward Schedule & Street-Smart Checklists",
    sectionChecklistSubtitle:
      "Key milestones scheduled backward from your event date so nothing is left to the last minute.",

    labelDoNotCut: "Must-Have (Do Not Cut 🔒)",
    labelRealShopPrice: "Real Shop Price",
    labelCashInHand: "Cash in Hand",
    labelPromisedMoney: "Promised Money (Chanda)",
    labelSpentSoFar: "Paid Out",
    labelShortfall: "Missing Cash Right Now",
    labelStyleFull: "Full Service Booking",
    labelStyleSmart: "Smart Mix (Self + Vendor)",
    labelStyleDiy: "Home & Local Halwai DIY",
    btnSendWhatsApp: "Share on WhatsApp",
    btnExportJson: "Download Plan (JSON)",

    // Celebration cards, simpler sections and footer
    cards: {
      wedding: { title: "Wedding", tag: "Big day" },
      haldi: { title: "Haldi", tag: "Morning ritual" },
      mehendi: { title: "Mehendi", tag: "Henna evening" },
      sangeet: { title: "Sangeet", tag: "Dance night" },
      birthday: { title: "Birthday", tag: "At home" },
      babyshower: { title: "Baby shower", tag: "Family blessing" },
      anniversary: { title: "Anniversary", tag: "Years together" },
      housewarming: { title: "Housewarming", tag: "New home" },
      ganesh: { title: "Ganesh Puja", tag: "Colony festival" },
      navratri: { title: "Navratri", tag: "Garba nights" },
      diwali: { title: "Diwali", tag: "Festival of lights" },
      lohri: { title: "Lohri", tag: "Bonfire evening" },
    },
    cardsHeadline: "EVERY REASON TO CELEBRATE",
    cardsSub: "Weddings, birthdays, pujas and festivals. Tap a card to start your plan.",
    cardsHint: "Keep scrolling",
    cardsCta: "Start my plan",
    cardGuests: "guests",
    cardSample: "Sample plan",
    cardPickAria: "Start a plan for {title}",
    cardsListAria: "Celebration cards",
    stepLabel: "Step {n} of 4",
    s1Title: "What changed?",
    s1Line: "Tell us in plain words. Your plan updates by itself.",
    s1Label: "Type what changed",
    s1Placeholder: "e.g. 50 more guests are coming",
    s1Apply: "Update my plan",
    s1Quick: "Or tap one",
    platesTitle: "Plates to order",
    platesLine: "{invited} invited + {extra} extra guests + {helpers} helper plates",
    functionsToggle: "See each function ({n})",
    catererToggle: "Check a caterer's plate count",
    catererLine: "Did your caterer ask for more plates? Type their number to see if it is fair.",
    s1Next: "Next: your budget",
    s2Title: "Where does the money go?",
    s2Line: "Lock what matters. Type a real shop price and the rest adjusts.",
    s2Total: "Total budget",
    s2TipsToggle: "Ways to save ({n})",
    s2CompareToggle: "Compare two guest lists",
    s2ExtrasToggle: "Costs people often forget ({n})",
    s2Next: "Next: your cash",
    s3Title: "Do you have the cash?",
    s3Line: "See what you must pay now and what you have in hand.",
    s3VendorsToggle: "Questions to ask before paying an advance",
    s3MoneyToggle: "Family & colony money book",
    s3MsgToggle: "Ready-to-send WhatsApp messages",
    s3Next: "Next: your timeline",
    s4Title: "Your timeline",
    s4Line: "What to do and when, counted back from your date.",
    s4IdeasToggle: "Get ideas for your celebration",
    s4Print: "Print my plan",
    s4Done: "Your plan is ready.",
    tabChecklist: "Checklist",
    tabSchedule: "Day schedule",
    langAria: "Change language, current: {name}",
    langAnnounce: "Language changed to {name}",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    stepShort: ["Guests", "Budget", "Cash", "Timeline"],
    stepsAria: "Planning steps",
    stepBack: "Back",
    seeAll: "See all ({n})",
    showLess: "Show less",
    segChange: "Change something",
    segCaterer: "Caterer check",
    segFunctions: "Functions",
    segItems: "Costs",
    segSave: "Save money",
    segCompare: "Compare",
    segExtras: "Forgotten costs",
    segVendors: "Vendors",
    segMoney: "Money book",
    segMsgs: "WhatsApp",
    segIdeas: "Ideas",
    doneCount: "{done} of {total} done",
    nextUp: "Do this next",
    lockedCount: "{n} of {total} locked",
    allDone: "Everything on the list is done.",
    heroRule1: "15% guest buffer",
    heroRule1Line: "Uninvited guests, drivers and helpers are counted, so food never runs short.",
    heroRule2: "Lock what matters",
    heroRule2Line: "Locked costs stay safe. The rest adjusts when your budget changes.",
    heroRule3: "Cash, not promises",
    heroRule3Line: "Money in hand and money promised are kept apart, so advance day is calm.",
    heroBlueprints: "Popular plans",
    guideLabel: "Guide",
    footBlurb: "Plan weddings, birthdays and colony festivals in plain words.",
    footPlan: "Plan",
    footYourPlan: "Your plan",
    footLanguage: "Language",
    footSave: "Save in this browser",
    footExport: "Download as a file",
    footImport: "Open a saved file",
    footPrint: "Print summary",
    footNote: "Prices shown are typical estimates. Check real shop prices before you pay.",
    footCopy: "© 2026 Utsav Planner",
    footBackToTop: "Back to top",
  },

  hinglish: {
    brandName: "Utsav Planner",
    brandTagline: "Har Indian Household Ka Event Planner",
    navCards: "Celebrations",
    navWhatChanged: "Kya Badla",
    navBudget: "Budget",
    navCashVendors: "Cash & Halwai",
    navChecklist: "Timeline",
    navPlanNow: "Plan karo",
    statusAiOnline: "AI Online",
    statusOfflineSafe: "Engine Active",

    heroEyebrow: "HAR CHHOTE-BADE CELEBRATION KE LIYE",
    heroHeadlineMain: "HAR KHUSHI KA",
    heroHeadlineHighlight: "APNA PLAN",
    heroSubtitle:
      "Shadi, birthday ya colony festival plan karein bilkul aasan bhasha mein. Mehmaan badhein, date badle ya dukan ka asli rate aaye—plan apne aap rebalance ho jayega bina kisi complicated jargon ke.",
    promptPlaceholder:
      "jaise, Chhoti behen ki shadi Jaipur me, 200 guests, ₹8 Lakh budget, khana ka budget lock rakhein...",
    btnBuildPlan: "Mera Plan Banao",
    btnBuilding: "Plan tayyar ho raha hai...",
    quickTryLabel: "Ya seedha kisi card par click karke live test karein:",

    fanDeckTitle: "Asli Celebration Blueprints Dekhein",
    fanDeckSubtitle: "Hover karke card chunein, click karke plate aur budget dekhein",
    cardPreviewTitle: "Celebration Scenario Preview",
    btnUseThisPlan: "Yeh Plan Use Karein & Customize Karein 👇",
    btnClose: "Band Karein",
    badgePlates: "Plates",
    badgeFunctions: "Function",

    sectionWhatChangedTitle: "Real Life Mein Kya Badla?",
    sectionWhatChangedSubtitle:
      "Ghar ke function mein badlaav aana aam baat hai. Seedhi bhasha mein bataiye agar mehmaan badhe, date aage hui ya shop ka real rate mila.",
    sectionBudgetTitle: "Budget Batwara & Style Badalna",
    sectionBudgetSubtitle:
      "Saaf hisaab jisme 'Khana Mat Kaato' lock aur dukan ke asli price ka auto rebalance hai.",
    sectionCashTitle: "Abhi Kitna Cash Chahiye vs Cash In Hand",
    sectionCashSubtitle:
      "Pata karein advance booking ke liye abhi kitna cash chahiye aur function wale hafte mein kitna.",
    sectionChecklistTitle: "Ulti Ginti Schedule & Zaroori Checklists",
    sectionChecklistSubtitle:
      "Event date se ulte din ginkar tayyar kiya gaya plan taaki aakhiri din koi hadbadi na ho.",

    labelDoNotCut: "Khana / Item Lock Rakhein 🔒",
    labelRealShopPrice: "Dukan Ka Asli Price",
    labelCashInHand: "Hath Mein Cash",
    labelPromisedMoney: "Wada Kiya Cash (Chanda)",
    labelSpentSoFar: "Kharch Ho Gaya",
    labelShortfall: "Abhi Kam Padne Wala Cash",
    labelStyleFull: "Full Agency Booking",
    labelStyleSmart: "Smart Mix (Aadha Khud + Aadha Vendor)",
    labelStyleDiy: "Ghar / Local Halwai Style",
    btnSendWhatsApp: "WhatsApp Par Bhejo",
    btnExportJson: "Plan Download Karein (JSON)",

    // Celebration cards, simpler sections and footer
    cards: {
      wedding: { title: "Shadi", tag: "Bada din" },
      haldi: { title: "Haldi", tag: "Subah ki rasm" },
      mehendi: { title: "Mehendi", tag: "Mehendi ki sham" },
      sangeet: { title: "Sangeet", tag: "Naach-gaane ki raat" },
      birthday: { title: "Birthday", tag: "Ghar par" },
      babyshower: { title: "Godh bharai", tag: "Parivar ka aashirwad" },
      anniversary: { title: "Anniversary", tag: "Saath ke saal" },
      housewarming: { title: "Griha Pravesh", tag: "Naya ghar" },
      ganesh: { title: "Ganesh Puja", tag: "Colony ka tyohaar" },
      navratri: { title: "Navratri", tag: "Garba ki raatein" },
      diwali: { title: "Diwali", tag: "Roshni ka tyohaar" },
      lohri: { title: "Lohri", tag: "Alaav ki sham" },
    },
    cardsHeadline: "HAR KHUSHI KA BAHANA",
    cardsSub: "Shadi, birthday, puja ya tyohaar. Ek card chunein aur plan shuru karein.",
    cardsHint: "Neeche scroll karein",
    cardsCta: "Plan shuru karein",
    cardGuests: "mehmaan",
    cardSample: "Namuna plan",
    cardPickAria: "{title} ka plan shuru karein",
    cardsListAria: "Celebration cards",
    stepLabel: "Step {n} / 4",
    s1Title: "Kya badla?",
    s1Line: "Seedhi bhasha mein batayein. Plan apne aap badal jayega.",
    s1Label: "Likhein kya badla",
    s1Placeholder: "jaise, 50 mehmaan aur aa rahe hain",
    s1Apply: "Plan badlein",
    s1Quick: "Ya ek chunein",
    platesTitle: "Order karne ke plates",
    platesLine: "{invited} bulaye + {extra} extra mehmaan + {helpers} helper plates",
    functionsToggle: "Har function dekhein ({n})",
    catererToggle: "Halwai ke plates ka hisaab check karein",
    catererLine: "Halwai ne zyada plates maange? Unka number likhein, dekhein theek hai ya nahi.",
    s1Next: "Aage: aapka budget",
    s2Title: "Paisa kahan jaata hai?",
    s2Line: "Zaroori cheez lock karein. Dukan ka asli price likhein, baaki apne aap adjust hoga.",
    s2Total: "Kul budget",
    s2TipsToggle: "Bachat ke tareeke ({n})",
    s2CompareToggle: "Do guest list ki tulna karein",
    s2ExtrasToggle: "Aise kharche jo aksar bhool jaate hain ({n})",
    s2Next: "Aage: aapka cash",
    s3Title: "Cash hai kya?",
    s3Line: "Dekhein abhi kitna dena hai aur hath mein kitna hai.",
    s3VendorsToggle: "Advance dene se pehle ke sawaal",
    s3MoneyToggle: "Parivar aur colony ka hisaab-kitaab",
    s3MsgToggle: "Bhejne ke liye tayyar WhatsApp message",
    s3Next: "Aage: aapki timeline",
    s4Title: "Aapki timeline",
    s4Line: "Kya kab karna hai, aapki date se ulti ginti mein.",
    s4IdeasToggle: "Apne celebration ke liye idea paayein",
    s4Print: "Plan print karein",
    s4Done: "Aapka plan tayyar hai.",
    tabChecklist: "Checklist",
    tabSchedule: "Din ka schedule",
    langAria: "Bhasha badlein, abhi: {name}",
    langAnnounce: "Bhasha badal kar {name} ho gayi",
    menuOpen: "Menu kholein",
    menuClose: "Menu band karein",
    stepShort: ["Mehmaan", "Budget", "Cash", "Timeline"],
    stepsAria: "Planning ke steps",
    stepBack: "Peeche",
    seeAll: "Sab dekhein ({n})",
    showLess: "Kam dikhayein",
    segChange: "Kuch badla?",
    segCaterer: "Caterer check",
    segFunctions: "Functions",
    segItems: "Kharche",
    segSave: "Bachat",
    segCompare: "Tulna",
    segExtras: "Bhoole kharche",
    segVendors: "Vendors",
    segMoney: "Hisaab-kitaab",
    segMsgs: "WhatsApp",
    segIdeas: "Ideas",
    doneCount: "{done} / {total} ho gaye",
    nextUp: "Ab yeh karein",
    lockedCount: "{n} / {total} lock hain",
    allDone: "List ka sab kaam ho gaya.",
    heroRule1: "15% extra mehmaan",
    heroRule1Line: "Bina bulaye mehmaan, driver aur helper bhi gine jaate hain, khana kam nahi padta.",
    heroRule2: "Zaroori kharche lock karein",
    heroRule2Line: "Lock kiye kharche safe rehte hain. Baaki budget ke saath adjust ho jaate hain.",
    heroRule3: "Cash alag, vaada alag",
    heroRule3Line: "Haath ka paisa aur vaade ka paisa alag rehta hai, advance wala din tension-free.",
    heroBlueprints: "Popular plans",
    guideLabel: "Guide",
    footBlurb: "Shadi, birthday aur colony ke tyohaar ka plan, seedhi bhasha mein.",
    footPlan: "Plan",
    footYourPlan: "Aapka plan",
    footLanguage: "Bhasha",
    footSave: "Is browser mein save karein",
    footExport: "File ki tarah download karein",
    footImport: "Save ki hui file kholein",
    footPrint: "Summary print karein",
    footNote: "Dikhaye gaye price andaaze hain. Paisa dene se pehle dukan ka asli price poochhein.",
    footCopy: "© 2026 Utsav Planner",
    footBackToTop: "Upar jaayein",
  },

  hi: {
    brandName: "उत्सव प्लानर",
    brandTagline: "सरल भाषा में भारतीय उत्सव और आयोजन योजनाकार",
    navCards: "उत्सव कार्ड",
    navWhatChanged: "क्या बदला",
    navBudget: "बजट",
    navCashVendors: "नकद",
    navChecklist: "शेड्यूल",
    navPlanNow: "शुरू करें",
    statusAiOnline: "एआई सक्रिय",
    statusOfflineSafe: "ऑफलाइन तैयार",

    heroEyebrow: "हर छोटी-बड़ी खुशी का सच्चा साथी",
    heroHeadlineMain: "हर खुशी का",
    heroHeadlineHighlight: "अपना प्लान",
    heroSubtitle:
      "शादी, जन्मदिन या कॉलोनी उत्सव की योजना बनाएं बिल्कुल अपनी सरल भाषा में। मेहमान बढ़ें, तारीख बदले या दुकान का असली भाव मिले—प्लान तुरंत संतुलित हो जाता है बिना किसी कठिन तकनीकी शब्दों के।",
    promptPlaceholder:
      "जैसे: बहन की शादी जयपुर में, 200 मेहमान, ₹8 लाख बजट, हलवाई और खान-पान का बजट सुरक्षित रखें...",
    btnBuildPlan: "मेरा प्लान बनाएं",
    btnBuilding: "योजना तैयार की जा रही है...",
    quickTryLabel: "या सीधे किसी भी कार्ड पर क्लिक करके तुरंत जांचें:",

    fanDeckTitle: "तैयार भारतीय उत्सव प्रारूप",
    fanDeckSubtitle: "कार्ड देखने के लिए कर्सर ले जाएं, पूरा विवरण देखने के लिए क्लिक करें",
    cardPreviewTitle: "उत्सव प्रारूप पूर्वावलोकन",
    btnUseThisPlan: "यह योजना चुनें और बदलें 👇",
    btnClose: "बंद करें",
    badgePlates: "प्लेटें",
    badgeFunctions: "कार्यक्रम",

    sectionWhatChangedTitle: "असल जिंदगी में क्या बदलाव हुआ?",
    sectionWhatChangedSubtitle:
      "उत्सव की तैयारी में बदलाव स्वाभाविक है। सरल शब्दों में बताएं यदि मेहमान बढ़े हैं, तारीख बदली है या दुकान का पक्का रेट मिला है।",
    sectionBudgetTitle: "बजट आवंटन एवं बचत विकल्प",
    sectionBudgetSubtitle:
      "पारदर्शी बजट जिसमें 'पक्का रखें 🔒' सुरक्षा और बाजार भाव के अनुसार स्वतः समायोजन शामिल है।",
    sectionCashTitle: "अभी आवश्यक नकद बनाम हाथ में उपलब्ध राशि",
    sectionCashSubtitle:
      "जानिए बयाना (एडवांस) देने के लिए तुरंत कितने नकद चाहिए और कार्यक्रम के सप्ताह में कितने।",
    sectionChecklistTitle: "उल्टी गिनती समय-सारणी एवं जरूरी कार्य",
    sectionChecklistSubtitle:
      "कार्यक्रम की तारीख से पहले के जरूरी पड़ाव ताकि अंत समय में कोई हड़बड़ी न हो।",

    labelDoNotCut: "पक्का रखें (काटें नहीं 🔒)",
    labelRealShopPrice: "दुकान का असली भाव",
    labelCashInHand: "हाथ में उपलब्ध नकद",
    labelPromisedMoney: "सहयोग राशि (चंदा)",
    labelSpentSoFar: "अब तक का खर्च",
    labelShortfall: "तुरंत आवश्यक कमी",
    labelStyleFull: "पूर्ण एजेंसी बुकिंग",
    labelStyleSmart: "स्मार्ट मिक्स (आधा स्वयं + आधा वेंडर)",
    labelStyleDiy: "घर व स्थानीय हलवाई शैली",
    btnSendWhatsApp: "व्हाट्सएप पर साझा करें",
    btnExportJson: "योजना डाउनलोड करें (JSON)",

    // Celebration cards, simpler sections and footer
    cards: {
      wedding: { title: "शादी", tag: "बड़ा दिन" },
      haldi: { title: "हल्दी", tag: "सुबह की रस्म" },
      mehendi: { title: "मेहंदी", tag: "मेहंदी की शाम" },
      sangeet: { title: "संगीत", tag: "नाच-गाने की रात" },
      birthday: { title: "जन्मदिन", tag: "घर पर" },
      babyshower: { title: "गोद भराई", tag: "परिवार का आशीर्वाद" },
      anniversary: { title: "सालगिरह", tag: "साथ के साल" },
      housewarming: { title: "गृह प्रवेश", tag: "नया घर" },
      ganesh: { title: "गणेश पूजा", tag: "कॉलोनी का त्योहार" },
      navratri: { title: "नवरात्रि", tag: "गरबा की रातें" },
      diwali: { title: "दिवाली", tag: "रोशनी का त्योहार" },
      lohri: { title: "लोहड़ी", tag: "अलाव की शाम" },
    },
    cardsHeadline: "हर खुशी का बहाना",
    cardsSub: "शादी, जन्मदिन, पूजा या त्योहार। एक कार्ड चुनें और प्लान शुरू करें।",
    cardsHint: "नीचे स्क्रॉल करें",
    cardsCta: "प्लान शुरू करें",
    cardGuests: "मेहमान",
    cardSample: "नमूना प्लान",
    cardPickAria: "{title} का प्लान शुरू करें",
    cardsListAria: "उत्सव कार्ड",
    stepLabel: "चरण {n} / 4",
    s1Title: "क्या बदला?",
    s1Line: "सरल शब्दों में बताएं। प्लान अपने आप बदल जाएगा।",
    s1Label: "लिखें क्या बदला",
    s1Placeholder: "जैसे: 50 मेहमान और आ रहे हैं",
    s1Apply: "प्लान बदलें",
    s1Quick: "या एक चुनें",
    platesTitle: "ऑर्डर करने की प्लेटें",
    platesLine: "{invited} आमंत्रित + {extra} अतिरिक्त मेहमान + {helpers} सहायकों की प्लेटें",
    functionsToggle: "हर कार्यक्रम देखें ({n})",
    catererToggle: "हलवाई की प्लेटों की गिनती जांचें",
    catererLine: "हलवाई ने ज्यादा प्लेटें मांगी? उनकी संख्या लिखें और देखें कि ठीक है या नहीं।",
    s1Next: "आगे: आपका बजट",
    s2Title: "पैसा कहां जाता है?",
    s2Line: "जरूरी चीज़ पक्की करें। दुकान का असली भाव लिखें, बाकी अपने आप बदल जाएगा।",
    s2Total: "कुल बजट",
    s2TipsToggle: "बचत के तरीके ({n})",
    s2CompareToggle: "दो मेहमान सूची की तुलना करें",
    s2ExtrasToggle: "ऐसे खर्चे जो अक्सर भूल जाते हैं ({n})",
    s2Next: "आगे: आपका नकद",
    s3Title: "क्या नकद तैयार है?",
    s3Line: "देखें अभी कितना देना है और हाथ में कितना है।",
    s3VendorsToggle: "बयाना देने से पहले पूछने के सवाल",
    s3MoneyToggle: "परिवार और कॉलोनी का हिसाब-किताब",
    s3MsgToggle: "भेजने के लिए तैयार व्हाट्सएप संदेश",
    s3Next: "आगे: आपकी समय-सारणी",
    s4Title: "आपकी समय-सारणी",
    s4Line: "क्या कब करना है, आपकी तारीख से उल्टी गिनती में।",
    s4IdeasToggle: "अपने उत्सव के लिए सुझाव पाएं",
    s4Print: "प्लान प्रिंट करें",
    s4Done: "आपका प्लान तैयार है।",
    tabChecklist: "चेकलिस्ट",
    tabSchedule: "दिन का शेड्यूल",
    langAria: "भाषा बदलें, अभी: {name}",
    langAnnounce: "भाषा बदलकर {name} हो गई",
    menuOpen: "मेन्यू खोलें",
    menuClose: "मेन्यू बंद करें",
    stepShort: ["मेहमान", "बजट", "नकद", "समय"],
    stepsAria: "प्लान के चरण",
    stepBack: "पीछे",
    seeAll: "सब देखें ({n})",
    showLess: "कम दिखाएं",
    segChange: "कुछ बदला?",
    segCaterer: "कैटरर जांच",
    segFunctions: "कार्यक्रम",
    segItems: "खर्चे",
    segSave: "बचत",
    segCompare: "तुलना",
    segExtras: "भूले खर्चे",
    segVendors: "वेंडर",
    segMoney: "हिसाब-किताब",
    segMsgs: "WhatsApp",
    segIdeas: "आइडिया",
    doneCount: "{done} / {total} पूरे",
    nextUp: "अब यह करें",
    lockedCount: "{n} / {total} लॉक हैं",
    allDone: "सूची का सारा काम हो गया।",
    heroRule1: "15% अतिरिक्त मेहमान",
    heroRule1Line: "बिन बुलाए मेहमान, ड्राइवर और सहायक भी गिने जाते हैं, खाना कम नहीं पड़ता।",
    heroRule2: "ज़रूरी खर्चे लॉक करें",
    heroRule2Line: "लॉक किए खर्चे सुरक्षित रहते हैं। बाकी बजट के साथ बदल जाते हैं।",
    heroRule3: "नकद अलग, वादा अलग",
    heroRule3Line: "हाथ का पैसा और वादे का पैसा अलग रहता है, एडवांस का दिन आराम से कटता है।",
    heroBlueprints: "लोकप्रिय प्लान",
    guideLabel: "गाइड",
    footBlurb: "शादी, जन्मदिन और कॉलोनी के उत्सवों का प्लान, सरल भाषा में।",
    footPlan: "प्लान",
    footYourPlan: "आपका प्लान",
    footLanguage: "भाषा",
    footSave: "इस ब्राउज़र में सहेजें",
    footExport: "फाइल की तरह डाउनलोड करें",
    footImport: "सहेजी हुई फाइल खोलें",
    footPrint: "सारांश प्रिंट करें",
    footNote: "दिखाए गए भाव अनुमानित हैं। पैसे देने से पहले दुकान का असली भाव पूछें।",
    footCopy: "© 2026 उत्सव प्लानर",
    footBackToTop: "ऊपर जाएं",
  },
};
