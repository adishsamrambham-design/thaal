# ADR 0002 — Foundation choices made in Phase 1

**Status:** Accepted · 2026-10-13

## Next.js 16 with Cache Components

The Next.js 16.4 starter template switches on **Cache Components**, and we keep it. Pages are pre-built as a fast static shell, and anything personal (a reader's library, a draft) is loaded per request. This matches our needs: public book pages are fast and cacheable, and private data is never cached by accident. Consequence: any code reading cookies or the signed-in user must sit inside a loading boundary (`<Suspense>`). This applies from Phase 2.

## Turbopack

This is the default bundler in Next.js 16. No custom webpack config is allowed, which keeps upgrades simple.

## Supabase "publishable" and "secret" keys

We use Supabase's newer key types (`sb_publishable_…` and `sb_secret_…`), not the older JWT `anon` and `service_role` keys. The secret key is optional until Phase 2. The env check refuses a secret key placed in a public variable.

## Fonts self-hosted through `next/font`

Fonts are downloaded at build time and served from our own domain, so readers' browsers never contact Google. Latin and Malayalam are preloaded. Other scripts load only when a page uses them.

## Security headers now; full Content-Security-Policy in Phase 2

Basic headers ship now: no sniffing, no framing, HSTS, a strict referrer policy and a locked-down permissions policy. A strict CSP needs per-request nonces, which belong in `proxy.ts` (Next 16's replacement for `middleware.ts`). That file arrives with authentication in Phase 2, so the CSP is added then rather than as a weak version now.

## Guard-rail tests from day one

- **Database:** a test fails if any table in `public` lacks Row Level Security. It was verified by creating an unprotected table and watching the test fail.
- **Bundles:** a script fails the build if a secret-key pattern or the actual secret value appears in any browser-facing file. It was verified with a planted fake key.

## Secret scanning in CI

Uses Gitleaks. It's free for personal GitHub accounts. If the repo moves to a GitHub organisation, Gitleaks needs a free licence key, or we swap to GitHub's built-in secret scanning.
