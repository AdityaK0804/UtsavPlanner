import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Guards against garbled rupee signs / emojis (mojibake) and byte-order marks sneaking back in.
 * Patterns are written as escapes so this file itself stays clean.
 */
const GARBLED = [
  /\uFFFD/, // replacement character
  /\u00E2\u201A\u00B9/, // the rupee sign read with the wrong encoding
  /\u00E2\u20AC/, // dashes and quotes read with the wrong encoding
  /\u00C3[\u0080-\u00BF]/, // accented letters read with the wrong encoding
  /\u00F0\u0178/, // emoji read with the wrong encoding
];

function listFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(p, out);
    else if (/\.(ts|tsx|json|css)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const root = path.resolve(__dirname, "..");
const files = [
  ...listFiles(path.join(root, "src")),
  ...listFiles(path.join(root, "tests")).filter((f) => !f.endsWith("encoding.test.ts")),
  path.join(root, "README.md"),
  path.join(root, "PROJECT_CONTEXT.md"),
];

describe("Text encoding", () => {
  it("has no garbled characters or byte-order marks in source, tests or docs", () => {
    const problems: string[] = [];
    for (const file of files) {
      const bytes = fs.readFileSync(file);
      if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) problems.push(`${file}: has a BOM`);
      const text = bytes.toString("utf8");
      for (const pattern of GARBLED) {
        if (pattern.test(text)) problems.push(`${file}: matches ${pattern}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("writes the rupee sign (U+20B9) in user-facing money text", async () => {
    const { formatINR } = await import("@/lib/whatsapp");
    const { checkCashInHand } = await import("@/engine/cash");
    const { PRESET_WEDDING } = await import("@/templates/presets");
    expect(formatINR(1500)).toBe("\u20B91,500");
    const summary = checkCashInHand(PRESET_WEDDING.budgetItems, [], 5);
    expect(summary.simpleWarning).toContain("\u20B9");
  });
});