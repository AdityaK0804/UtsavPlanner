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
import { ChangeActionListSchema } from "@/ai/schemas";
import { ChangeRequestSchema } from "@/ai/planSchema";
import { buildChangeActionsPrompt } from "@/ai/prompts";
import { fallbackParseChanges } from "@/ai/fallback";
import { generateStructuredAI } from "@/ai/gemini";
import { previewLifeChanges } from "@/engine/changes";
import type { ChangeAction } from "@/engine/types";

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, {
      ...API_LIMIT,
      message: "Too many updates. Please wait a moment.",
    });
    if (limited) return limited;

    const read = await readJsonBody(req, MAX_PLAN_OBJECT_REQUEST_BYTES);
    if (!read.ok) return read.response;

    // The plan comes from the browser, so it is fully checked before the engine touches it.
    const parsedRequest = ChangeRequestSchema.safeParse(read.body);
    if (!parsedRequest.success) {
      return validationError(parsedRequest.error, "A valid plan and change request are required.");
    }

    const { plan, directActions, changeText } = parsedRequest.data;
    const todayIso = parsedRequest.data.todayIso || new Date().toISOString().slice(0, 10);

    let actions: ChangeAction[] = [];
    let aiSource: "ai" | "offline_backup" = "offline_backup";
    let cached = false;

    if (directActions && directActions.length > 0) {
      actions = directActions;
    } else if (changeText) {
      const sanitized = sanitizeUserText(changeText);

      if (sanitized) {
        const aiLimited = enforceRateLimit(req, {
          ...AI_LIMIT,
          message: "Too many updates in a short time. Please wait a minute and try again.",
        });
        if (aiLimited) return aiLimited;

        const { systemInstruction, userPrompt } = buildChangeActionsPrompt(
          sanitized,
          plan,
          plan.language
        );

        const aiResult = await generateStructuredAI({
          systemInstruction,
          userPrompt,
          schema: ChangeActionListSchema,
          fallback: () => fallbackParseChanges(sanitized, plan),
        });

        actions = aiResult.data.actions;
        aiSource = aiResult.source;
        cached = aiResult.cached ?? false;
      }
    }

    const { updatedPlan, preview } = previewLifeChanges(plan, actions, todayIso);

    return NextResponse.json({
      actions,
      updatedPlan,
      preview,
      source: aiSource,
      cached,
    });
  } catch (err) {
    console.error("[API /api/change Error]:", err);
    return NextResponse.json(
      { error: "Failed to process change. Please try again." },
      { status: 500 }
    );
  }
}