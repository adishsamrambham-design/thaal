# ADR 0003 — Accounts and private writing (Phase 2)

**Status:** Accepted · 2026-10-13

## Sign-in: emailed 6-digit code, Google later

Writers enter their email and type the 6-digit code they receive. The same email also has a one-tap link. There are no passwords to leak or forget. The code works well on phones, where a link may open in a different browser from the one the writer started in. "Continue with Google" is built but switched off (`NEXT_PUBLIC_GOOGLE_SIGN_IN=off`) until Google sign-in is set up in the Supabase dashboard with Google Cloud credentials.

## Where security is enforced

1. **Database (the real lock).** Row Level Security plus column permissions. Each person reads and changes only their own profile, works, chapters and history. Signed-out visitors have no access to these tables at all. Authors can't write `owner_id`, `status`, `version` or timestamps directly. Tested by `supabase/tests/10_private_drafts.test.sql` (34 checks as author A, user B and a signed-out visitor). Breaking one rule on purpose was confirmed to fail the tests.
2. **Server.** Every page and server action checks the session again. All database reads run as the user, never with the secret key.
3. **Proxy.** It refreshes the session cookie and sends signed-out visitors to sign-in. This is a convenience only, not a security boundary.

## Publishing is impossible for now

The `status` column exists, but no one can set it to `published`. Phase 3 adds a publish function that records acceptance of the author licence.

## Saving: optimistic locking, local safety net, periodic history

- **`save_chapter(id, expected_version, …)`** saves only if no one else has saved since. Otherwise it reports a conflict, and the writer chooses "Keep my version" or "Load the other version". Two tabs can never silently overwrite each other.
- **Unsaved text is copied to the browser** (`localStorage`) until the server confirms the save. It survives a closed tab, a crash or a lost connection, and is restored on the next visit. These copies are deleted on successful save and on sign-out.
  - **Trade-off:** on a shared computer, unsaved text sits in that browser until the next save or sign-out. We accept this because losing a writer's work is worse. The sign-out wipe limits it.
- **History:** a snapshot is taken at most every 10 minutes while writing, and the 30 most recent are kept per chapter. Any of them can be restored.
- **Retries:** after a failed save it retries after 2 s, 4 s, 8 s and so on up to 30 s, and immediately when the browser comes back online.

## Content: structured JSON with an allow-list

The editor (Tiptap) produces a JSON document. The server accepts only paragraphs, headings (levels 1–3), quotes, lists, line breaks, dividers and bold, italic, underline or strike text, and strips any other attributes. **No HTML is stored, and links and images are refused** for now. The database also rejects anything that isn't a document, and anything over 2 MB. Word counts use the language's own word rules, so Malayalam and other Indic scripts count correctly.

## Content-Security-Policy without nonces

A nonce-based CSP would force every page to render per request, which turns off the fast static pages (the Next.js docs state this is incompatible with partial prerendering). We use a CSP that allows only our own scripts plus Next's inline bootstrap (`'unsafe-inline'`). It blocks all third-party scripts, frames, plugins, form targets and outside network calls (only our site and our Supabase project). Since no user HTML is ever rendered, the main injection route is closed at the content layer. We'll revisit Next's hash-based CSP option when it leaves experimental status.

## Studio pages stream

Studio pages show their frame instantly and stream the private part. A visitor who opens someone else's draft sees the not-found page with none of the content. The HTTP status code is 200 rather than 404, because streaming has already started by the time the database says "not yours". This is expected behaviour for streamed pages. Those pages are also marked `noindex`.

## Local email

Local development uses Supabase's test mailbox (http://127.0.0.1:54324). The end-to-end tests read sign-in codes from it. Local sign-in rate limits are raised for testing. **Production limits are set separately in the Supabase dashboard,** and a real email provider (Resend) is connected before launch.
