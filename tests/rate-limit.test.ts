import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  MAX_TRACKED_KEYS,
  UNKNOWN_CLIENT,
  checkRateLimit,
  getClientIp,
  getTrackedKeyCountForTests,
  resetRateLimitForTests,
} from "@/lib/rateLimit";
import { enforceRateLimit } from "@/lib/requestGuard";

const headers = (h: Record<string, string>) => new Headers(h);

describe("Rate limiter (rateLimit.ts)", () => {
  beforeEach(() => {
    resetRateLimitForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then blocks", () => {
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("1.2.3.4", 3, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit("1.2.3.4", 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("reports how many requests are left", () => {
    expect(checkRateLimit("1.2.3.4", 3, 60_000).remaining).toBe(2);
    expect(checkRateLimit("1.2.3.4", 3, 60_000).remaining).toBe(1);
    expect(checkRateLimit("1.2.3.4", 3, 60_000).remaining).toBe(0);
  });

  it("resets after the window passes", () => {
    for (let i = 0; i < 2; i++) checkRateLimit("1.2.3.4", 2, 60_000);
    expect(checkRateLimit("1.2.3.4", 2, 60_000).allowed).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit("1.2.3.4", 2, 60_000).allowed).toBe(true);
  });

  it("gives a Retry-After value in whole seconds while blocked", () => {
    checkRateLimit("1.2.3.4", 1, 60_000);
    vi.advanceTimersByTime(20_000);
    const blocked = checkRateLimit("1.2.3.4", 1, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(40);
  });

  it("keeps separate counters per client and per bucket", () => {
    checkRateLimit("1.1.1.1", 1, 60_000, "ai");
    expect(checkRateLimit("1.1.1.1", 1, 60_000, "ai").allowed).toBe(false);
    expect(checkRateLimit("2.2.2.2", 1, 60_000, "ai").allowed).toBe(true);
    expect(checkRateLimit("1.1.1.1", 1, 60_000, "api").allowed).toBe(true);
  });

  it("never tracks more than MAX_TRACKED_KEYS clients", () => {
    for (let i = 0; i < MAX_TRACKED_KEYS + 50; i++) {
      checkRateLimit(`client-${i}`, 5, 60_000);
    }
    expect(getTrackedKeyCountForTests()).toBeLessThanOrEqual(MAX_TRACKED_KEYS);
  });

  it("returns a 429 with a Retry-After header from enforceRateLimit", async () => {
    const req = new Request("http://localhost/api/x", { headers: { "x-real-ip": "9.9.9.9" } });
    expect(enforceRateLimit(req, { bucket: "t", limit: 1 })).toBeNull();
    const res = enforceRateLimit(req, { bucket: "t", limit: 1 });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(Number(res!.headers.get("Retry-After"))).toBeGreaterThan(0);
    const body = await res!.json();
    expect(body.error).toMatch(/too many/i);
  });
});

describe("Client IP helper (getClientIp)", () => {
  it("prefers the platform header x-vercel-forwarded-for", () => {
    const ip = getClientIp(
      headers({
        "x-vercel-forwarded-for": "203.0.113.7",
        "x-real-ip": "198.51.100.1",
        "x-forwarded-for": "6.6.6.6, 198.51.100.1",
      })
    );
    expect(ip).toBe("203.0.113.7");
  });

  it("then prefers x-real-ip over x-forwarded-for", () => {
    const ip = getClientIp(headers({ "x-real-ip": "198.51.100.1", "x-forwarded-for": "6.6.6.6" }));
    expect(ip).toBe("198.51.100.1");
  });

  it("does not trust the client-written left side of x-forwarded-for", () => {
    // A browser can send "6.6.6.6"; our proxy then appends the real address.
    const ip = getClientIp(headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }), 1);
    expect(ip).toBe("203.0.113.9");
  });

  it("can skip extra trusted hops counted from the right", () => {
    const ip = getClientIp(headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9, 10.0.0.2" }), 2);
    expect(ip).toBe("203.0.113.9");
  });

  it("ignores values that are not real IP addresses", () => {
    expect(getClientIp(headers({ "x-real-ip": "not-an-ip", "x-forwarded-for": "<script>" }))).toBe(UNKNOWN_CLIENT);
  });

  it("strips a port and handles IPv6", () => {
    expect(getClientIp(headers({ "x-real-ip": "203.0.113.7:51234" }))).toBe("203.0.113.7");
    expect(getClientIp(headers({ "x-real-ip": "[2001:db8::1]:443" }))).toBe("2001:db8::1");
  });

  it("falls back to a shared safe bucket when no header exists", () => {
    expect(getClientIp(headers({}))).toBe(UNKNOWN_CLIENT);
  });
});