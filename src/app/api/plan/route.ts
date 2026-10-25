import { NextRequest, NextResponse } from "next/server";
import {
  AI_LIMIT,
  API_LIMIT,
  MAX_PLAN_REQUEST_BYTES,
  enforceRateLimit,
  readJsonBody,
  validationError,
} from "@/lib/requestGuard";
import { sanitizeUserText } from "@/lib/sanitize";
import { ParsedBriefSchema } from "@/ai/schemas";
import { PlanRequestSchema } from "@/ai/planSchema";
import { buildBriefPrompt } from "@/ai/prompts";
import { fallbackParseBrief } from "@/ai/fallback";
import { generateStructuredAI } from "@/ai/gemini";
import { createPlanFromTemplate } from "@/templates";
import type { AppLanguage } from "@/engine/types";

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, {
      ...API_LIMIT,
      message: "Too many requests. Please wait a moment before creating another plan.",
    });
    if (limited) return limited;

    const read = await readJsonBody(req, MAX_PLAN_REQUEST_BYTES);
    if (!read.ok) return read.response;

    const parsedRequest = PlanRequestSchema.safeParse(read.body);
    if (!parsedRequest.success) {
      return validationError(
        parsedRequest.error,
        "Please check your request. The language must be en, hinglish or hi."
      );
    }

    const rawText = sanitizeUserText(parsedRequest.data.promptText ?? "");
    const language: AppLanguage = parsedRequest.data.language ?? "en";

    let briefData;
    let aiSource: "ai" | "offline_backup" = "offline_backup";
    let cached = false;

    if (parsedRequest.data.structuredInput) {
      const parsed = ParsedBriefSchema.safeParse(parsedRequest.data.structuredInput);
      if (parsed.success) {
        briefData = parsed.data;
      }
    }

    if (!briefData) {
      if (!rawText) {
        return NextResponse.json(
          { error: "Please provide either promptText or structuredInput." },
          { status: 400 }
        );
      }

      // Only calls that can reach the AI service count against the stricter limit.
      const aiLimited = enforceRateLimit(req, {
        ...AI_LIMIT,
        message: "Too many plans in a short time. Please wait a minute and try again.",
      });
      if (aiLimited) return aiLimited;

      const { systemInstruction, userPrompt } = buildBriefPrompt(rawText, language);
      const aiResult = await generateStructuredAI({
        systemInstruction,
        userPrompt,
        schema: ParsedBriefSchema,
        fallback: () => fallbackParseBrief(rawText, language),
      });

      briefData = aiResult.data;
      aiSource = aiResult.source;
      cached = aiResult.cached ?? false;
    }

    const plan = createPlanFromTemplate(briefData);
    plan.aiSource = aiSource;

    return NextResponse.json({
      plan,
      source: aiSource,
      cached,
    });
  } catch (err) {
    console.error("[API /api/plan Error]:", err);
    return NextResponse.json(
      { error: "Failed to create plan. Please try again." },
      { status: 500 }
    );
  }
}