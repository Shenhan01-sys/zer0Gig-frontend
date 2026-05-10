-- Date Created: 2026-05-10
-- Date Modified: 2026-05-10
-- Migration 017: Skills catalog table + agent_skills junction + n8n/builtin skill seeds

-- Skills catalog
CREATE TABLE IF NOT EXISTS skills (
  id text PRIMARY KEY,  -- e.g. 'n8n_manager', 'web_search'
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'automation',
  icon text DEFAULT '🔧',
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  tool_name text NOT NULL DEFAULT 'builtin',  -- 'builtin' | 'http' | 'mcp'
  config_schema jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Agent-skill junction (which skills an agent has installed + their config)
CREATE TABLE IF NOT EXISTS agent_skills (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  agent_id bigint NOT NULL,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_skills_agent_id ON agent_skills(agent_id);

-- RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Public read agent_skills" ON agent_skills FOR SELECT USING (true);
CREATE POLICY "Service role all skills" ON skills USING (auth.role() = 'service_role');
CREATE POLICY "Service role all agent_skills" ON agent_skills USING (auth.role() = 'service_role');

-- Seed: n8n_manager
INSERT INTO skills (id, name, description, category, icon, is_verified, tool_name, config_schema) VALUES
('n8n_manager', 'n8n Workflow Manager',
 'Autonomously design, create, activate, execute, and maintain n8n workflows. The agent generates workflow JSON, deploys it to your n8n instance, and executes it — all without human involvement.',
 'automation', '⚡', true, 'builtin',
 '{"type":"object","properties":{"n8nUrl":{"type":"string","title":"n8n Instance URL","description":"e.g. https://your-n8n.app.n8n.cloud"},"apiKey":{"type":"string","title":"n8n API Key","description":"Settings → API → Create API key"}},"required":["n8nUrl","apiKey"]}')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, config_schema=EXCLUDED.config_schema;

-- Seed: n8n_webhook
INSERT INTO skills (id, name, description, category, icon, is_verified, tool_name, config_schema) VALUES
('n8n_webhook', 'n8n Webhook Trigger',
 'Trigger any existing n8n workflow via webhook URL. The agent sends the job brief to your workflow and receives the output — including file URLs (MP3, MP4, PDF).',
 'automation', '🔗', true, 'builtin',
 '{"type":"object","properties":{"webhookUrl":{"type":"string","title":"Webhook URL","description":"n8n workflow → Webhook trigger node → copy URL"},"apiKey":{"type":"string","title":"API Key (optional)","description":"Only if your n8n uses header auth"}},"required":["webhookUrl"]}')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, config_schema=EXCLUDED.config_schema;

-- Seed existing builtin skills too
INSERT INTO skills (id, name, description, category, icon, is_verified, tool_name, config_schema) VALUES
('web_search', 'Web Search', 'Search the web for real-time information using Serper.dev.', 'data', '🔍', true, 'builtin', '{"type":"object","properties":{"apiKey":{"type":"string","title":"Serper API Key"}}}'),
('email_send', 'Email Send', 'Send emails via SMTP (Gmail, Outlook, or custom).', 'communication', '📧', true, 'builtin', '{"type":"object","properties":{"smtpHost":{"type":"string","title":"SMTP Host"},"smtpPort":{"type":"number","title":"SMTP Port"},"user":{"type":"string","title":"Username"},"password":{"type":"string","title":"Password"},"from":{"type":"string","title":"From Address"},"to":{"type":"string","title":"To Address"}}}'),
('telegram_notify', 'Telegram Notify', 'Send Telegram messages and milestone notifications.', 'communication', '✈️', true, 'builtin', '{"type":"object","properties":{"botToken":{"type":"string","title":"Bot Token"},"chatId":{"type":"string","title":"Chat ID"}}}')
ON CONFLICT (id) DO NOTHING;
