import { NextRequest, NextResponse } from "next/server";
import {
  AI_LIMIT,
  API_LIMIT,
  MAX_PLAN_OBJECT_REQUEST_BYTES,
  enforceRateLimit,
  readJsonBody,
  validationError,
} from "@/lib/requestGuard";
import { sanitizeUserText } from "@/lib/sanitize";
import { SimpleIdeasSchema } from "@/ai/schemas";
import { IdeasRequestSchema } from "@/ai/planSchema";
import { buildIdeasPrompt } from "@/ai/prompts";
import { fallbackGenerateIdeas } from "@/ai/fallback";
import { generateStructuredAI } from "@/ai/gemini";
import type { AppLanguage } from "@/engine/types";

/** Gemini can be slow or briefly overloaded: allow retries to finish (Vercel Hobby allows up to 60s). */
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, API_LIMIT);
    if (limited) return limited;

    const read = await readJsonBody(req, MAX_PLAN_OBJECT_REQUEST_BYTES);
    if (!read.ok) return read.response;

    const parsedRequest = IdeasRequestSchema.safeParse(read.body);
    if (!parsedRequest.success) {
      return validationError(
        parsedRequest.error,
        "A valid plan is required. The language must be en, hinglish or hi."
      );
    }

    const { plan } = parsedRequest.data;
    const followUp = sanitizeUserText(parsedRequest.data.followUp ?? "");
    const language: AppLanguage = parsedRequest.data.language ?? plan.language ?? "en";

    const aiLimited = enforceRateLimit(req, AI_LIMIT);
    if (aiLimited) return aiLimited;

    const { systemInstruction, userPrompt } = buildIdeasPrompt(plan, followUp, language);

    const aiResult = await generateStructuredAI({
      systemInstruction,
      userPrompt,
      schema: SimpleIdeasSchema,
      fallback: () => fallbackGenerateIdeas(plan, followUp),
    });

    return NextResponse.json({
      ideas: aiResult.data,
      source: aiResult.source,
      cached: aiResult.cached ?? false,
    });
  } catch (err) {
    console.error("[API /api/ideas Error]:", err);
    return NextResponse.json(
      { error: "Failed to generate ideas. Please try again." },
      { status: 500 }
    );
  }
}