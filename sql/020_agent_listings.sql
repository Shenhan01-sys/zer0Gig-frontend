-- Migration: 020 — Agent Listings (marketplace order book)
-- Date: 2026-05-12
-- Purpose: Off-chain order book for AgentMarketplace.sol. Sellers post
--          listings here; buyers read this feed to find agents for sale.
--          On-chain settlement happens via AgentMarketplace.buyAgent +
--          AgentRegistry.iTransfer / iClone.

create table if not exists public.agent_listings (
  id                uuid          primary key default gen_random_uuid(),
  created_at        timestamptz   not null    default now(),
  updated_at        timestamptz   not null    default now(),

  agent_id          bigint        not null,
  seller_address    text          not null,
  price_wei         text          not null,      -- uint96 stored as decimal text
  price_og          numeric(20, 6) not null,     -- denormalized for sorting/filter UX
  mode              text          not null,      -- 'transfer' | 'clone'
  status            text          not null default 'active',

  title             text,
  description       text,
  terms_url         text,
  terms_hash        text,
  seller_signature  text,         -- EIP-712 sig from seller (optional V1)
  expires_at        timestamptz,

  -- Agent state snapshot at listing time
  agent_name        text,
  agent_score_bps   integer,
  agent_jobs_done   integer,
  agent_skills      text[],

  -- Sale completion (populated when on-chain settlement happens)
  order_id          bigint,
  buyer_address     text,
  sold_at           timestamptz,
  final_agent_id    bigint,

  metadata          jsonb         not null default '{}'::jsonb,

  constraint agent_listings_mode_check    check (mode in ('transfer', 'clone')),
  constraint agent_listings_status_check  check (status in ('active', 'pending', 'sold', 'cancelled', 'expired'))
);

create index if not exists agent_listings_status_idx   on public.agent_listings (status);
create index if not exists agent_listings_agent_idx    on public.agent_listings (agent_id);
create index if not exists agent_listings_seller_idx   on public.agent_listings (seller_address);
create index if not exists agent_listings_price_idx    on public.agent_listings (price_og);
create index if not exists agent_listings_created_idx  on public.agent_listings (created_at desc);

alter table public.agent_listings enable row level security;

drop policy if exists "agent_listings_public_read" on public.agent_listings;
create policy "agent_listings_public_read"
  on public.agent_listings
  for select
  to anon, authenticated
  using (status in ('active', 'pending', 'sold'));

grant select on public.agent_listings to anon, authenticated;

create or replace view public.agent_listings_active as
select id, agent_id, seller_address, price_wei, price_og, mode,
       title, description, agent_name, agent_score_bps, agent_jobs_done, agent_skills,
       created_at, expires_at
from public.agent_listings
where status = 'active'
order by created_at desc;

grant select on public.agent_listings_active to anon, authenticated;
