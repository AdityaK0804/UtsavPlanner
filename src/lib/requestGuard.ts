import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "./rateLimit";

/**
 * Shared helpers for the /api routes: body-size-capped JSON reading,
 * rate limiting with a proper Retry-After header, and plain-language 400 answers.
 */

export const MAX_PLAN_REQUEST_BYTES = 16 * 1024; // /api/plan only carries a short brief
export const MAX_PLAN_OBJECT_REQUEST_BYTES = 256 * 1024; // /api/change, /ideas, /messages carry a whole plan

export type JsonBodyResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: NextResponse };

function fail(error: string, status: number): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

/**
 * Reads a JSON object from the request, stopping as soon as the body goes past `maxBytes`
 * (so a huge upload is never fully held in memory).
 */
export async function readJsonBody(req: Request, maxBytes: number): Promise<JsonBodyResult> {
  const tooBig = fail("That request is too large. Please send a smaller plan or message.", 413);

  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return tooBig;

  let text = "";
  if (req.body) {
    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return tooBig;
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    text = new TextDecoder().decode(merged);
  }

  if (!text.trim()) return fail("Please send your details as JSON.", 400);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail("Please send valid JSON.", 400);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return fail("Please send your details as a JSON object.", 400);
  }
  return { ok: true, body: parsed as Record<string, unknown> };
}

export interface RateLimitRule {
  bucket: string;
  limit: number;
  windowMs?: number;
  message?: string;
}

/** Generic limit for every API call, and a stricter one for calls that use the AI service. */
export const API_LIMIT: RateLimitRule = { bucket: "api", limit: 60 };
export const AI_LIMIT: RateLimitRule = { bucket: "ai", limit: 10 };

/** Returns a 429 response (with Retry-After) when the caller is over the limit, otherwise null. */
export function enforceRateLimit(req: Request, rule: RateLimitRule): NextResponse | null {
  const ip = getClientIp(req.headers);
  const result = checkRateLimit(ip, rule.limit, rule.windowMs ?? 60_000, rule.bucket);
  if (result.allowed) return null;
  return NextResponse.json(
    { error: rule.message ?? "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

/** Turns Zod problems into a short, readable 400 answer. */
export function validationError(
  error: { issues: { path: (string | number)[]; message: string }[] },
  headline: string
): NextResponse {
  const details = error.issues.slice(0, 5).map((i) => ({
    field: i.path.join(".") || "(body)",
    problem: i.message,
  }));
  return NextResponse.json({ error: headline, details }, { status: 400 });
}