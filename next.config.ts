import type { NextConfig } from "next";
import { parseEnv, serverEnvSchema } from "./src/lib/env/schema";

// Fail fast: `next dev` and `next build` stop here with a clear message if env vars are missing.
const env = parseEnv(serverEnvSchema, process.env);

const isDev = process.env.NODE_ENV === "development";
const supabaseOrigin = new URL(env.NEXT_PUBLIC_SUPABASE_URL).origin;
const isHttps = env.NEXT_PUBLIC_SITE_URL.startsWith("https://");

/*
 * Content Security Policy. See docs/decisions/0003-private-writing.md for why scripts allow
 * 'unsafe-inline': nonce-based CSP would force every page to render per request, losing the
 * fast static pages. Everything else is locked down: no third-party scripts, frames, plugins
 * or form targets, and the browser may only talk to our own site and our Supabase project.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
