import type { DayScheduleBlock } from "./types";

/**
 * Checks day-of-event schedule for common Indian celebration timing pitfalls:
 * 1. Missing buffer between events (< 15 mins)
 * 2. Rushed bridal/groom/family makeup (< 90 mins)
 * 3. Inadequate baraat / travel traffic cushion (< 30 mins)
 * 4. Outdoor weather exposure without backup plans
 */
export function checkDaySchedule(
  blocks: DayScheduleBlock[],
  fixedTimings?: { label: string; time: string }[]
): string[] {
  const warnings: string[] = [];

  for (const block of blocks) {
    // 1. Minimum buffer check
    if (block.bufferMinutesAfter < 15) {
      warnings.push(
        `Add at least 15 minutes gap after "${block.title}" so delays don't ruin the next program.`
      );
    }

    // 2. Getting ready check (makeup, turban, saree, family dressing)
    if (block.blockType === "getting_ready" && block.durationMinutes < 90) {
      warnings.push(
        `Getting ready block "${block.title}" is under 90 minutes. Indian bridal/groom prep and family dressing typically take at least 1.5 to 2 hours.`
      );
    }

    // 3. Procession / Baraat / Travel buffer check
    if (block.blockType === "procession_travel" && block.bufferMinutesAfter < 30) {
      warnings.push(
        `Procession/travel block "${block.title}" has under 30 minutes buffer. Baraats, dhol, and city traffic frequently experience 30-45 minute delays.`
      );
    }

    // 4. Outdoor rain/heat backup check
    if (block.isOutdoor && (!block.backupPlanNote || block.backupPlanNote.trim() === "")) {
      warnings.push(
        `Outdoor program "${block.title}" has no rain or heat backup plan written. Note down a covered hall or monsoon tent arrangement.`
      );
    }
  }

  // 5. Fixed timings (muhurat / puja / cake-cutting) alignment check
  if (fixedTimings && fixedTimings.length > 0) {
    for (const ft of fixedTimings) {
      const matchingBlock = blocks.find((b) =>
        b.title.toLowerCase().includes(ft.label.toLowerCase())
      );
      if (matchingBlock && matchingBlock.startTime > ft.time) {
        warnings.push(
          `Fixed auspicious timing for "${ft.label}" is set for ${ft.time}, but schedule block starts later at ${matchingBlock.startTime}.`
        );
      }
    }
  }

  return warnings;
}
