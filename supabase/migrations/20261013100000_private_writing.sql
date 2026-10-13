-- Phase 2: accounts and private writing.
--
-- Security model (plain English):
--   * Every row has an owner. Row Level Security lets people see and change only their own rows.
--   * Signed-out visitors (the `anon` role) get no access to any of these tables at all.
--   * Columns that must not be set by the app directly (owner, status, version, timestamps)
--     are protected with column-level permissions and triggers, not just by the UI.
--   * Publishing does not exist yet. `status` can only be 'draft' until Phase 3 adds a
--     publish function with licence acceptance.

-- ─────────────────────────────────────────────────────────────── types
create type public.work_type as enum ('novel', 'short_story', 'poem', 'serial', 'comic');
create type public.work_status as enum ('draft', 'published', 'unpublished');

-- Languages a work can be written in (BCP-47 primary tags). Extend with a migration.
create domain public.content_language as text
  check (value in ('en', 'ml', 'hi', 'ta', 'te', 'kn', 'bn'));

-- ─────────────────────────────────────────────────────────────── helpers
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────── profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per account. Private in Phase 2; public author pages come in Phase 3.';

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Writer'), 80)
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles: owner can read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: owner can update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- ─────────────────────────────────────────────────────────────── works
create table public.works (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  type public.work_type not null,
  language public.content_language not null,
  status public.work_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index works_owner_idx on public.works (owner_id, updated_at desc);

create trigger works_touch before update on public.works
  for each row execute function public.touch_updated_at();

alter table public.works enable row level security;

create policy "works: owner can read" on public.works
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "works: owner can create drafts" on public.works
  for insert to authenticated with check (owner_id = (select auth.uid()) and status = 'draft');
create policy "works: owner can update" on public.works
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "works: owner can delete" on public.works
  for delete to authenticated using (owner_id = (select auth.uid()));

revoke all on public.works from anon, authenticated;
grant select, delete on public.works to authenticated;
-- No owner_id or status here: owner comes from the session, status changes only via Phase 3 publish.
-- id may be supplied so the app can create items idempotently (safe retries).
grant insert (id, title, type, language) on public.works to authenticated;
grant update (title, type, language) on public.works to authenticated;

-- ─────────────────────────────────────────────────────────────── chapters
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works (id) on delete cascade,
  -- Copied from the work so security checks are one simple comparison.
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null default '' check (char_length(title) <= 200),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb
    check (jsonb_typeof(content) = 'object' and content ->> 'type' = 'doc')
    check (pg_column_size(content) <= 2000000),
  word_count integer not null default 0 check (word_count >= 0),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (work_id, position) deferrable initially immediate
);
create index chapters_work_idx on public.chapters (work_id, position);

-- The chapter's owner must be the work's owner, whatever the app sends.
create or replace function public.chapters_enforce_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  work_owner uuid;
begin
  select w.owner_id into work_owner from public.works w where w.id = new.work_id;
  if work_owner is null or work_owner <> new.owner_id then
    raise exception 'chapter owner must match work owner' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger chapters_owner_check before insert or update of work_id, owner_id on public.chapters
  for each row execute function public.chapters_enforce_owner();

-- Every content/title change bumps the version; the app can't set it.
create or replace function public.chapters_bump_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.content is distinct from old.content or new.title is distinct from old.title then
    new.version := old.version + 1;
  else
    new.version := old.version;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger chapters_version before update on public.chapters
  for each row execute function public.chapters_bump_version();

-- Touch the parent work so "recently edited" ordering works.
-- Security definer because authors may not write works.updated_at directly; it only ever
-- touches the timestamp of the work the (already permission-checked) chapter belongs to.
create or replace function public.chapters_touch_work()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.works set updated_at = now() where id = coalesce(new.work_id, old.work_id);
  return null;
end;
$$;

create trigger chapters_touch_work after insert or update or delete on public.chapters
  for each row execute function public.chapters_touch_work();

alter table public.chapters enable row level security;

create policy "chapters: owner can read" on public.chapters
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "chapters: owner can create" on public.chapters
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "chapters: owner can update" on public.chapters
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "chapters: owner can delete" on public.chapters
  for delete to authenticated using (owner_id = (select auth.uid()));

revoke all on public.chapters from anon, authenticated;
grant select, delete on public.chapters to authenticated;
grant insert (id, work_id, position, title) on public.chapters to authenticated;
grant update (position, title, content, word_count) on public.chapters to authenticated;

-- ─────────────────────────────────────────────────────────────── version history
create table public.chapter_versions (
  id bigint generated always as identity primary key,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  version integer not null,
  title text not null,
  content jsonb not null,
  word_count integer not null,
  created_at timestamptz not null default now()
);
create index chapter_versions_chapter_idx on public.chapter_versions (chapter_id, created_at desc);

alter table public.chapter_versions enable row level security;

create policy "chapter_versions: owner can read" on public.chapter_versions
  for select to authenticated using (owner_id = (select auth.uid()));

-- Nobody writes snapshots directly; only save_chapter() does.
revoke all on public.chapter_versions from anon, authenticated;
grant select on public.chapter_versions to authenticated;

-- ─────────────────────────────────────────────────────────────── save_chapter
-- Saves a chapter only if nobody else saved it in the meantime (optimistic locking).
-- Returns the new version. Raises 'P0001 conflict' if the expected version is stale.
-- Keeps a snapshot at most every 10 minutes, and the 30 most recent snapshots per chapter.
create or replace function public.save_chapter(
  p_chapter_id uuid,
  p_expected_version integer,
  p_title text,
  p_content jsonb,
  p_word_count integer
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_version integer;
  current_version integer;
  last_snapshot timestamptz;
begin
  update public.chapters
     set title = p_title, content = p_content, word_count = p_word_count
   where id = p_chapter_id and version = p_expected_version
  returning version into new_version;

  if new_version is null then
    select c.version into current_version from public.chapters c where c.id = p_chapter_id;
    if current_version is null then
      raise exception 'not found' using errcode = 'P0002';
    end if;
    raise exception 'conflict' using errcode = 'P0001', detail = current_version::text;
  end if;

  select max(v.created_at) into last_snapshot from public.chapter_versions v where v.chapter_id = p_chapter_id;
  if last_snapshot is null or last_snapshot < now() - interval '10 minutes' then
    perform public.snapshot_chapter(p_chapter_id);
  end if;

  return new_version;
end;
$$;

-- Internal: writes a snapshot. Runs with owner rights but re-checks the caller owns the chapter.
create or replace function public.snapshot_chapter(p_chapter_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.chapter_versions (chapter_id, owner_id, version, title, content, word_count)
  select c.id, c.owner_id, c.version, c.title, c.content, c.word_count
    from public.chapters c
   where c.id = p_chapter_id and c.owner_id = (select auth.uid());

  delete from public.chapter_versions v
   where v.chapter_id = p_chapter_id
     and v.id not in (
       select v2.id from public.chapter_versions v2
        where v2.chapter_id = p_chapter_id
        order by v2.created_at desc, v2.id desc
        limit 30
     );
end;
$$;

revoke all on function public.save_chapter(uuid, integer, text, jsonb, integer) from public, anon;
grant execute on function public.save_chapter(uuid, integer, text, jsonb, integer) to authenticated;
revoke all on function public.snapshot_chapter(uuid) from public, anon;
grant execute on function public.snapshot_chapter(uuid) to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.chapters_touch_work() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────── private file storage
-- Files live under a folder named after the owner's user id: <user-id>/<anything>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('draft-media', 'draft-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "draft-media: owner can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'draft-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "draft-media: owner can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'draft-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "draft-media: owner can update" on storage.objects
  for update to authenticated
  using (bucket_id = 'draft-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "draft-media: owner can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'draft-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
