"use client";

import React from "react";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import SkillConfigModal from "@/components/SkillConfigModal";
import { Search, Globe, Github, Terminal, Send, BarChart3, FileText, Palette, Database, MessageCircle, Settings, Zap, Link2 } from "lucide-react";

// -- Types ---------------------------------------------------------------------

export interface PlatformSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
  is_verified: boolean;
  tool_type: string;
  config_schema: Record<string, unknown>;
  metadata: { tags?: string[]; docsUrl?: string };
}

interface PreBuiltToolsGridProps {
  selectedSkills: string[];
  skillConfigs: Record<string, Record<string, string>>;
  onToggle: (skillId: string) => void;
  onConfigSave: (skillId: string, config: Record<string, string>) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  data:          "Data & Research",
  code:          "Code & Compute",
  communication: "Communication",
  media:         "Media & Files",
  storage:       "Storage & DB",
  automation:    "Automation",
};

function hasConfigFields(schema: Record<string, unknown>): boolean {
  const props = schema?.properties as Record<string, unknown> | undefined;
  return !!props && Object.keys(props).length > 0;
}

// Fallback hardcoded skills if Supabase is unavailable
// NOTE: Only skills with is_verified=true or those with a working backend handler are shown.
// Stubs (is_verified=false with no handler) are kept in code but hidden from UI.
const FALLBACK_SKILLS: PlatformSkill[] = [
  { id: "web_search",      name: "Web Search",      description: "Search the web for real-time information",                              category: "data",          icon: "web_search", is_active: true, is_verified: true,  tool_type: "builtin", config_schema: { properties: { apiKey: { type: "string", title: "Serper.dev API Key", description: "Get a free key at serper.dev" }, maxResults: { type: "number", title: "Max Results", default: 5 } } }, metadata: {} },
  { id: "http_fetch",       name: "HTTP Fetch",       description: "Call any public or private API endpoint from agent workflow",             category: "data",          icon: "http_fetch", is_active: true, is_verified: true,  tool_type: "builtin", config_schema: { properties: { url: { type: "string", title: "Base URL", description: "e.g. https://api.example.com/endpoint" }, method: { type: "string", title: "Method", description: "GET, POST, PUT, DELETE" } } }, metadata: {} },
  { id: "github_reader",   name: "GitHub Reader",    description: "Read files, repos, and issues from GitHub",                            category: "code",          icon: "github_reader", is_active: true, is_verified: true,  tool_type: "builtin", config_schema: { properties: { token: { type: "string", title: "GitHub Token (optional)", description: "Increases API rate limit from 60 to 5000 req/hr" }, repo: { type: "string", title: "Default Repo (optional)", description: "e.g. owner/repo � can be overridden per-job" } } }, metadata: {} },
  { id: "code_exec",       name: "Code Executor",    description: "Run real Python/JS/Go/Rust  the agent thinks AND executes code",        category: "code",          icon: "code_exec", is_active: true, is_verified: true,  tool_type: "builtin", config_schema: { properties: { language: { type: "string", title: "Language", description: "python, javascript, typescript, ruby, go, rust, java, cpp, c, php, swift, kotlin" }, code: { type: "string", title: "Default Script (optional)", description: "Optional template code � agent can also generate code dynamically per job" } } }, metadata: {} },
  { id: "telegram_notify", name: "Telegram Notify",  description: "Agent sends milestone cards and approve buttons to your Telegram. Clients can also set up a 24/7 AI customer service bot per subscription.", category: "communication", icon: "telegram_notify", is_active: true, is_verified: true,  tool_type: "builtin", config_schema: { properties: { chatId: { type: "string", title: "Your Telegram Chat ID", description: "Auto-filled when you connect Telegram below. Used to receive milestone approval cards." } } }, metadata: {} },
  { id: "n8n_manager",    name: "n8n Workflow Manager", description: "Autonomously design, create, activate, execute, and maintain n8n workflows — the agent generates workflow JSON and deploys it to your n8n instance.", category: "automation", icon: "n8n_manager", is_active: true, is_verified: true, tool_type: "builtin", config_schema: { type: "object", properties: { n8nUrl: { type: "string", title: "n8n Instance URL", description: "e.g. https://your-n8n.app.n8n.cloud", order: 1 }, apiKey: { type: "string", title: "n8n API Key", description: "Settings → API → Create API key", order: 2 } }, required: ["n8nUrl", "apiKey"] }, metadata: {} },
  { id: "n8n_webhook",    name: "n8n Webhook Trigger",  description: "Trigger any existing n8n workflow via webhook URL. Agent sends the job brief to your workflow and receives the output, including file URLs.", category: "automation", icon: "n8n_webhook", is_active: true, is_verified: true, tool_type: "builtin", config_schema: { type: "object", properties: { webhookUrl: { type: "string", title: "Webhook URL", description: "n8n workflow → Webhook trigger node → copy URL", order: 1 }, apiKey: { type: "string", title: "API Key (optional)", description: "Only if your n8n uses header auth", order: 2 } }, required: ["webhookUrl"] }, metadata: {} },
  // -- Hidden stubs (is_verified=false, no working handler) ----------------------
  { id: "csv_analyst",     name: "CSV Analyst",      description: "Parse and analyze CSV datasets",                                      category: "data",          icon: "csv_analyst", is_active: true, is_verified: false, tool_type: "http",    config_schema: {}, metadata: {} },
  { id: "pdf_reader",      name: "PDF Reader",       description: "Extract text from PDF documents",                                     category: "media",         icon: "pdf_reader", is_active: true, is_verified: false, tool_type: "http",    config_schema: {}, metadata: {} },
  { id: "image_gen",       name: "Image Generation", description: "Generate images from text prompts via AI",                            category: "media",         icon: "image_gen", is_active: true, is_verified: false, tool_type: "http",    config_schema: { properties: { apiKey: { type: "string", title: "Image Gen API Key" } } }, metadata: {} },
  { id: "sql_query",       name: "SQL Query",        description: "Run read-only SQL queries against a connected DB",                     category: "storage",       icon: "sql_query", is_active: true, is_verified: false, tool_type: "http",    config_schema: { properties: { connectionUrl: { type: "string", title: "Database Connection URL" } } }, metadata: {} },
  { id: "whatsapp_notify", name: "WhatsApp Notify",  description: "Send milestone updates via WhatsApp (Meta Cloud API)",                 category: "communication", icon: "whatsapp_notify", is_active: true, is_verified: false, tool_type: "http",    config_schema: { properties: { accessToken: { type: "string", title: "Meta Access Token" }, phoneNumberId: { type: "string", title: "Phone Number ID" } } }, metadata: {} },
];

// Skills that are stubs � hide from UI but keep in code for future implementation
const HIDDEN_SKILLS = new Set(["whatsapp_notify", "sql_query", "csv_analyst", "pdf_reader", "image_gen"]);

function getSkillIcon(skillId: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    web_search:      <Search size={18} />,
    http_fetch:      <Globe size={18} />,
    github_reader:   <Github size={18} />,
    code_exec:       <Terminal size={18} />,
    telegram_notify: <Send size={18} />,
    csv_analyst:     <BarChart3 size={18} />,
    pdf_reader:      <FileText size={18} />,
    image_gen:       <Palette size={18} />,
    sql_query:       <Database size={18} />,
    whatsapp_notify: <MessageCircle size={18} />,
    n8n_manager:     <Zap size={18} />,
    n8n_webhook:     <Link2 size={18} />,
  };
  return icons[skillId] ?? <Search size={18} />;
}

// -- Component -----------------------------------------------------------------

export default function PreBuiltToolsGrid({ selectedSkills, skillConfigs, onToggle, onConfigSave }: PreBuiltToolsGridProps) {
  const [skills, setSkills]               = useState<PlatformSkill[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [configuringSkill, setConfiguringSkill] = useState<PlatformSkill | null>(null);

  useEffect(() => {
    supabase
      .from("skills")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .then(({ data, error }) => {
        setSkills(error || !data?.length ? FALLBACK_SKILLS : data as PlatformSkill[]);
        setLoading(false);
      });
  }, []);

  const visibleSkills = skills.filter(s => !HIDDEN_SKILLS.has(s.id));
  const categories = ["all", ...Array.from(new Set(visibleSkills.map(s => s.category)))];
  const filtered   = activeCategory === "all" ? visibleSkills : visibleSkills.filter(s => s.category === activeCategory);

  function handleCardClick(skill: PlatformSkill) {
    const isSelected = selectedSkills.includes(skill.id);
    if (isSelected) {
      // Deselect � no modal needed
      onToggle(skill.id);
    } else {
      // Selecting � show config modal if the skill needs config
      if (hasConfigFields(skill.config_schema)) {
        setConfiguringSkill(skill);
      } else {
        onToggle(skill.id);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-white/30 text-[12px]">
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading skills catalog�
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                activeCategory === cat
                  ? "border-white/25 bg-white/[0.1] text-white"
                  : "border-white/[0.08] text-white/35 hover:border-white/18 hover:text-white/55"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        {/* Skill cards */}
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(skill => {
            const isSelected = selectedSkills.includes(skill.id);
            const isConfigured = !!skillConfigs[skill.id] && Object.keys(skillConfigs[skill.id]).length > 0;
            const needsConfig  = hasConfigFields(skill.config_schema);

            return (
              <button
                key={skill.id}
                onClick={() => handleCardClick(skill)}
                className={`relative text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "border-white/20 bg-white/[0.07]"
                    : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.13] hover:bg-white/[0.04]"
                }`}
              >
                {/* Verified badge */}
                {skill.is_verified && !isSelected && (
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.07] text-white/40 border border-white/[0.1] font-medium">
                    Official
                  </span>
                )}

                {/* Config needed indicator */}
                {isSelected && needsConfig && !isConfigured && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-900/60 text-amber-200 border border-amber-700/40 font-medium">
                    Config <Settings size={10} />
                  </span>
                )}
                {isSelected && isConfigured && (
                  <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 font-medium">
                    Configured ✓
                  </span>
                )}

                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 ${isSelected ? "text-white/70" : "text-white/40"}`}>{getSkillIcon(skill.id)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-semibold truncate ${isSelected ? "text-white/90" : "text-white/70"}`}>
                      {skill.name}
                    </p>
                    <p className="text-[10px] text-white/30 line-clamp-2 mt-0.5 leading-relaxed">
                      {skill.description}
                    </p>
                  </div>
                </div>

                {/* Configure link (shown on selected skills that need + have config) */}
                {isSelected && needsConfig && (
                  <button
                    onClick={e => { e.stopPropagation(); setConfiguringSkill(skill); }}
                    className="mt-2 text-[10px] text-white/35 hover:text-white/65 transition-colors flex items-center gap-1"
                  >
                    <Settings size={11} /> Edit config
                  </button>
                )}

                {/* Selected checkmark */}
                {isSelected && !needsConfig && (
                  <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedSkills.length > 0 && (
          <p className="text-[11px] text-white/35">
            {selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} selected — agent will use these during job execution
          </p>
        )}
      </div>

      {/* Config modal */}
      <AnimatePresence>
        {configuringSkill && (
          <SkillConfigModal
            key={configuringSkill.id}
            skill={configuringSkill}
            existingConfig={skillConfigs[configuringSkill.id] || {}}
            onSave={(skillId, config) => {
              onConfigSave(skillId, config);
              if (!selectedSkills.includes(skillId)) onToggle(skillId);
            }}
            onClose={() => setConfiguringSkill(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}


