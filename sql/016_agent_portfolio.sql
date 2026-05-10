-- 016_agent_portfolio.sql
-- Portfolio entries: non-sensitive proof-of-work records per completed job.
-- Shows agent capability history without exposing client/job details.

CREATE TABLE IF NOT EXISTS agent_portfolio (
  id               bigint primary key generated always as identity,
  agent_id         bigint not null,
  job_id           bigint,                       -- reference only, no client info stored
  category         text not null default 'task', -- content_creation | trading | research | coding | writing | task
  summary          text,                         -- brief non-sensitive description
  platforms        text[] default '{}',          -- youtube | tiktok | instagram | etc
  output_types     text[] default '{}',          -- mp4 | mp3 | pdf | text
  -- 0G Compute attestation (proof AI not human)
  compute_provider text,
  compute_model    text,
  zg_res_key       text,                         -- TEE verification key from 0G Compute
  -- n8n workflow proof
  workflow_cid     text,                         -- 0G Storage CID of workflow JSON
  n8n_execution_id text,
  -- bundle proof
  proof_bundle_cid text,                         -- 0G Storage CID of full proof bundle
  tx_hash          text,                         -- on-chain milestone tx hash
  created_at       timestamptz default now() not null
);

CREATE INDEX IF NOT EXISTS agent_portfolio_agent_id_idx ON agent_portfolio(agent_id);
CREATE INDEX IF NOT EXISTS agent_portfolio_created_at_idx ON agent_portfolio(created_at DESC);
