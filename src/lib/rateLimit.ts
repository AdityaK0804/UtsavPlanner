import { isIP } from "node:net";

/**
 * Best-effort, zero-dependency, in-memory rate limiter + trusted client-IP helper.
 *
 * LIMITATION (serverless): on Vercel / AWS Lambda each warm container keeps its own
 * memory, and that memory is wiped on cold starts. So the limit is per container, not
 * global. It stops fast loops and accidental hammering, but it is NOT a hard quota.
 * For a hard, shared limit use a shared store (for example Upstash Redis or Vercel KV)
 * behind the same `checkRateLimit` signature.
 *
 * Memory safety: the table never holds more than MAX_TRACKED_KEYS entries.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  /** Epoch ms when the current window ends. */
  resetTime: number;
  /** Whole seconds to wait before trying again (0 when allowed). */
  retryAfterSeconds: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export const MAX_TRACKED_KEYS = 5000;
const MAX_KEY_LENGTH = 80;
const CLEANUP_INTERVAL_MS = 300_000;

const rateLimitMap = new Map<string, RateLimitRecord>();

function purgeExpired(now: number): void {
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Periodic cleanup. unref() so it never keeps a server or test process alive.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => purgeExpired(Date.now()), CLEANUP_INTERVAL_MS);
  if (typeof timer === "object" && timer !== null && "unref" in timer) {
    (timer as { unref: () => void }).unref();
  }
}

/**
 * Checks and counts one request for `key` inside the named `bucket`.
 * Different buckets (for example "api" and "ai") keep separate counters.
 */
export function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
  bucket = "default"
): RateLimitResult {
  const safeKey = `${bucket}:${(key || "").trim().slice(0, MAX_KEY_LENGTH) || "unknown-client"}`;
  const now = Date.now();

  const record = rateLimitMap.get(safeKey);

  if (!record || now > record.resetTime) {
    if (!record && rateLimitMap.size >= MAX_TRACKED_KEYS) {
      purgeExpired(now);
      if (rateLimitMap.size >= MAX_TRACKED_KEYS) {
        // Still full: drop the oldest entry so memory stays bounded.
        const oldest = rateLimitMap.keys().next().value;
        if (oldest !== undefined) rateLimitMap.delete(oldest);
      }
    }
    const fresh: RateLimitRecord = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(safeKey, fresh);
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      limit,
      resetTime: fresh.resetTime,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetTime: record.resetTime,
      retryAfterSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - record.count),
    limit,
    resetTime: record.resetTime,
    retryAfterSeconds: 0,
  };
}

/** Test helpers. */
export function resetRateLimitForTests(): void {
  rateLimitMap.clear();
}
export function getTrackedKeyCountForTests(): number {
  return rateLimitMap.size;
}

// ---------------------------------------------------------------------------
// Client IP
// ---------------------------------------------------------------------------

type HeaderReader = { get(name: string): string | null };

/** Returns a clean IP string, or null when the value is not a real IP address. */
function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (!value || value.length > 64) return null;
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    if (end === -1) return null;
    value = value.slice(1, end);
  } else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(value)) {
    value = value.slice(0, value.lastIndexOf(":"));
  }
  return isIP(value) ? value.toLowerCase() : null;
}

export const UNKNOWN_CLIENT = "unknown-client";

/**
 * Finds the caller's IP without blindly trusting a client-written header.
 *
 * Order of trust:
 * 1. `x-vercel-forwarded-for`  - written by the Vercel edge, a browser cannot set it.
 * 2. `x-real-ip`               - written by the nearest reverse proxy / platform.
 * 3. `x-forwarded-for`         - every proxy APPENDS to this list, so the left side is
 *                                client-controlled. We pick the entry added by our own
 *                                trusted proxy: counting from the RIGHT, skipping
 *                                `TRUSTED_PROXY_HOPS - 1` hops (default 1 = last entry).
 * 4. Otherwise a single shared "unknown-client" bucket (safe, stricter).
 *
 * Only run this behind a proxy / platform that overwrites these headers.
 */
export function getClientIp(
  headers: HeaderReader,
  trustedProxyHops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10)
): string {
  const vercel = normalizeIp(headers.get("x-vercel-forwarded-for")?.split(",")[0]);
  if (vercel) return vercel;

  const realIp = normalizeIp(headers.get("x-real-ip"));
  if (realIp) return realIp;

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const hops = Math.min(5, Math.max(1, Number.isFinite(trustedProxyHops) ? trustedProxyHops : 1));
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      const idx = Math.max(0, parts.length - hops);
      const fromXff = normalizeIp(parts[idx]);
      if (fromXff) return fromXff;
    }
  }

  return UNKNOWN_CLIENT;
}