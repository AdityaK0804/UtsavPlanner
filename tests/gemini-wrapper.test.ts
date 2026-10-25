import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { z } from "zod";

const { generateContentMock } = vi.hoisted(() => ({ generateContentMock: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
  },
}));

import { clearAICacheForTests, generateStructuredAI, isRetryableError } from "@/ai/gemini";

const schema = z.object({ value: z.string() }).strict();
const FAKE_KEY = "test-key-SECRET-12345";

function apiError(status: number, message = "boom") {
  return Object.assign(new Error(message), { name: "ApiError", status });
}

function run(prompt: string, extra: { timeoutMs?: number } = {}) {
  return generateStructuredAI({
    systemInstruction: "sys",
    userPrompt: prompt,
    schema,
    fallback: () => ({ value: "offline" }),
    retryDelayMs: 1,
    ...extra,
  });
}

describe("Gemini wrapper (gemini.ts) with the SDK mocked", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    generateContentMock.mockReset();
    clearAICacheForTests();
    process.env.GEMINI_API_KEY = FAKE_KEY;
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  });

  it("uses the offline fallback and never calls the SDK when there is no key", async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await run("no-key");
    expect(res).toMatchObject({ source: "offline_backup", cached: false, data: { value: "offline" } });
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("returns a fresh AI answer with cached=false, and a cached answer with cached=true", async () => {
    generateContentMock.mockResolvedValue({ text: '{"value":"hello"}' });
    const first = await run("cache-me");
    expect(first).toMatchObject({ source: "ai", cached: false, data: { value: "hello" } });

    const second = await run("cache-me");
    expect(second).toMatchObject({ source: "ai", cached: true, data: { value: "hello" } });
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it("strips code fences before parsing", async () => {
    generateContentMock.mockResolvedValue({ text: '```json\n{"value":"fenced"}\n```' });
    expect((await run("fenced")).data.value).toBe("fenced");
  });

  it("does NOT retry on an invalid key / permission error (HTTP 401, 403, 400)", async () => {
    for (const status of [400, 401, 403, 404]) {
      generateContentMock.mockReset();
      generateContentMock.mockRejectedValue(apiError(status, `bad key ${FAKE_KEY}`));
      const res = await run(`auth-${status}`);
      expect(res.source).toBe("offline_backup");
      expect(generateContentMock).toHaveBeenCalledTimes(1);
    }
  });

  it("never writes the API key to the logs", async () => {
    generateContentMock.mockRejectedValue(apiError(401, `API key not valid: ${FAKE_KEY}`));
    await run("no-leak");
    const logged = JSON.stringify(warnSpy.mock.calls);
    expect(logged).not.toContain(FAKE_KEY);
    expect(logged).toContain("[redacted]");
  });

  it("retries once on HTTP 429 and succeeds", async () => {
    generateContentMock
      .mockRejectedValueOnce(apiError(429))
      .mockResolvedValueOnce({ text: '{"value":"second-try"}' });
    const res = await run("rate-limited");
    expect(res).toMatchObject({ source: "ai", data: { value: "second-try" } });
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it("retries once on HTTP 500, then falls back if it fails again", async () => {
    generateContentMock.mockRejectedValue(apiError(503));
    const res = await run("server-down");
    expect(res.source).toBe("offline_backup");
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it("retries once on malformed JSON", async () => {
    generateContentMock
      .mockResolvedValueOnce({ text: "this is not json" })
      .mockResolvedValueOnce({ text: '{"value":"fixed"}' });
    const res = await run("bad-json");
    expect(res.data.value).toBe("fixed");
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it("falls back when the JSON does not match the schema twice", async () => {
    generateContentMock.mockResolvedValue({ text: '{"wrong":1}' });
    const res = await run("wrong-shape");
    expect(res.source).toBe("offline_backup");
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it("retries on a network failure", async () => {
    generateContentMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({ text: '{"value":"back-online"}' });
    expect((await run("network")).data.value).toBe("back-online");
  });

  it("passes a real abort signal to the SDK and aborts it on timeout, then retries", async () => {
    const signals: AbortSignal[] = [];
    generateContentMock.mockImplementation((req: { config: { abortSignal: AbortSignal } }) => {
      signals.push(req.config.abortSignal);
      return new Promise(() => undefined); // never answers
    });
    const res = await run("slow", { timeoutMs: 20 });
    expect(res.source).toBe("offline_backup");
    expect(signals).toHaveLength(2);
    expect(signals.every((s) => s.aborted)).toBe(true);
  });

  it("does not cache fallback answers", async () => {
    generateContentMock.mockRejectedValueOnce(apiError(401));
    await run("no-cache-fallback");
    generateContentMock.mockResolvedValueOnce({ text: '{"value":"real"}' });
    const res = await run("no-cache-fallback");
    expect(res).toMatchObject({ source: "ai", cached: false, data: { value: "real" } });
  });
});

describe("isRetryableError", () => {
  it("classifies errors", () => {
    expect(isRetryableError(apiError(429))).toBe(true);
    expect(isRetryableError(apiError(500))).toBe(true);
    expect(isRetryableError(apiError(401))).toBe(false);
    expect(isRetryableError(new SyntaxError("x"))).toBe(true);
    expect(isRetryableError(Object.assign(new Error("x"), { code: "ECONNRESET" }))).toBe(true);
    expect(isRetryableError(new Error("something odd"))).toBe(false);
  });
});