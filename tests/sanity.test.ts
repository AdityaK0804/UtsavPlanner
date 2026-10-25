import { describe, it, expect } from "vitest";
import { ParsedBriefSchema } from "@/ai/schemas";
import type { EventType } from "@/engine/types";

describe("Sanity & Setup Verification", () => {
  it("imports types correctly and validates schemas", () => {
    const validEventType: EventType = "wedding";
    const sampleBrief = {
      eventType: validEventType,
      title: "Rahul & Priya Shadi",
      city: "Jaipur",
      citySize: "medium_city" as const,
      eventDate: "2026-11-20",
      invitedGuests: 300,
      totalBudget: 1500000,
      foodType: ["pure_veg"],
      subEventNames: ["Haldi", "Sangeet", "Wedding"],
      mustHaveCategories: ["Catering / Halwai"],
      language: "en" as const,
    };

    const result = ParsedBriefSchema.safeParse(sampleBrief);
    expect(result.success).toBe(true);
  });
});
