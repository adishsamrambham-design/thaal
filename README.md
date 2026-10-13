# Thaal

A self-publishing marketplace and writing studio for English and Indian languages. _(Working name.)_

**Status:** Phase 1 (foundation). No accounts, writing, publishing or payments yet. See [`docs/implementation-plan.md`](docs/implementation-plan.md).

## What's in the box

| Part                   | What it is                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `src/app/`             | Pages. `(marketing)` holds the loud public pages; `(studio)` holds the quiet writing screens.   |
| `src/lib/env/`         | Checks every setting the app needs at startup and stops with a clear message if one is missing. |
| `src/lib/supabase/`    | Connections to the database, one for the browser and one for the server.                        |
| `supabase/migrations/` | Database changes, in order. These are the only way the database structure changes.              |
| `supabase/tests/`      | Database security tests (Row Level Security).                                                   |
| `tests/e2e/`           | Browser tests that click through the site.                                                      |
| `docs/`                | Plans and decisions. Start with `00-phase-0-report.md`.                                         |

## Local setup

You need **Node.js 22+**, **pnpm 10** and **Docker** (for the local database).

```bash
pnpm install
pnpm db:start                 # starts a local Supabase in Docker and prints its keys
cp .env.example .env.local    # then paste the local URL and publishable key from the step above
pnpm dev                      # http://localhost:3000
```

The local Supabase keys are fixed public test values. They only work on your machine. **Real project keys are never written into files in this repository.** They go into the hosting dashboard.

## Everyday commands

| Command         | Does                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`      | Runs the site locally with live reload                                                                             |
| `pnpm check`    | Runs everything CI runs except database and browser tests: types, lint, formatting, unit tests, build, secret scan |
| `pnpm test`     | Unit tests                                                                                                         |
| `pnpm db:test`  | Database security tests (needs `pnpm db:start`)                                                                    |
| `pnpm test:e2e` | Browser tests against a production build (run `pnpm build` first)                                                  |
| `pnpm db:reset` | Rebuilds the local database from migrations. **Deletes local data.**                                               |
| `pnpm format`   | Fixes code formatting                                                                                              |

## Git practices

- `main` is always deployable. Work happens on short branches and is merged through a pull request once CI passes.
- Commit messages say what changed and why, in plain words.
- Never commit `.env.local` or any real key. `.gitignore` blocks env files, and CI scans every commit for secrets.

## Rules this project follows

Private drafts stay private by default, enforced by the database, not just the screen. Money is stored in whole paise. No live payments, payouts or paid services are turned on without the founder's explicit approval.
