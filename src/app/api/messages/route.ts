import { NextRequest, NextResponse } from "next/server";
import {
  AI_LIMIT,
  API_LIMIT,
  MAX_PLAN_OBJECT_REQUEST_BYTES,
  enforceRateLimit,
  readJsonBody,
  validationError,
} from "@/lib/requestGuard";
import { WhatsAppMessagesSchema } from "@/ai/schemas";
import { MessagesRequestSchema } from "@/ai/planSchema";
import { buildMessagesPrompt } from "@/ai/prompts";
import { fallbackDraftMessages } from "@/ai/fallback";
import { generateStructuredAI } from "@/ai/gemini";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { AppLanguage } from "@/engine/types";

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, API_LIMIT);
    if (limited) return limited;

    const read = await readJsonBody(req, MAX_PLAN_OBJECT_REQUEST_BYTES);
    if (!read.ok) return read.response;

    const parsedRequest = MessagesRequestSchema.safeParse(read.body);
    if (!parsedRequest.success) {
      return validationError(
        parsedRequest.error,
        "A valid plan is required. The language must be en, hinglish or hi."
      );
    }

    const { plan } = parsedRequest.data;
    const previewDiff = parsedRequest.data.previewDiff ?? undefined;
    const language: AppLanguage = parsedRequest.data.language ?? plan.language ?? "en";

    const aiLimited = enforceRateLimit(req, AI_LIMIT);
    if (aiLimited) return aiLimited;

    const { systemInstruction, userPrompt } = buildMessagesPrompt(plan, previewDiff, language);

    const aiResult = await generateStructuredAI({
      systemInstruction,
      userPrompt,
      schema: WhatsAppMessagesSchema,
      fallback: () => fallbackDraftMessages(plan, previewDiff),
    });

    const whatsappLinks = aiResult.data.messages.map((m) => ({
      audience: m.audience,
      link: buildWhatsAppLink(m.messageText),
    }));

    return NextResponse.json({
      messages: aiResult.data.messages,
      whatsappLinks,
      source: aiResult.source,
      cached: aiResult.cached ?? false,
    });
  } catch (err) {
    console.error("[API /api/messages Error]:", err);
    return NextResponse.json(
      { error: "Failed to draft WhatsApp messages. Please try again." },
      { status: 500 }
    );
  }
}