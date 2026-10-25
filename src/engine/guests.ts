import type { GuestCount } from "./types";
import benchmarks from "../templates/benchmarks.json";

// Typical estimates (to be verified) live in templates/benchmarks.json, each with a source and date.
const DEFAULT_BUFFER_PCT = benchmarks.guestMetrics.extraGuestBufferPct.value;
const DEFAULT_HELPER_PLATES = benchmarks.guestMetrics.defaultHelperPlates.value;
const CONSUMPTION_MIN = benchmarks.guestMetrics.catererConsumptionRange.min;
const CONSUMPTION_MAX = benchmarks.guestMetrics.catererConsumptionRange.max;

/**
 * Calculates guest plates using Indian celebration dynamics:
 * - Invited guests
 * - 15% buffer for extended family / unconfirmed attendees
 * - Dedicated helper plates (drivers, cameramen, band, staff)
 */
export function calculateGuestPlates(
  invited: number,
  extraBufferPct = DEFAULT_BUFFER_PCT,
  helperPlates = DEFAULT_HELPER_PLATES
): GuestCount {
  // Safe clamping against NaN and negative values
  const safeInvited = isNaN(invited) || invited < 1 ? 1 : Math.round(invited);
  const safeBufferPct = isNaN(extraBufferPct) || extraBufferPct < 0 ? 0 : extraBufferPct;
  const safeHelperPlates = isNaN(helperPlates) || helperPlates < 0 ? 0 : Math.round(helperPlates);

  const expectedTotal = Math.ceil(safeInvited * (1 + safeBufferPct));
  const totalPlatesToOrder = expectedTotal + safeHelperPlates;

  return {
    invited: safeInvited,
    extraBufferPct: safeBufferPct,
    expectedTotal,
    helperPlates: safeHelperPlates,
    totalPlatesToOrder,
  };
}

export interface CatererPlateQuoteCheck {
  isHigh: boolean;
  recommendedMinPlates: number;
  recommendedMaxPlates: number;
  plainAdvice: string;
}

/**
 * Validates caterer's quoted plate count against realistic consumption patterns.
 * Caterers often pitch 10-20% extra plates above real headcount.
 */
export function checkCatererPlateQuote(
  quotedPlates: number,
  guests: GuestCount
): CatererPlateQuoteCheck {
  const safeQuoted = isNaN(quotedPlates) || quotedPlates < 0 ? 0 : Math.round(quotedPlates);
  const recommendedMinPlates = Math.round(guests.expectedTotal * CONSUMPTION_MIN);
  const recommendedMaxPlates = Math.round(guests.expectedTotal * CONSUMPTION_MAX);

  const isHigh = safeQuoted > guests.totalPlatesToOrder * 1.1;

  let plainAdvice: string;
  if (isHigh) {
    const extra = safeQuoted - guests.totalPlatesToOrder;
    plainAdvice =
      `The caterer is quoting ${safeQuoted} plates, which is ${extra} plates more than your recommended total of ${guests.totalPlatesToOrder}. ` +
      `In Indian celebrations, typically 85% to 95% of expected guests eat a full meal (${recommendedMinPlates} to ${recommendedMaxPlates} plates). ` +
      `Consider asking the caterer to reduce the guarantee to ${guests.totalPlatesToOrder} plates to avoid paying for uneaten food.`;
  } else {
    plainAdvice =
      `The caterer's quote of ${safeQuoted} plates is within your safe planning range of ${guests.totalPlatesToOrder} plates ` +
      `(including ${guests.helperPlates} helper plates).`;
  }

  return {
    isHigh,
    recommendedMinPlates,
    recommendedMaxPlates,
    plainAdvice,
  };
}
