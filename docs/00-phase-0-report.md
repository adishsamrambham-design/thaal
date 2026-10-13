# Phase 0 report — inspection and plan

**Status:** waiting for founder approval. No application code has been written.
**Date:** 13 October 2026
**Working name:** _Thaal_ (താൾ, "page"). This is a placeholder and can be renamed in one place later.

---

## 1. What I found

| Check             | Result                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Project directory | Empty. No existing app, so nothing gets overwritten.                                                  |
| Git               | 2.43 installed. A new repository was created in `thaal/` on branch `main`.                            |
| Node.js           | v22 (current long-term support), which Next.js supports.                                              |
| Package managers  | npm 10.9 and pnpm 10.28. **I recommend pnpm** because it is faster and stricter about dependencies.   |
| Postgres client   | psql 16.                                                                                              |
| Docker            | 29.8, so the full Supabase stack (database, auth, storage) can run locally for development and tests. |
| Machine           | 2 CPUs and 8 GB RAM, which is enough for development.                                                 |

This workspace runs in Anthropic's cloud and belongs to this session. **The code needs a permanent home on GitHub before Phase 1 ends** (see §8).

---

## 2. Your answers, and how I've interpreted them

| #   | Your answer                  | What I'll build                                                                                                                                   |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Start fresh                  | New repository, as above.                                                                                                                         |
| 2   | No accounts yet              | You create the accounts and I walk you through each one. I never sign up for services or handle your real passwords or keys.                      |
| 3   | Budget unknown               | §6 sets out the costs. Development costs ₹0. Launch is about US$45/month plus usage.                                                              |
| 4   | New company                  | Live payments can't start until the company exists with a PAN, GSTIN and current account. Test mode can run earlier.                              |
| 5   | "15% + GST and platform fee" | **Needs confirmation.** See §4.                                                                                                                   |
| 6   | INR only, minimum ₹49        | Enforced in the database and the UI.                                                                                                              |
| 7   | Interface in English only    | No translation framework yet. Books can be written in any of the supported scripts.                                                               |
| 8   | Comics at launch             | Comics get an image-page reader with protected image delivery in Phase 3.                                                                         |
| 9   | AI                           | Claude, behind a swappable adapter, in Phase 5.                                                                                                   |
| 10  | Design                       | The bold reference style for marketing and discovery pages, and calm reading and writing screens. I'll pick the brand. See `design-direction.md`. |

---

## 3. Recommended stack: the proposed list is mostly kept

I reviewed every item on your proposed list. The recommendation keeps nearly all of them and adds only what the requirements actually need.

| Layer          | Choice                                                                                  | Why, in plain English                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| App framework  | **Next.js (App Router) + React + TypeScript strict**                                    | One codebase serves both the website and the server logic. Pages render on the server, which helps books show up in Google.                     |
| Styling        | **Tailwind CSS + shadcn/ui**                                                            | shadcn copies component code into our project instead of adding a dependency we can't control.                                                  |
| Database       | **Supabase Postgres, Mumbai region**                                                    | A real relational database, which money needs. Hosting it in Mumbai keeps it close to Indian readers.                                           |
| Security rules | **Row Level Security + versioned SQL migrations**                                       | The database itself refuses to show a private draft to anyone but its owner, even if the app has a bug.                                         |
| Login          | **Supabase Auth** (email + Google)                                                      | Included with the database, so no extra vendor.                                                                                                 |
| Files          | **Supabase private storage**                                                            | Covers covers, comic pages and manuscript images. Paid files are only reachable through short-lived signed links.                               |
| Writing editor | **Tiptap** (open-source core, MIT)                                                      | A proven rich-text editor that handles Malayalam and other Indic input well. Content is saved as structured JSON, not raw HTML, which is safer. |
| Validation     | **Zod**                                                                                 | Checks every form, API input and environment variable.                                                                                          |
| Payments       | **Razorpay with Route** (Cashfree Easy Split as backup)                                 | See `payments-and-money.md`. Both require a separate activation.                                                                                |
| Hosting        | **Vercel Pro, functions in Mumbai (`bom1`)**                                            | Made for Next.js. The free Hobby tier forbids commercial use.                                                                                   |
| Email          | **Resend** (free tier at first)                                                         | Sends login links and receipts.                                                                                                                 |
| AI             | **Anthropic Claude via our own small adapter**                                          | Changing models later means changing one file.                                                                                                  |
| Tests          | **Vitest** (logic), **Playwright** (browser), **database tests against local Supabase** | The security rules are tested directly.                                                                                                         |
| CI             | **GitHub Actions**                                                                      | Runs type checks, lint, tests and the build on every change.                                                                                    |

**Deliberately left out:** a separate search engine (Postgres search is enough at launch), a separate state-management library, an ORM, Redis, and analytics vendors. Each can be added later if a real need appears.

The full reasoning is in `decisions/0001-stack.md`.

---

## 4. Money: one thing I need you to confirm

My reading of answer 5:

> The buyer pays **book price + GST**. From the **book price** (excluding GST), the author gets **85%** and the platform keeps **15%**. **The platform pays the payment-gateway fee out of its 15%.**

Worked examples, calculated in code to the paisa. E-book GST is shown at 5% and 18% because the current rate must be confirmed by your CA.

| Book price | GST 5% | Buyer pays | Author (85%) | Platform (15%) | Gateway fee + GST on fee (≈2.36%) | Platform keeps |
| ---------- | ------ | ---------- | ------------ | -------------- | --------------------------------- | -------------- |
| ₹49        | ₹2.45  | ₹51.45     | **₹41.65**   | ₹7.35          | ₹1.22                             | **₹6.13**      |
| ₹199       | ₹9.95  | ₹208.95    | **₹169.15**  | ₹29.85         | ₹4.93                             | **₹24.92**     |

At ₹49, the gateway fee takes about a sixth of the platform's 15%. That still works, but it's worth knowing.

**If "platform fee" means a separate convenience fee charged to the buyer on top,** that also works but changes the checkout display and the tax treatment. Tell me which one you meant.

**Questions for your chartered accountant** (I can't answer these, and the code alone won't make you compliant):

- The current GST rate on e-books and digital comics sold through a marketplace, and whether the platform or the author is liable for it.
- GST on the platform's 15% commission (a service to the author).
- GST TCS (section 52) and income-tax TDS (section 194-O, currently 0.1% with a ₹5 lakh exemption for small individual sellers) on author payouts.
- Whether holding author money before payout creates payment-aggregator obligations. Using the gateway's split product avoids most of this.

---

## 5. Payment provider findings (from official docs)

**Neither provider enables marketplace splits on a normal account.**

- **Razorpay Route:** Linked-account creation fails with "Route product is not enabled" until a Razorpay integration manager switches it on. Each author becomes a "linked account" with a PAN and a bank account or UPI ID. **Concern found:** Razorpay's linked-account API lists the allowed PAN types, and the personal-PAN type (4th letter "P") is not on that list, although an example in the same document uses an "individual" business type. Most of your authors are individuals, so **this must be confirmed in writing with Razorpay before we commit.**
- **Cashfree Easy Split:** You must ask your account manager to enable it. Vendors need a PAN and a bank account. It adds 0.2% per split on top of normal gateway fees and settles on T+2 by default. Refunds are recovered automatically from vendors in proportion to their split. Its limits are 5 vendors per order and a 45-day maximum hold.

**Recommendation:** Apply to both once the company exists. Choose the one that confirms **individual authors with a personal PAN** as payees. The code will sit behind a payment adapter so either can be used. Details are in `payments-and-money.md`.

---

## 6. Costs

| Stage                    | Monthly cost                                     | Notes                                                                                                                                 |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Development (Phases 1–3) | **₹0**                                           | Supabase free plan: 500 MB database, 1 GB files, pauses after a week idle, **no backups**. Vercel Hobby is fine for private previews. |
| Public launch            | **About US$45 + usage**                          | Vercel Pro $20 (includes $20 usage credit) and Supabase Pro $25 (8 GB database, 100 GB files, daily backups).                         |
| Payments                 | 2% + 18% GST per transaction (Razorpay standard) | Plus the split product fee. Cashfree's is 0.2%. Razorpay hasn't published one; ask.                                                   |
| AI studio                | Pay per use                                      | Credits will be priced above cost so the AI studio never loses money.                                                                 |
| Domain and email         | About ₹1,000/year + free tier                    |                                                                                                                                       |

Comics are the main thing that will grow costs, because images make up most storage and bandwidth. Images will be compressed on upload.

---

## 7. Biggest security risks and how they're handled

The full list is in `security.md`. The top five:

1. **Someone reads a private draft.** Database-level rules make drafts readable only by their author, and automated tests try to break this on every change.
2. **Someone reads a paid book without paying.** Chapters are served only after a server-side purchase check. There are no public file links. Honest limit: a paying reader can always copy or screenshot what they're shown. No website can prevent that.
3. **Fake payment success.** A purchase is granted only after verifying the gateway's cryptographic signature on the server, plus a webhook. The browser's "payment done" message is never trusted.
4. **Wrong money maths.** All amounts are stored as whole paise, never decimals. An append-only ledger means every rupee can be traced, and nightly reconciliation compares against the gateway.
5. **Leaked keys.** Secrets live only in the hosting dashboard and are never in code. CI scans for leaked keys.

---

## 8. What you need to do

**Before Phase 1 ends (needed for development):**

1. Create a **GitHub** account. I'll then connect it so the code is saved permanently.
2. Create a **Supabase** account (free). Later you'll paste two keys into a settings screen, and I'll show you where.

**Before Phase 4 (payments, test mode):** 3. Create a Razorpay account (test mode works before KYC) and ask about Route for individual payees.

**Before launch:** 4. Incorporate the company and get its PAN, GSTIN and current account. 5. Hire a CA and a lawyer for tax, terms of service, the author licence, privacy (DPDP Act) and IT Rules compliance. I'll draft documents for them to review, not to publish as-is. 6. Vercel Pro, Supabase Pro and a domain name.

---

## 9. Plan

Phases, deliverables and acceptance criteria are in `implementation-plan.md`. In short:

1. **Foundation:** app shell, tooling, local database, CI, design tokens.
2. **Accounts and private writing:** login, editor, autosave, drafts, security tests.
3. **Publishing and reading:** books, chapters, comics, previews, profiles, discovery, reader.
4. **Payments and earnings:** test-mode checkout, 85/15 ledger, refunds, reconciliation.
5. **AI studio and community:** credits, AI tools, reviews, follows, sharing, moderation.

## 10. Approval needed

Please reply with:

- **A.** Approve the stack in §3, or name what to change.
- **B.** Confirm the money reading in §4, or correct it.
- **C.** Keep or replace the working name "Thaal".

Once you reply, I'll start Phase 1.
