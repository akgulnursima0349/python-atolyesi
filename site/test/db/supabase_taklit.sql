-- SADECE TEST: Supabase'in auth şemasını ve rollerini yerel Postgres'te taklit eder.
create schema if not exists extensions;
create schema if not exists auth;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
create table if not exists auth.users (id uuid primary key, is_anonymous boolean default false);
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
grant usage on schema auth, extensions, public to anon, authenticated;
grant execute on function auth.uid(), auth.jwt() to anon, authenticated;
