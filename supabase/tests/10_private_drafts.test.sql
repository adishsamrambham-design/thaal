-- Private drafts must be invisible and untouchable to everyone except their author.
-- Runs as three people: author A, another signed-in user B, and a signed-out visitor.
begin;
select plan(34);

-- ── helpers ────────────────────────────────────────────────────────────────
create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.act_as_anon() returns void language sql as $$
  select set_config('role', 'anon', true),
         set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
$$;
create function pg_temp.act_as_admin() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

-- ── setup: two accounts ───────────────────────────────────────────────────
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.test', '{"full_name":"Author A"}', 'authenticated', 'authenticated'),
       ('bbbbbbbb-0000-0000-0000-000000000002', 'b@example.test', '{}', 'authenticated', 'authenticated');

select is((select count(*)::int from public.profiles
  where id in ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002')), 2,
  'sign-up creates a profile for each account');
select is((select display_name from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'b',
  'display name falls back to the email name');

-- ── author A writes a draft ────────────────────────────────────────────────
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000001');

select lives_ok($$ insert into public.works (id, title, type, language)
  values ('11111111-0000-0000-0000-000000000001', 'നിലാവ്', 'novel', 'ml') $$, 'A can create a work');
select is((select status::text from public.works where id = '11111111-0000-0000-0000-000000000001'), 'draft',
  'new works start as private drafts');
select is((select owner_id from public.works where id = '11111111-0000-0000-0000-000000000001'),
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'owner is taken from the session');

select lives_ok($$ insert into public.chapters (id, work_id, position, title)
  values ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 1, 'ഒന്ന്') $$,
  'A can add a chapter');

select is(public.save_chapter('22222222-0000-0000-0000-000000000001', 1, 'ഒന്ന്',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"നിലാവ് പെയ്തു"}]}]}', 2),
  2, 'saving bumps the version');
select is((select content #>> '{content,0,content,0,text}' from public.chapters where id = '22222222-0000-0000-0000-000000000001'),
  'നിലാവ് പെയ്തു', 'Malayalam text is stored exactly');
select throws_ok($$ select public.save_chapter('22222222-0000-0000-0000-000000000001', 1, 'x', '{"type":"doc"}', 0) $$,
  'P0001', 'conflict', 'a stale save is refused instead of overwriting newer text');
select is((select count(*)::int from public.chapter_versions), 1, 'first save keeps a history snapshot');
select is(public.save_chapter('22222222-0000-0000-0000-000000000001', 2, 'ഒന്ന്', '{"type":"doc","content":[]}', 0),
  3, 'second save works');
select is((select count(*)::int from public.chapter_versions), 1, 'snapshots are not taken on every keystroke');

select throws_ok($$ insert into public.works (title, type, language, status) values ('x', 'poem', 'en', 'published') $$,
  '42501', null, 'A cannot publish by writing the status column');
select throws_ok($$ update public.works set status = 'published' where id = '11111111-0000-0000-0000-000000000001' $$,
  '42501', null, 'A cannot publish by updating the status column');
select throws_ok($$ insert into public.works (owner_id, title, type, language)
  values ('bbbbbbbb-0000-0000-0000-000000000002', 'x', 'poem', 'en') $$,
  '42501', null, 'A cannot create a work in someone else''s name');
select throws_ok($$ insert into public.works (title, type, language) values ('x', 'poem', 'fr') $$,
  '23514', null, 'unsupported languages are rejected');
select throws_ok($$ update public.chapters set content = '{"type":"not-a-doc"}' where id = '22222222-0000-0000-0000-000000000001' $$,
  '23514', null, 'malformed content is rejected by the database');

-- A uploads a private image.
select lives_ok($$ insert into storage.objects (bucket_id, name, owner_id)
  values ('draft-media', 'aaaaaaaa-0000-0000-0000-000000000001/cover.png', 'aaaaaaaa-0000-0000-0000-000000000001') $$,
  'A can upload into their own folder');
select throws_ok($$ insert into storage.objects (bucket_id, name, owner_id)
  values ('draft-media', 'bbbbbbbb-0000-0000-0000-000000000002/x.png', 'aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', null, 'A cannot upload into someone else''s folder');

-- ── user B tries to reach A's draft ────────────────────────────────────────
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-000000000002');

select is_empty($$ select 1 from public.works $$, 'B cannot list A''s works');
select is_empty($$ select 1 from public.chapters $$, 'B cannot list A''s chapters');
select is_empty($$ select 1 from public.chapter_versions $$, 'B cannot read A''s history');
select is_empty($$ select 1 from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'B cannot read A''s private profile');
select is_empty($$ update public.works set title = 'stolen' where id = '11111111-0000-0000-0000-000000000001' returning 1 $$,
  'B cannot rename A''s work');
select is_empty($$ update public.chapters set content = '{"type":"doc","content":[]}'
  where id = '22222222-0000-0000-0000-000000000001' returning 1 $$, 'B cannot overwrite A''s chapter');
select is_empty($$ delete from public.works where id = '11111111-0000-0000-0000-000000000001' returning 1 $$,
  'B cannot delete A''s work');
select throws_ok($$ select public.save_chapter('22222222-0000-0000-0000-000000000001', 3, 'x', '{"type":"doc"}', 0) $$,
  'P0002', 'not found', 'B cannot save into A''s chapter, and learns nothing about it');
select throws_ok($$ insert into public.chapters (work_id, position) values ('11111111-0000-0000-0000-000000000001', 2) $$,
  '42501', null, 'B cannot add a chapter to A''s work');
select lives_ok($$ select public.snapshot_chapter('22222222-0000-0000-0000-000000000001') $$,
  'calling the snapshot function on A''s chapter does not error');
select is_empty($$ select 1 from storage.objects where bucket_id = 'draft-media' $$, 'B cannot see A''s uploaded files');

-- ── signed-out visitor ──────────────────────────────────────────────────────
select pg_temp.act_as_anon();
select throws_ok($$ select 1 from public.works $$, '42501', null, 'signed-out visitors cannot query works at all');
select throws_ok($$ select 1 from public.chapters $$, '42501', null, 'signed-out visitors cannot query chapters at all');

-- ── confirm A's data survived B's attempts ─────────────────────────────────
select pg_temp.act_as_admin();
select is((select title from public.works where id = '11111111-0000-0000-0000-000000000001'), 'നിലാവ്',
  'A''s work is unchanged');
select is((select count(*)::int from public.chapter_versions where chapter_id = '22222222-0000-0000-0000-000000000001'), 1,
  'B''s snapshot call created nothing');

select * from finish();
rollback;
