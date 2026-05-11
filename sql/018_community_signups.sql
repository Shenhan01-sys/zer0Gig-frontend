-- Migration: 018 — Community Signups
-- Date: 2026-05-12
-- Purpose: Track public onboarding submissions for the landing-page globe
--          (name/initials, wallet, role, preferred 0G Compute model, country).

create table if not exists public.community_signups (
  id              uuid          primary key default gen_random_uuid(),
  created_at      timestamptz   not null    default now(),
  updated_at      timestamptz   not null    default now(),

  display_name    text          not null,
  wallet_address  text          not null,
  role            text          not null,
  preferred_model text          not null,
  country_code    text          not null,
  country_name    text          not null,
  latitude        numeric(9, 6) not null,
  longitude       numeric(9, 6) not null,

  metadata        jsonb         not null default '{}'::jsonb,

  constraint community_signups_wallet_unique unique (wallet_address),
  constraint community_signups_role_check    check (role in ('client', 'agent_owner')),
  constraint community_signups_country_code  check (char_length(country_code) = 2)
);

create index if not exists community_signups_country_idx on public.community_signups (country_code);
create index if not exists community_signups_role_idx    on public.community_signups (role);
create index if not exists community_signups_model_idx   on public.community_signups (preferred_model);

-- RLS
alter table public.community_signups enable row level security;

-- Public can read aggregated stats (handled via SQL views/RPC), but raw rows
-- are not exposed by the anon key. Service role bypasses RLS for writes/reads.
create policy if not exists "community_signups_no_anon_select"
  on public.community_signups
  for select
  to anon
  using (false);

-- Aggregated view (safe to expose to anon) — no PII
create or replace view public.community_stats as
select
  count(*)::int                         as total,
  count(distinct country_code)::int     as countries,
  count(*) filter (where role = 'client')::int       as clients,
  count(*) filter (where role = 'agent_owner')::int  as agent_owners,
  jsonb_object_agg(country_code, country_count)
    from (
      select country_code, count(*)::int as country_count
      from public.community_signups
      group by country_code
    ) c                                  as by_country,
  jsonb_object_agg(preferred_model, model_count)
    from (
      select preferred_model, count(*)::int as model_count
      from public.community_signups
      group by preferred_model
    ) m                                  as by_model
from public.community_signups;

-- Simpler: split into multiple views (the above embedded subqueries with
-- multiple aggregations require careful syntax). Use separate aggregations.
drop view if exists public.community_stats;

create or replace view public.community_stats as
select
  (select count(*)::int from public.community_signups)                                  as total,
  (select count(distinct country_code)::int from public.community_signups)              as countries,
  (select count(*)::int from public.community_signups where role = 'client')            as clients,
  (select count(*)::int from public.community_signups where role = 'agent_owner')       as agent_owners;

create or replace view public.community_by_country as
select
  country_code,
  country_name,
  latitude,
  longitude,
  count(*)::int as signup_count
from public.community_signups
group by country_code, country_name, latitude, longitude
order by signup_count desc;

create or replace view public.community_by_model as
select
  preferred_model,
  count(*)::int as signup_count
from public.community_signups
group by preferred_model
order by signup_count desc;

-- Public read access for views (aggregated, no PII)
grant select on public.community_stats      to anon, authenticated;
grant select on public.community_by_country to anon, authenticated;
grant select on public.community_by_model   to anon, authenticated;
