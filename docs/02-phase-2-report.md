# Phase 2 report: accounts and private writing

**Status:** Complete in the workspace, on branch `phase-2-private-writing` (merged into `main` locally). **Not yet on GitHub.** Date: 13 October 2026.

## What was built

- **Sign-in with an emailed 6-digit code** (or the one-tap link in the same email). There are no passwords. New emails create an account automatically. Google sign-in is built but switched off until it's configured.
- **Sign-out**, which also wipes any unsaved copies kept in the browser.
- **Writing studio:** a list of your works, creating a work (title, kind, language), work details, adding parts, and deleting a work (you type "delete" to confirm).
- **Editor:** a calm serif page in the work's language with bold, italic, underline, strike, two heading levels, quotes, lists, undo and redo, a live word count (correct for Malayalam and other Indic scripts) and a save indicator.
- **Autosave:** saves about 1 second after you pause. Retries when offline, and saves immediately when the connection returns. Unsaved text is restored after a closed tab. Two tabs editing the same part never overwrite each other silently.
- **History:** a snapshot at most every 10 minutes, keeping the last 30. Any snapshot can be restored.
- **Database:** profiles, works, parts and history, all owner-only. A private storage folder per user for future images. Generated TypeScript types, with a CI check that they match the database.
- **Content-Security-Policy** on every page (see ADR 0003 for the trade-off).

## Tests actually run (all in this workspace)

| Check                            | Result                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Type check, lint, formatting     | Pass, 0 warnings                                                                                |
| Unit tests                       | 16 / 16 pass (env checks, content allow-list, word counts in English, Malayalam and Hindi)      |
| Database security tests          | 35 / 35 pass, on both a clean and a used database. Breaking one rule on purpose made them fail. |
| Production build                 | Pass                                                                                            |
| Bundle secret scan               | Pass                                                                                            |
| Browser tests, desktop and phone | 26 / 26 pass, **twice in a row, no retries**                                                    |

The browser tests cover:

- Signed-out visitors are redirected to sign-in, then returned to where they were going.
- Malayalam title and text (including conjuncts like ക്ഷ, ജ്ഞ, സ്ത്ര) save and reload exactly.
- **User B cannot see user A's draft,** by direct link to the work or the part, or in their own list.
- Text written offline is saved when the connection returns.
- Unsaved text survives the tab closing while offline, and is restored on the next visit.
- Two tabs on the same part produce a conflict choice, never a silent overwrite.
- Sign-out removes local copies, and the studio is locked again.
- Work details can be edited, and the work deleted.

## Not done or not verified

- **The GitHub Actions workflow has still never run on GitHub** (no repository yet).
- **Google sign-in** is untested because it's switched off. It needs Google Cloud credentials set in Supabase.
- **Real email delivery** is untested. Locally, mail goes to a test mailbox. Production needs Resend (or similar) set up in Supabase.
- Images in the editor, links and comics pages are not built. Comics arrive in Phase 3.
- Accessibility was checked through the tests' use of labels and roles. No dedicated screen-reader or contrast audit yet.

## Remaining risks

- **Shared computers:** unsaved text stays in that browser until it saves or the writer signs out. This is accepted so that writing is never lost (ADR 0003).
- **Studio "not found" pages return HTTP 200, not 404,** because the pages stream. No content is exposed.
- Earlier risks are unchanged: Razorpay personal-PAN support and the CA review of the tax model.

## Next action

1. Owner of `adishsamrambham-design`: create the private `thaal` repository and give the Claude app access. I'll then push and confirm CI.
2. Phase 3: publishing (with the author-licence acceptance), book and chapter pages, author profiles, discovery, the online reader, previews and comics.
