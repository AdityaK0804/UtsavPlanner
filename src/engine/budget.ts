import type {
  BudgetItem,
  BudgetStyle,
  GuestCount,
  HowItScales,
  OptionComparison,
  PriceStatus,
} from "./types";
import { calculateGuestPlates } from "./guests";

export interface TemplateCategoryInput {
  id?: string;
  category: string;
  weightPct: number; // e.g. 40 for 40%
  howItScales: HowItScales;
  advanceNeededPct?: number;
  eventWeekNeededPct?: number;
  doNotCut?: boolean;
  styleOptions?: Record<BudgetStyle, string>;
  savingTip?: string;
  maxCapacityLimit?: number;
  note?: string;
}

export interface RebalanceResult {
  items: BudgetItem[];
  warning?: string;
  overBudgetBy: number;
}

/**
 * Builds the initial budget distribution for an event:
 * - Reserves emergency cash buffer (default 10%)
 * - Chooses realistic initial style (DIY vs Smart Mix vs Full Service) based on per-plate budget capacity
 * - Allocates money across categories based on standard benchmarks
 */
export function buildInitialBudget(
  templateCategories: TemplateCategoryInput[],
  totalBudget: number,
  guests: GuestCount,
  emergencyBufferPct = 10,
  citySize: "big_metro" | "medium_city" | "small_town" = "medium_city"
): BudgetItem[] {
  const safeBudget = Math.max(0, Math.round(totalBudget));
  const safeBufferPct = Math.max(0, Math.min(50, emergencyBufferPct));
  const emergencyAmount = Math.round(safeBudget * (safeBufferPct / 100));
  const distributableBudget = Math.max(0, safeBudget - emergencyAmount);

  // Per-plate spending capacity determines default style
  const spendPerPlate = safeBudget / (guests.totalPlatesToOrder || 1);
  let defaultStyle: BudgetStyle = "full_vendor_service";
  if (spendPerPlate < 450) {
    defaultStyle = "home_halwai_diy";
  } else if (spendPerPlate < 900) {
    defaultStyle = "smart_mix";
  }

  const totalWeights = templateCategories.reduce(
    (sum, cat) => sum + (cat.weightPct || 0),
    0
  );

  const defaultStyleOptions: Record<BudgetStyle, string> = {
    full_vendor_service: "Full professional agency/service package",
    smart_mix: "Semi-managed package with self-arranged items",
    home_halwai_diy: "Local halwai / self-managed community setup",
  };

  const items: BudgetItem[] = templateCategories.map((cat, idx) => {
    const share = totalWeights > 0 ? (cat.weightPct || 0) / totalWeights : 0;
    const plannedAmount = Math.round(distributableBudget * share);
    const styleOptions = cat.styleOptions || defaultStyleOptions;

    return {
      id: cat.id || `budget-item-${idx + 1}`,
      category: cat.category,
      howItScales: cat.howItScales || "fixed_price",
      plannedAmount,
      status: "typical_estimate" as PriceStatus,
      doNotCut: !!cat.doNotCut,
      currentStyle: defaultStyle,
      styleOptions,
      savingTip: cat.savingTip || styleOptions[defaultStyle],
      maxCapacityLimit: cat.maxCapacityLimit,
      advanceNeededPct: cat.advanceNeededPct ?? 30,
      eventWeekNeededPct: cat.eventWeekNeededPct ?? 50,
      note: cat.note,
    };
  });

  // Explicit Emergency Buffer line item
  if (emergencyAmount > 0) {
    items.push({
      id: "emergency-buffer-line",
      category: "Emergency Buffer (Extra Cash)",
      howItScales: "fixed_price",
      plannedAmount: emergencyAmount,
      status: "typical_estimate",
      doNotCut: true,
      currentStyle: "smart_mix",
      styleOptions: {
        full_vendor_service: "Cash buffer kept safely in bank account",
        smart_mix: "Cash buffer kept safely in bank account",
        home_halwai_diy: "Cash buffer kept safely in bank account",
      },
      savingTip: "Emergency cash kept strictly untouched until the event week",
      advanceNeededPct: 0,
      eventWeekNeededPct: 100,
      note: "Cash kept ready for unexpected last-minute needs or extra guests",
    });
  }

  return items;
}

/**
 * Rebalances budget when real shop prices are entered or total budget changes.
 * - Protects "Do Not Cut 🔒" items and entered real shop prices.
 * - Automatically steps down style and attaches physical saving tips when money drops.
 */
export function rebalanceBudget(
  items: BudgetItem[],
  updates: {
    realPrices?: { category: string; price: number }[];
    newTotalBudget?: number;
  },
  currentTotalBudget: number,
  emergencyBufferPct = 10
): RebalanceResult {
  // Deep-copy to ensure pure, side-effect-free math
  const newItems: BudgetItem[] = JSON.parse(JSON.stringify(items));
  const targetBudget =
    updates.newTotalBudget !== undefined
      ? Math.max(0, Math.round(updates.newTotalBudget))
      : Math.max(0, Math.round(currentTotalBudget));

  // 1. Apply real shop prices
  if (updates.realPrices && updates.realPrices.length > 0) {
    for (const quote of updates.realPrices) {
      const qCat = quote.category.trim().toLowerCase();
      const match = newItems.find((item) => {
        const itemCat = item.category.trim().toLowerCase();
        return itemCat === qCat || itemCat.includes(qCat) || qCat.includes(itemCat);
      });
      if (match) {
        match.plannedAmount = Math.max(0, Math.round(quote.price));
        match.status = "real_shop_price";
      }
    }
  }

  // Helper: check if item is protected
  const isProtected = (it: BudgetItem): boolean => {
    return it.doNotCut || it.status === "real_shop_price" || it.status === "paid";
  };

  // Check if Emergency Buffer is in items list
  const emergencyItem = newItems.find((it) =>
    it.category.toLowerCase().includes("emergency buffer")
  );

  let protectedSum = 0;
  for (const it of newItems) {
    if (isProtected(it)) {
      protectedSum += it.plannedAmount;
    }
  }

  // If emergency buffer is not represented as an item, add it to protected sum
  if (!emergencyItem && emergencyBufferPct > 0) {
    protectedSum += Math.round(targetBudget * (emergencyBufferPct / 100));
  }

  // 2. Over-budget check when protected items exceed target
  if (protectedSum > targetBudget) {
    const overBudgetBy = Math.round(protectedSum - targetBudget);
    // Unlocked items cannot get money; set to 0 and switch to DIY style
    for (const it of newItems) {
      if (!isProtected(it)) {
        it.plannedAmount = 0;
        it.currentStyle = "home_halwai_diy";
        if (it.styleOptions && it.styleOptions.home_halwai_diy) {
          it.savingTip = it.styleOptions.home_halwai_diy;
        }
      }
    }

    const warning =
      `Your Must-Have (locked) items and Real Shop Prices total ₹${protectedSum.toLocaleString("en-IN")}, ` +
      `which is ₹${overBudgetBy.toLocaleString("en-IN")} more than your total budget. ` +
      `Please increase your total budget or unlock one Must-Have item.`;

    return {
      items: newItems,
      warning,
      overBudgetBy,
    };
  }

  // 3. Normal distribution across unlocked items
  const remainingMoney = targetBudget - protectedSum;
  const unlockedItems = newItems.filter((it) => !isProtected(it));

  if (unlockedItems.length > 0) {
    const unlockedWeightSum = unlockedItems.reduce(
      (acc, it) => acc + (it.plannedAmount > 0 ? it.plannedAmount : 1),
      0
    );

    let allocatedSoFar = 0;
    unlockedItems.forEach((it, index) => {
      const isLast = index === unlockedItems.length - 1;
      const oldAmount = it.plannedAmount;
      const weight =
        (oldAmount > 0 ? oldAmount : 1) / (unlockedWeightSum || 1);

      let newAmount = isLast
        ? remainingMoney - allocatedSoFar
        : Math.round(remainingMoney * weight);
      newAmount = Math.max(0, newAmount);
      allocatedSoFar += newAmount;

      it.plannedAmount = newAmount;

      // Automatic Style Swap & Saving Tip Rule:
      // When plannedAmount drops by 15% or more, step down style
      if (oldAmount > 0 && newAmount <= oldAmount * 0.85) {
        if (it.currentStyle === "full_vendor_service") {
          it.currentStyle = "smart_mix";
        } else if (it.currentStyle === "smart_mix") {
          it.currentStyle = "home_halwai_diy";
        }

        if (it.styleOptions && it.styleOptions[it.currentStyle]) {
          it.savingTip = it.styleOptions[it.currentStyle];
        }
      }
    });
  }

  return {
    items: newItems,
    overBudgetBy: 0,
  };
}

/**
 * Compares "fewer guests with higher-end food" vs "more guests with simple menu".
 */
export function comparePlateOptions(
  totalBudget: number,
  foodBudgetShare: number,
  options: { label: string; invitedGuests: number; perPlateCost: number }[]
): OptionComparison[] {
  const safeBudget = Math.max(0, Math.round(totalBudget));
  const shareRatio = foodBudgetShare <= 1 ? foodBudgetShare : foodBudgetShare / 100;
  const foodBudgetCap = Math.round(safeBudget * shareRatio);

  return options.map((opt) => {
    const guests = calculateGuestPlates(opt.invitedGuests);
    const totalPlates = guests.totalPlatesToOrder;
    const perPlateCost = Math.max(0, Math.round(opt.perPlateCost));
    const totalFoodCost = totalPlates * perPlateCost;
    const remainingForOtherItems = safeBudget - totalFoodCost;
    const fitsBudget = totalFoodCost <= foodBudgetCap && remainingForOtherItems >= 0;

    let plainVerdict: string;
    if (fitsBudget) {
      plainVerdict =
        `Fits comfortably: ₹${totalFoodCost.toLocaleString("en-IN")} for ${totalPlates} plates ` +
        `(${guests.invited} invited + buffer & helpers). Leaves ₹${remainingForOtherItems.toLocaleString("en-IN")} ` +
        `for venue, decor, and other arrangements.`;
    } else {
      const overBy = Math.abs(Math.round(totalFoodCost - foodBudgetCap));
      plainVerdict =
        `Exceeds recommended food allocation by ₹${overBy.toLocaleString("en-IN")}. ` +
        `Leaves only ₹${remainingForOtherItems.toLocaleString("en-IN")} for all other event expenses. ` +
        `Consider trimming menu items or guest count.`;
    }

    return {
      label: opt.label,
      invitedGuests: guests.invited,
      totalPlates,
      perPlateCost,
      totalFoodCost,
      remainingForOtherItems,
      fitsBudget,
      plainVerdict,
    };
  });
}
