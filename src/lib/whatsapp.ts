/**
 * Formats rupee numbers with Indian numbering style (lakhs & crores) and commas.
 * Examples:
 * - 15000 -> "₹15,000"
 * - 800000 -> "₹8,00,000 (₹8 Lakh)"
 * - 1250000 -> "₹12,50,000 (₹12.5 Lakh)"
 * - 10000000 -> "₹1,00,00,000 (₹1 Crore)"
 */
export function formatINR(amount: number): string {
  const safe = isNaN(amount) ? 0 : Math.round(amount);
  const formatted = `₹${safe.toLocaleString("en-IN")}`;

  if (safe >= 10_000_000) {
    const crore = (safe / 10_000_000).toFixed(safe % 10_000_000 === 0 ? 0 : 2);
    return `${formatted} (₹${crore} Crore)`;
  } else if (safe >= 100_000) {
    const lakh = (safe / 100_000).toFixed(safe % 100_000 === 0 ? 0 : (safe % 10_000 === 0 ? 1 : 2));
    return `${formatted} (₹${lakh} Lakh)`;
  }

  return formatted;
}

/**
 * Builds a direct universal WhatsApp share link.
 * Does not require any pre-filled phone number so the user can easily select
 * their family group, colony group, or specific vendor in the WhatsApp app.
 */
export function buildWhatsAppLink(messageText: string): string {
  const encoded = encodeURIComponent(messageText.trim());
  return `https://wa.me/?text=${encoded}`;
}
