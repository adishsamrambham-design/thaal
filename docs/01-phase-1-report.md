# Phase 1 report: foundation

**Status:** Complete in the workspace. **Not yet on GitHub**, so CI hasn't run there. Date: 13 October 2026.

## What was built

- A Next.js 16.4 app with strict TypeScript, pnpm, Tailwind 4 and shadcn/ui.
- An environment check that stops `dev` and `build` with a plain list of what's missing.
- Supabase connections for the browser and the server, local Supabase config, and a baseline migration (search extension only, no tables yet).
- Design tokens and fonts (Anek for UI and display across 7 scripts, Noto Serif for reading).
- Pages: the home page (loud), Discover (empty state), Write (quiet placeholder showing English and Malayalam reading type), and a 404 page.
- Security headers on every response.
- CI workflow: type check, lint, formatting, unit tests, database tests, build, bundle secret scan, browser tests and Gitleaks history scan.

## Tests actually run (all in this workspace)

| Check                                          | Result                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| Type check (`tsc --noEmit`, strict)            | Pass                                                              |
| Lint (ESLint)                                  | Pass, 0 warnings                                                  |
| Formatting (Prettier)                          | Pass                                                              |
| Unit tests (Vitest)                            | 5 / 5 pass                                                        |
| Database test: every public table has RLS      | Pass. Also shown to **fail** when an unprotected table was added. |
| Production build                               | Pass, 4 static routes                                             |
| Bundle secret scan                             | Pass. Also shown to **fail** on a planted fake key.               |
| Browser tests (Playwright), 1440 px and 360 px | 10 / 10 pass                                                      |
| Missing env vars                               | Build stops with a clear message (checked by hand)                |
| Horizontal scroll at 360 px                    | None on any page                                                  |

## Not done or not verified

- **The GitHub Actions workflow has never run on GitHub.** The same steps pass locally. The first push will confirm it.
- Content-Security-Policy is deferred to Phase 2 with authentication (see ADR 0002).
- Lighthouse scores weren't measured. That's planned for Phase 3, when book pages exist.

## Remaining risks

- Razorpay personal-PAN support is unconfirmed (see the Phase 0 report). It doesn't block Phases 2 and 3.
- The commission and tax model still needs a CA's review before Phase 4 goes live.

## Next action

1. Founder: create a GitHub account (and a Supabase account) so the code can be pushed and CI can run.
2. Start Phase 2: sign-in, editor, autosave, private drafts and the security tests for them.
