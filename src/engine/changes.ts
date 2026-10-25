import type {
  BudgetItem,
  ChangeAction,
  ChangePreviewDiff,
  EventPlan,
} from "./types";
import { calculateGuestPlates } from "./guests";
import { rebalanceBudget } from "./budget";
import { checkCashInHand } from "./cash";
import { getDaysRemaining, subtractDays } from "./timeline";

/**
 * Applies life changes to an event plan deterministically and creates Before/After preview.
 * Pure function: Never mutates the original plan.
 */
export function previewLifeChanges(
  plan: EventPlan,
  actions: ChangeAction[],
  todayIso: string
): { updatedPlan: EventPlan; preview: ChangePreviewDiff } {
  // Deep-clone plan
  const updatedPlan: EventPlan = JSON.parse(JSON.stringify(plan));
  updatedPlan.version = (plan.version || 1) + 1;
  updatedPlan.updatedAt = todayIso;

  const oldItemsMap = new Map<string, BudgetItem>(
    plan.budgetItems.map((it) => [it.id, JSON.parse(JSON.stringify(it))])
  );

  const preview: ChangePreviewDiff = {
    budgetChanges: [],
    totalSummary: {
      oldTotal: plan.budgetItems.reduce((s, it) => s + it.plannedAmount, 0),
      newTotal: 0,
      totalBudgetLimit: updatedPlan.totalBudget,
      overBudgetBy: 0,
    },
    taskWarnings: [],
    vendorWarnings: [],
    plainSummaryMessages: [],
  };

  const oldRepresentativePlates = Math.max(
    ...plan.subEvents.map((se) => se.guests.totalPlatesToOrder),
    1
  );

  for (const act of actions) {
    if (!act || typeof act !== "object" || !act.action) {
      preview.plainSummaryMessages.push("Skipped unrecognized change action.");
      continue;
    }

    switch (act.action) {
      // 1. Change or Add Guests
      case "change_guests":
      case "add_guests": {
        const isAdd = act.action === "add_guests";
        const targetSubEvents = act.subEventId
          ? updatedPlan.subEvents.filter((se) => se.id === act.subEventId)
          : updatedPlan.subEvents;

        if (targetSubEvents.length === 0) {
          preview.plainSummaryMessages.push(
            `Could not find program with ID "${act.subEventId}".`
          );
          break;
        }

        let updatedAny = false;
        for (const se of targetSubEvents) {
          const currentInvited = se.guests.invited;
          const newInvited = isAdd
            ? currentInvited + act.extraInvited
            : act.newInvitedCount;

          if (isNaN(newInvited) || newInvited < 1) {
            preview.plainSummaryMessages.push(
              `Invalid guest count for "${se.name}". Guest count must be at least 1.`
            );
            continue;
          }

          se.guests = calculateGuestPlates(
            newInvited,
            se.guests.extraBufferPct,
            se.guests.helperPlates
          );
          updatedAny = true;

          preview.plainSummaryMessages.push(
            `Updated guest list for "${se.name}": ${newInvited} invited (${se.guests.totalPlatesToOrder} total plates with 15% buffer & helpers).`
          );

          // Check venue / tent capacity slab breach
          for (const item of updatedPlan.budgetItems) {
            if (
              item.howItScales === "size_limit_slab" &&
              item.maxCapacityLimit &&
              se.guests.expectedTotal > item.maxCapacityLimit
            ) {
              preview.vendorWarnings.push({
                helperType: item.category,
                plainMessage: `Guest count (${se.guests.expectedTotal}) is now bigger than your ${item.category} capacity limit (${item.maxCapacityLimit})! You may need a bigger hall or additional tent extension.`,
              });
            }
          }
        }

        if (updatedAny) {
          const newRepresentativePlates = Math.max(
            ...updatedPlan.subEvents.map((se) => se.guests.totalPlatesToOrder),
            1
          );

          // Scale per_plate budget items proportionally
          const scaleRatio = newRepresentativePlates / oldRepresentativePlates;
          for (const item of updatedPlan.budgetItems) {
            if (item.howItScales === "per_plate") {
              item.plannedAmount = Math.round(item.plannedAmount * scaleRatio);
            }
          }

          // Rebalance unlocked items to respect total budget
          const rebal = rebalanceBudget(
            updatedPlan.budgetItems,
            {},
            updatedPlan.totalBudget,
            updatedPlan.emergencyBufferPct
          );
          updatedPlan.budgetItems = rebal.items;
          if (rebal.warning) {
            preview.plainSummaryMessages.push(rebal.warning);
          }

          // Flag Caterer & Tent vendors
          preview.vendorWarnings.push({
            helperType: "Catering / Halwai",
            plainMessage: `Total plate count changed to ${newRepresentativePlates}. Please re-confirm final plate rate and minimum guarantee with the caterer.`,
          });
          preview.vendorWarnings.push({
            helperType: "Tent & Seating",
            plainMessage: `Please ask the tent vendor for additional seating and dinner tables to accommodate ${newRepresentativePlates} attendees.`,
          });
        }
        break;
      }

      // 2. Date Movements
      case "move_date_by_days":
      case "set_new_date": {
        let daysDelta = 0;
        if (act.action === "move_date_by_days") {
          daysDelta = isNaN(act.daysDelta) ? 0 : Math.round(act.daysDelta);
        } else {
          const oldPrimaryDate =
            updatedPlan.subEvents[0]?.dateTime?.slice(0, 10) || todayIso.slice(0, 10);
          daysDelta = getDaysRemaining(act.newDate, oldPrimaryDate);
        }

        if (daysDelta === 0) {
          preview.plainSummaryMessages.push("Event date is unchanged.");
          break;
        }

        // Shift sub-events
        for (const se of updatedPlan.subEvents) {
          const timePart = se.dateTime.includes("T")
            ? se.dateTime.slice(10)
            : se.dateTime.includes(" ")
            ? se.dateTime.slice(10)
            : "";
          const oldDatePart = se.dateTime.slice(0, 10);
          const newDatePart = subtractDays(oldDatePart, -daysDelta);
          se.dateTime = timePart ? `${newDatePart}${timePart}` : newDatePart;
        }

        const primaryDate =
          updatedPlan.subEvents[0]?.dateTime?.slice(0, 10) || todayIso.slice(0, 10);
        preview.plainSummaryMessages.push(
          `Event moved by ${daysDelta > 0 ? `+${daysDelta}` : daysDelta} days. New primary date is ${primaryDate}.`
        );

        // Recalculate checklist task dates
        const todayClean = todayIso.slice(0, 10);
        for (const task of updatedPlan.checklist) {
          task.dueDate = subtractDays(task.dueDate, -daysDelta);
          const daysRemaining = getDaysRemaining(task.dueDate, todayClean);
          task.isLate = task.dueDate < todayClean;
          task.isTightSchedule = daysRemaining < task.daysNeededBefore;

          if (task.isLate) {
            task.priority = "high";
            preview.taskWarnings.push({
              id: task.id,
              title: task.title,
              status: "late",
            });
          } else if (task.isTightSchedule) {
            task.priority = "high";
            preview.taskWarnings.push({
              id: task.id,
              title: task.title,
              status: "tight_schedule",
            });
          } else {
            preview.taskWarnings.push({
              id: task.id,
              title: task.title,
              status: "date_moved",
            });
          }
        }

        // Flag booked vendors to verify date
        const bookedVendors = updatedPlan.vendors.filter(
          (v) => v.bookingStatus === "booked" || v.bookingStatus === "got_price"
        );
        if (bookedVendors.length > 0) {
          const names = bookedVendors.map((v) => v.helperType).join(", ");
          preview.vendorWarnings.push({
            helperType: "Booked Vendors",
            plainMessage: `Event date changed to ${primaryDate}. Call your booked vendors (${names}) immediately to re-confirm availability.`,
          });
        }

        // Check cash timeline
        const daysLeft = getDaysRemaining(primaryDate, todayIso);
        const cashCheck = checkCashInHand(
          updatedPlan.budgetItems,
          updatedPlan.moneyRecords,
          daysLeft
        );
        if (cashCheck.simpleWarning) {
          preview.cashWarning = cashCheck.simpleWarning;
        }
        break;
      }

      // 3. Change Budget Total
      case "change_total_budget":
      case "cut_or_grow_budget_pct": {
        const newBudget =
          act.action === "change_total_budget"
            ? Math.max(0, Math.round(act.newTotalBudget))
            : Math.max(
                0,
                Math.round(updatedPlan.totalBudget * (1 + act.pctDelta / 100))
              );

        updatedPlan.totalBudget = newBudget;
        preview.totalSummary.totalBudgetLimit = newBudget;

        preview.plainSummaryMessages.push(
          `Total budget updated to ₹${newBudget.toLocaleString("en-IN")}.`
        );

        const rebal = rebalanceBudget(
          updatedPlan.budgetItems,
          { newTotalBudget: newBudget },
          newBudget,
          updatedPlan.emergencyBufferPct
        );
        updatedPlan.budgetItems = rebal.items;
        if (rebal.warning) {
          preview.plainSummaryMessages.push(rebal.warning);
        }
        break;
      }

      // 4. Enter Real Shop Price
      case "enter_real_shop_price": {
        const price = Math.max(0, Math.round(act.realPrice));
        preview.plainSummaryMessages.push(
          `Entered real shop price of ₹${price.toLocaleString("en-IN")} for "${act.category}".`
        );

        const rebal = rebalanceBudget(
          updatedPlan.budgetItems,
          { realPrices: [{ category: act.category, price }] },
          updatedPlan.totalBudget,
          updatedPlan.emergencyBufferPct
        );
        updatedPlan.budgetItems = rebal.items;
        if (rebal.warning) {
          preview.plainSummaryMessages.push(rebal.warning);
        }
        break;
      }

      // 5. Toggle Do Not Cut Lock
      case "set_do_not_cut": {
        const qCat = act.category.trim().toLowerCase();
        const item = updatedPlan.budgetItems.find((it) => {
          const itCat = it.category.trim().toLowerCase();
          return itCat === qCat || itCat.includes(qCat) || qCat.includes(itCat);
        });

        if (item) {
          item.doNotCut = act.doNotCut;
          preview.plainSummaryMessages.push(
            `${act.doNotCut ? "Locked 🔒" : "Unlocked 🔓"} category "${item.category}".`
          );

          const rebal = rebalanceBudget(
            updatedPlan.budgetItems,
            {},
            updatedPlan.totalBudget,
            updatedPlan.emergencyBufferPct
          );
          updatedPlan.budgetItems = rebal.items;
          if (rebal.warning) {
            preview.plainSummaryMessages.push(rebal.warning);
          }
        } else {
          preview.plainSummaryMessages.push(
            `Could not find category "${act.category}" to set lock status.`
          );
        }
        break;
      }

      // 6. Remove Sub-Event
      case "remove_sub_event": {
        if (updatedPlan.subEvents.length <= 1) {
          preview.plainSummaryMessages.push(
            "Cannot remove the only remaining event program."
          );
          break;
        }

        const idx = updatedPlan.subEvents.findIndex((se) => se.id === act.subEventId);
        if (idx !== -1) {
          const removed = updatedPlan.subEvents.splice(idx, 1)[0];
          preview.plainSummaryMessages.push(
            `Removed program "${removed.name}" from event plan.`
          );
        } else {
          preview.plainSummaryMessages.push(
            `Sub-event with ID "${act.subEventId}" not found.`
          );
        }
        break;
      }
    }
  }

  // Populate budgetChanges diff
  for (const item of updatedPlan.budgetItems) {
    const old = oldItemsMap.get(item.id);
    if (old) {
      const amountDiff = item.plannedAmount - old.plannedAmount;
      const styleChanged = item.currentStyle !== old.currentStyle;
      if (amountDiff !== 0 || styleChanged) {
        preview.budgetChanges.push({
          category: item.category,
          oldAmount: old.plannedAmount,
          newAmount: item.plannedAmount,
          difference: amountDiff,
          doNotCut: item.doNotCut,
          oldStyle: old.currentStyle,
          newStyle: item.currentStyle,
          savingTip: item.savingTip,
        });
      }
    }
  }

  // Populate total summary
  const newTotal = updatedPlan.budgetItems.reduce((s, it) => s + it.plannedAmount, 0);
  preview.totalSummary.newTotal = newTotal;
  preview.totalSummary.overBudgetBy = Math.max(0, newTotal - updatedPlan.totalBudget);

  return {
    updatedPlan,
    preview,
  };
}
