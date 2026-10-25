import { z } from "zod";

/**
 * Zod Schemas for UtsavRipple AI inputs and outputs.
 * Strict validation, length caps, and sane number bounds to eliminate hallucination or injection risk.
 */

// 1. Parsed Initial Event Brief
export const ParsedBriefSchema = z
  .object({
    eventType: z.enum(["wedding", "birthday", "colony_festival"]),
    title: z.string().trim().min(1).max(120),
    city: z.string().trim().max(80).optional(),
    citySize: z.enum(["big_metro", "medium_city", "small_town"]).default("medium_city"),
    eventDate: z.string().trim().min(4).max(30).describe("ISO date string or YYYY-MM-DD"),
    invitedGuests: z.number().int().min(1).max(20000),
    totalBudget: z.number().positive().max(100_000_000),
    foodType: z.array(z.string().trim().max(50)).default([]),
    subEventNames: z.array(z.string().trim().max(80)).default([]),
    mustHaveCategories: z.array(z.string().trim().max(80)).default([]),
    language: z.enum(["en", "hinglish", "hi"]).default("en"),
  })
  .strict();

export type ParsedBrief = z.infer<typeof ParsedBriefSchema>;
export type ParsedBriefInput = z.input<typeof ParsedBriefSchema>;

// 2. Change Actions (Parsing "What Changed?" user statements)
export const ChangeActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("change_guests"),
      subEventId: z.string().trim().max(100).optional(),
      newInvitedCount: z.number().int().min(1).max(20000),
    })
    .strict(),
  z
    .object({
      action: z.literal("add_guests"),
      subEventId: z.string().trim().max(100).optional(),
      extraInvited: z.number().int().min(-20000).max(20000),
    })
    .strict(),
  z
    .object({
      action: z.literal("move_date_by_days"),
      daysDelta: z.number().int().min(-365).max(365),
    })
    .strict(),
  z
    .object({
      action: z.literal("set_new_date"),
      newDate: z.string().trim().min(4).max(30),
    })
    .strict(),
  z
    .object({
      action: z.literal("change_total_budget"),
      newTotalBudget: z.number().positive().max(100_000_000),
    })
    .strict(),
  z
    .object({
      action: z.literal("cut_or_grow_budget_pct"),
      pctDelta: z.number().min(-90).max(500),
    })
    .strict(),
  z
    .object({
      action: z.literal("enter_real_shop_price"),
      category: z.string().trim().min(1).max(80),
      realPrice: z.number().nonnegative().max(100_000_000),
    })
    .strict(),
  z
    .object({
      action: z.literal("set_do_not_cut"),
      category: z.string().trim().min(1).max(80),
      doNotCut: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("remove_sub_event"),
      subEventId: z.string().trim().min(1).max(100),
    })
    .strict(),
]);

export const ChangeActionListSchema = z
  .object({
    actions: z.array(ChangeActionSchema).max(20),
    plainExplanation: z.string().trim().max(500),
  })
  .strict();

export type ChangeActionParsed = z.infer<typeof ChangeActionSchema>;
export type ChangeActionList = z.infer<typeof ChangeActionListSchema>;

// 3. Cultural & Budget-Aware Ideas
export const IdeaItemSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    simpleDescription: z.string().trim().min(1).max(500),
    estimatedCostRange: z.string().trim().max(80),
    status: z.literal("ai_idea").default("ai_idea"),
  })
  .strict();

export const SimpleIdeasSchema = z
  .object({
    themes: z.array(IdeaItemSchema).max(10).default([]),
    foodMenuIdeas: z.array(IdeaItemSchema).max(10).default([]),
    decorationIdeas: z.array(IdeaItemSchema).max(10).default([]),
    savingTricks: z.array(IdeaItemSchema).max(10).default([]),
    rainOrPowerBackupIdeas: z.array(IdeaItemSchema).max(10).default([]),
  })
  .strict();

export type IdeaItem = z.infer<typeof IdeaItemSchema>;
export type SimpleIdeas = z.infer<typeof SimpleIdeasSchema>;

// 4. Ready-to-send WhatsApp Messages
export const WhatsAppSingleMessageSchema = z
  .object({
    audience: z.enum([
      "caterer_halwai",
      "decorator_tent",
      "family_group",
      "guests_invite",
      "colony_group",
    ]),
    title: z.string().trim().min(1).max(100),
    messageText: z.string().trim().min(1).max(1500),
  })
  .strict();

export const WhatsAppMessagesSchema = z
  .object({
    messages: z.array(WhatsAppSingleMessageSchema).max(10),
  })
  .strict();

export type WhatsAppSingleMessage = z.infer<typeof WhatsAppSingleMessageSchema>;
export type WhatsAppMessages = z.infer<typeof WhatsAppMessagesSchema>;
