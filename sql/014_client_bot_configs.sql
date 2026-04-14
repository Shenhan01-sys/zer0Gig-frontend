-- 014_client_bot_configs.sql
-- Stores per-subscription Telegram bot tokens provided by clients
-- for the Customer Service Bot feature.

create table if not exists public.client_bot_configs (
  subscription_id  bigint       primary key,
  client_address   text         not null,
  bot_token        text         not null,
  allowed_chats    text[]       not null default '{}',
  updated_at       timestamptz  not null default now()
);

-- Only the service role (backend) reads/writes this table.
-- The anon / authenticated roles never touch it directly.
alter table public.client_bot_configs enable row level security;

-- No public policies — all access goes through /api/client-bot-config
-- which uses SUPABASE_SERVICE_ROLE_KEY.
