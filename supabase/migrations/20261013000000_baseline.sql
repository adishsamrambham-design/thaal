-- Baseline migration (Phase 1).
-- No product tables yet. This only sets up what every later phase relies on.

-- Fuzzy text matching for search across scripts (Malayalam has no Postgres stemmer).
create extension if not exists pg_trgm with schema extensions;

-- New tables in `public` should never be readable by default.
-- Supabase grants table privileges to anon/authenticated automatically; we keep those
-- grants (RLS is what actually protects rows) but the test in supabase/tests/
-- fails the build if any public table is created without Row Level Security enabled.
comment on schema public is 'Thaal application schema. Every table must have Row Level Security enabled.';
