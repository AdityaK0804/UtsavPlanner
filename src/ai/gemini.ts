import { GoogleGenAI } from "@google/genai";
import crypto from "node:crypto";
import { z } from "zod";

/**
 * Strips markdown code fences from AI response string.
 */
export function stripCodeFences(raw: string): string {
  let trimmed = raw.trim();
  if (trimmed.startsWith("```json")) {
    trimmed = trimmed.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (trimmed.startsWith("```")) {
    trimmed = trimmed.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return trimmed.trim();
}

// In-memory input-hash LRU cache (capped at 100 entries)
const AI_CACHE_LIMIT = 100;
const aiCache = new Map<string, unknown>();

function getCacheKey(modelName: string, systemInstruction: string, userPrompt: string): string {
  return crypto
    .createHash("sha256")
    .update(`${modelName}:::${systemInstruction}:::${userPrompt}`)
    .digest("hex");
}

function getFromCache<T>(key: string): T | undefined {
  if (aiCache.has(key)) {
    const val = aiCache.get(key) as T;
    // Refresh LRU order
    aiCache.delete(key);
    aiCache.set(key, val);
    return val;
  }
  return undefined;
}

function setInCache<T>(key: string, value: T): void {
  if (aiCache.size >= AI_CACHE_LIMIT) {
    const firstKey = aiCache.keys().next().value;
    if (firstKey) aiCache.delete(firstKey);
  }
  aiCache.set(key, value);
}

/** Test helper: empties the answer cache. */
export function clearAICacheForTests(): void {
  aiCache.clear();
}

/** Raised when Gemini takes longer than the allowed time. Safe to retry. */
export class AITimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AI generation timed out after ${timeoutMs}ms`);
    this.name = "AITimeoutError";
  }
}

/**
 * Executes a promise with an AbortController timeout.
 * The controller's signal is also handed to the SDK, so the HTTP request is really cancelled.
 */
async function callWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  controller: AbortController
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new AITimeoutError(timeoutMs));
      controller.abort();
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const NETWORK_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
]);

/**
 * Decides whether another attempt could help.
 * Retry: timeout, bad/malformed JSON, schema mismatch, network trouble, HTTP 429 and 5xx.
 * Do NOT retry: other 4xx (wrong or missing key, bad request, no permission) - a second try cannot fix them.
 */
export function isRetryableError(err: unknown): boolean {
  if (err instanceof AITimeoutError) return true;
  if (err instanceof SyntaxError) return true; // malformed JSON
  if (err instanceof z.ZodError) return true; // JSON that does not match our schema

  if (typeof err === "object" && err !== null) {
    const status = (err as { status?: unknown }).status;
    if (typeof status === "number") {
      return status === 429 || status >= 500;
    }
    const code = (err as { code?: unknown }).code;
    if (typeof code === "string" && NETWORK_ERROR_CODES.has(code)) return true;
    const cause = (err as { cause?: unknown }).cause;
    if (cause && cause !== err) return isRetryableError(cause);
  }

  // fetch() network failures surface as TypeError("fetch failed")
  if (err instanceof TypeError) return true;
  // AbortError that did not come from our own timeout (for example a dropped connection)
  if (err instanceof Error && err.name === "AbortError") return true;

  return false;
}

/** Short, secret-free description of an error for logs. Never includes the API key. */
function describeError(err: unknown, apiKey: string): string {
  const status =
    typeof err === "object" && err !== null && typeof (err as { status?: unknown }).status === "number"
      ? ` (HTTP ${(err as { status: number }).status})`
      : "";
  const name = err instanceof Error ? err.name : "Error";
  let message = err instanceof Error ? err.message : String(err);
  if (apiKey) message = message.split(apiKey).join("[redacted]");
  message = message.replace(/([?&]key=)[^&\s"']+/gi, "$1[redacted]").slice(0, 200);
  return `${name}${status}: ${message}`;
}

/** Default time allowed for ONE Gemini call. */
export const DEFAULT_AI_TIMEOUT_MS = 20000;
/** Calls per request: the first try plus up to 2 retries. */
export const MAX_AI_ATTEMPTS = 3;
/**
 * All attempts together must finish before the Vercel function is stopped (routes set maxDuration = 30).
 * Keep a few seconds spare for the offline fallback and the response.
 */
export const DEFAULT_AI_TOTAL_BUDGET_MS = 26000;

/** An attempt needs at least this long to be worth starting. */
const MIN_ATTEMPT_MS = 3000;

export interface AIOptions<T> {
  systemInstruction: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  fallback: () => T;
  timeoutMs?: number; // default 20000, per attempt
  retryDelayMs?: number; // default 400; the wait before attempt 3 is double
  maxAttempts?: number; // default 3
  totalBudgetMs?: number; // default 26000, across all attempts
}

export interface AIResult<T> {
  data: T;
  source: "ai" | "offline_backup";
  /** True when this answer came from the in-memory cache and not a fresh Gemini call. */
  cached?: boolean;
}

/**
 * Universal Gemini Wrapper for UtsavRipple:
 * - Server-only execution
 * - In-memory SHA-256 LRU cache (cached answers are flagged `cached: true`)
 * - 20-second AbortController timeout per attempt, wired to the real request
 * - Code-fence stripping
 * - Strict Zod schema validation
 * - Up to 3 attempts with a short growing wait, only for timeouts, malformed JSON, network errors,
 *   HTTP 429 and 5xx (Gemini "high demand" 503s are usually gone a second later)
 * - A total time budget so every attempt still finishes inside the serverless function limit
 * - Graceful fallback to the offline rule-based engine
 */
export async function generateStructuredAI<T>(options: AIOptions<T>): Promise<AIResult<T>> {
  const {
    systemInstruction,
    userPrompt,
    schema,
    fallback,
    timeoutMs = DEFAULT_AI_TIMEOUT_MS,
    retryDelayMs = 400,
    maxAttempts = MAX_AI_ATTEMPTS,
    totalBudgetMs = DEFAULT_AI_TOTAL_BUDGET_MS,
  } = options;

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // 1. Check LRU Cache
  const cacheKey = getCacheKey(modelName, systemInstruction, userPrompt);
  const cached = getFromCache<T>(cacheKey);
  if (cached !== undefined) {
    return { data: cached, source: "ai", cached: true };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_google_ai_studio_key_here") {
    return { data: fallback(), source: "offline_backup", cached: false };
  }

  // 2. Execute with automatic retries (only when a retry can help)
  const startedAt = Date.now();
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const remaining = totalBudgetMs - (Date.now() - startedAt);
    // Never start an attempt that cannot finish inside the total budget.
    if (attempt > 1 && remaining < MIN_ATTEMPT_MS) {
      console.warn("[Gemini Final Failure]: Out of time for another attempt. Falling back to the offline engine.");
      break;
    }
    const attemptTimeout = Math.max(1, Math.min(timeoutMs, remaining));

    const controller = new AbortController();
    try {
      const ai = new GoogleGenAI({ apiKey });

      const generatePromise = ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          abortSignal: controller.signal,
        },
      });
      // If the timeout wins the race, the SDK's later rejection must not become an unhandled rejection.
      generatePromise.catch(() => undefined);

      const response = await callWithTimeout(generatePromise, attemptTimeout, controller);
      const rawText = response.text || "";
      const cleaned = stripCodeFences(rawText);

      const jsonParsed = JSON.parse(cleaned);
      const validated = schema.parse(jsonParsed);

      setInCache(cacheKey, validated);
      return { data: validated, source: "ai", cached: false };
    } catch (err) {
      const canRetry = isRetryableError(err);
      if (canRetry && attempt < maxAttempts) {
        console.warn(
          `[Gemini Attempt ${attempt} of ${maxAttempts} Failed]: Retrying...`,
          describeError(err, apiKey)
        );
        await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
        continue;
      }
      console.warn(
        canRetry
          ? "[Gemini Final Failure]: Falling back to the offline engine."
          : "[Gemini Not Retried]: This error cannot be fixed by retrying. Falling back to the offline engine.",
        describeError(err, apiKey)
      );
      break;
    }
  }

  // 3. Fallback on all errors
  return { data: fallback(), source: "offline_backup", cached: false };
}