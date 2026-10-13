# Implementation plan

Each phase ends with a report covering changed files, test results (only tests actually run), remaining risks and the next step. Nothing goes live and no paid service is turned on without the founder's explicit approval.

## Folder structure (target)

```
thaal/
  src/
    app/                 # pages and routes (Next.js App Router)
      (marketing)/       # loud pages: home, discover
      (studio)/          # quiet pages: write, dashboard
      (reader)/          # reading screens
      api/webhooks/      # payment webhooks only
    components/ui/       # shadcn components
    components/          # app components
    lib/
      env.ts             # validated environment variables
      supabase/          # browser / server / admin clients
      money/             # split + ledger maths (pure, heavily tested)
      payments/          # PaymentProvider interface + razorpay/ cashfree/
      ai/                # AI adapter + providers
    styles/tokens.css
  supabase/
    migrations/          # versioned SQL, the source of truth for the schema
    tests/               # RLS and database tests
    seed.sql             # fake local data only
  tests/e2e/             # Playwright
  docs/                  # these documents + decisions/
  .github/workflows/ci.yml
```

## Phase 1 — Foundation

**Build:** Next.js + TS strict, pnpm, ESLint + Prettier, Zod env validation, Tailwind + shadcn + design tokens + Anek/Noto fonts, local Supabase (Docker) with a first empty migration, `.env.example` (placeholders only), Vitest + Playwright set up with one smoke test each, GitHub Actions CI (typecheck, lint, unit tests, build, secret scan), responsive shell (header, footer, loud home placeholder, quiet page placeholder), `README.md` with setup steps.
**Done when:**

- `pnpm build`, `pnpm lint`, `pnpm typecheck` and `pnpm test` pass locally, and CI runs them.
- Starting the app without required env vars fails with a clear message.
- The home page renders correctly at 360 px and 1440 px, including a Malayalam sample headline.
- `.env.example` contains no real values. A test confirms the service key never appears in browser bundles.

## Phase 2 — Accounts and private writing

**Build:** sign-up/in (magic link, Google), profiles, `works` and `chapters` tables with RLS, Tiptap editor with Indic fonts, autosave (debounced, with conflict warning), version history (last N snapshots), work types (novel, short story, poem, serial, comic shell).
**Done when:**

- RLS tests prove user B and anonymous users can't read, list, update or delete user A's drafts, through both the API and storage.
- Autosave survives a page refresh and a lost connection (queued and retried).
- Malayalam typed with common input methods saves and reloads exactly.

## Phase 3 — Publishing and reading

**Build:** publish flow (free or price ≥ ₹49), cover upload, book and chapter pages with SEO metadata, author profiles, discovery (latest, genre, language, search), reader (font/size/theme, progress saved), configurable free preview chapters, comic page reader with signed image URLs, content language tags, licence acceptance at publish, report button.
**Done when:**

- Published free books are readable while logged out. Paid chapters beyond the preview return nothing without an entitlement (tested at the database and API level).
- Unpublishing hides a book from discovery immediately. Existing buyers keep access, a policy to confirm.
- Lighthouse scores on mobile meet at least performance 80 and accessibility 90 on book pages.

## Phase 4 — Payments and earnings (test mode)

**Build:** `PaymentProvider` adapter (Razorpay Route first), checkout, server-side signature verification, webhooks, entitlements, double-entry ledger, author earnings dashboard, refunds with reversals, daily reconciliation report, admin view.
**Done when:**

- Property tests show author + platform = price for every price from ₹49 to ₹10,000, and that every ledger transaction balances.
- Forged, replayed or out-of-order webhooks don't grant access or double-count.
- An end-to-end test-mode purchase grants access, and a refund revokes it and writes reversing entries.
- No live keys exist anywhere until the founder approves the go-live checklist.

## Phase 5 — AI studio and community

**Build:** AI adapter (Claude), credit packs (separate product, platform keeps 100%), credit wallet ledger, tools (brainstorm, continue, rewrite, translate draft, summarise), per-user limits and spend cap, reviews and ratings (only by readers who own the book, for paid books), follows, share links and OG images, moderation queue, AI-use disclosure label option.
**Done when:**

- Concurrent requests can't spend the same credits twice (tested).
- A failed AI call refunds its credits.
- Swapping the AI provider requires changes in `lib/ai/` only.
- Moderators can hide reviews and books, with an audit log.

## Before public launch (not engineering-only)

Company incorporated, payment provider split product approved for individual authors, CA sign-off on the tax model, lawyer-reviewed Terms, Author Licence, Privacy Notice and grievance officer details, Supabase Pro (backups), Vercel Pro, domain, and a final security review.
