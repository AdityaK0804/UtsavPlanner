import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 * - Next.js writes small inline scripts to start the page, and Tailwind/Next use inline styles,
 *   so 'unsafe-inline' is needed for script-src and style-src (a per-request nonce would need
 *   middleware and would make every page dynamic).
 * - 'unsafe-eval' is added ONLY in development (React/Next dev tools need it).
 * - Images may come from any https host while the design is still changing (the hero uses Unsplash);
 *   tighten img-src to the exact hosts once the images are final.
 * - Nothing else (frames, plugins, other sites' forms, other base URLs) is allowed.
 * - HTTPS is enforced by Strict-Transport-Security (not upgrade-insecure-requests, which breaks http://localhost).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    // Browsers only honour this over HTTPS and ignore it on http://localhost.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;