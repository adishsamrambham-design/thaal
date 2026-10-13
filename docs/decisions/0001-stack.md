# ADR 0001 — Application stack

**Status:** Proposed (awaiting founder approval) · 2026-10-13

## Context
We are building a self-publishing marketplace for Indian-language writing, with private drafts, paid books, author payouts and an AI writing studio. The founder isn't technical, so the stack has to be well documented, widely used, and small enough that one engineer (human or AI) can maintain it.

## Decision
| Concern | Choice | Alternatives considered |
|---|---|---|
| Framework | Next.js App Router, React, TypeScript `strict` | Remix (smaller ecosystem); separate SPA + API (two codebases) |
| Package manager | pnpm | npm (slower, looser) |
| UI | Tailwind CSS + shadcn/ui (Radix primitives) | MUI (heavier, harder to restyle to the brand) |
| Data | Supabase Postgres (`ap-south-1` Mumbai), SQL migrations in `supabase/migrations` | Firebase (no relational integrity, which money needs); self-hosted Postgres (operations burden) |
| Data access | `@supabase/supabase-js` + generated TypeScript types; complex money operations as Postgres functions | Prisma/Drizzle ORM: these bypass RLS when used with a service role, which risks quietly undermining the security model |
| Auth | Supabase Auth (email magic link + Google OAuth) | Clerk/Auth0 (extra vendor and cost) |
| Files | Supabase Storage, private buckets, signed URLs | S3/R2 (fine, but an extra vendor for now) |
| Editor | Tiptap (MIT core), ProseMirror JSON stored in Postgres `jsonb` | Lexical, Quill |
| Validation | Zod (inputs + `env`) | — |
| Payments | Adapter interface; Razorpay Route first, Cashfree Easy Split as fallback | Stripe (doesn't serve Indian marketplace payouts well) |
| AI | Internal `ai/` adapter; Anthropic Claude first | Calling a vendor SDK directly from feature code (lock-in) |
| Hosting | Vercel Pro, functions pinned to `bom1` | Netlify, Cloudflare, Railway: all viable, with weaker Next.js parity |
| Email | Resend | SES (more setup) |
| Tests | Vitest, Playwright, SQL tests against local Supabase (Docker) | — |
| CI | GitHub Actions | — |

## Consequences
- **Vendor dependence:** Supabase and Vercel are significant dependencies. Both run on standard technology (Postgres, Node), so moving away later is work, not a rewrite.
- **Licences:** Next.js, React, Tailwind, shadcn/ui, Tiptap core, Zod, Vitest and Playwright are MIT or Apache-2.0. Fonts are SIL Open Font Licence. Tiptap Pro extensions (paid) are **not** used.
- **Search:** Postgres has no Malayalam stemmer. We use the `simple` text-search config plus trigram matching, which is good enough for titles, authors and tags at launch.
- **Interface language:** English only, with no i18n framework, though strings stay in components so one can be added later. Content uses the correct `lang` attribute per book so fonts and screen readers behave.
