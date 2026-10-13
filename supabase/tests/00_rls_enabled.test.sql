-- Guard rail: every table in the public schema must have Row Level Security switched on.
-- If someone adds a table and forgets, this test fails and CI blocks the change.
begin;
select plan(1);

select is(
  (
    select coalesce(array_agg(c.relname::text order by c.relname), '{}')
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  ),
  '{}'::text[],
  'All public tables have Row Level Security enabled'
);

select * from finish();
rollback;
