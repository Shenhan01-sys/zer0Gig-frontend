-- 015_agent_kv_index.sql
-- Fallback layer for 0G KV Node used by the agent-runtime.
-- The PRIMARY KV layer is 0G Storage (log layer + 0G KV Node); this table
-- only stores small key→value pointers so cross-restart reads resolve
-- reliably while the 0G KV Node is syncing or unavailable.
--
-- Actual agent memory content (learnings, conversation summaries) still
-- lives on 0G Storage — only the pointers are mirrored here.

CREATE TABLE IF NOT EXISTS public.agent_kv_index (
  stream_id   TEXT NOT NULL,
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (stream_id, key)
);

-- Index for faster lookups by stream alone (e.g., listing all keys for an agent)
CREATE INDEX IF NOT EXISTS agent_kv_index_stream_idx ON public.agent_kv_index (stream_id);

-- Enable RLS — only service role can access.
-- The agent-runtime writes with SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- No public policies — keeps KV pointer lookups server-side only.
ALTER TABLE public.agent_kv_index ENABLE ROW LEVEL SECURITY;
