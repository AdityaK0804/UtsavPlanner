/**
 * Sanitizes untrusted user input text.
 * Strips HTML tags and dangerous control characters while preserving UTF-8 (Hindi Devanagari, emojis, punctuation).
 */
export function sanitizeUserText(input: unknown, maxLength = 800): string {
  if (input === null || input === undefined) {
    return "";
  }

  let text = typeof input === "string" ? input : String(input);

  // 1. Strip HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // 2. Remove dangerous ASCII control characters (keeping \t, \n, \r)
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Trim extra whitespace
  text = text.trim();

  // 4. Enforce max length cap
  if (text.length > maxLength) {
    text = text.slice(0, maxLength);
  }

  return text;
}
