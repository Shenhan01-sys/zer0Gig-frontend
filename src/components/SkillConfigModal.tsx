"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { PlatformSkill } from "@/components/PreBuiltToolsGrid";

interface SkillConfigModalProps {
  skill: PlatformSkill;
  existingConfig: Record<string, string>;
  onSave: (skillId: string, config: Record<string, string>) => void;
  onClose: () => void;
}

/** Extract properties from a JSON Schema config_schema */
function getSchemaProps(schema: Record<string, unknown>) {
  const props = (schema?.properties as Record<string, { type?: string; title?: string; description?: string; default?: unknown; order?: number }>) || {};
  return Object.entries(props)
    .map(([key, def]) => ({
      key,
      title:       def.title       || key,
      description: def.description || "",
      type:        def.type        || "string",
      defaultVal:  def.default !== undefined ? String(def.default) : "",
      order:       def.order ?? 999,
    }))
    .sort((a, b) => a.order - b.order);
}

export default function SkillConfigModal({ skill, existingConfig, onSave, onClose }: SkillConfigModalProps) {
  const fields = getSchemaProps(skill.config_schema);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach(f => {
      init[f.key] = existingConfig[f.key] ?? f.defaultVal;
    });
    return init;
  });

  if (fields.length === 0) {
    // No config needed — save immediately and close
    onSave(skill.id, {});
    onClose();
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0d1525] p-6 shadow-2xl"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.8 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{skill.icon}</span>
            <div>
              <h3 className="text-white font-medium text-[15px]">{skill.name}</h3>
              <p className="text-white/40 text-[11px] mt-0.5">Configure skill settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* n8n setup guidance */}
        {skill.id.startsWith("n8n_") && (
          <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
            <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">Setup Guide</p>
            {skill.id === "n8n_manager" ? (
              <>
                <ol className="space-y-1.5 text-[11px] text-white/50 list-decimal list-inside">
                  <li>Open your n8n instance (or create a free cloud account at <span className="text-amber-400/80">app.n8n.cloud</span>)</li>
                  <li>Go to <span className="text-white/70">Settings → API</span> in the left sidebar</li>
                  <li>Click <span className="text-white/70">Create API Key</span> and copy it</li>
                  <li>Paste your instance URL and the API key below</li>
                </ol>
                <a
                  href={values["n8nUrl"] ? `${values["n8nUrl"].replace(/\/$/, "")}/settings/api` : "https://app.n8n.cloud"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  Open n8n Settings → API
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </>
            ) : (
              <>
                <ol className="space-y-1.5 text-[11px] text-white/50 list-decimal list-inside">
                  <li>Open your n8n workflow and add a <span className="text-white/70">Webhook</span> trigger node</li>
                  <li>Set the HTTP method to <span className="text-white/70">POST</span></li>
                  <li>Copy the <span className="text-white/70">Webhook URL</span> from the node panel</li>
                  <li>Activate the workflow, then paste the URL below</li>
                </ol>
                <a
                  href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  n8n Webhook node docs
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </>
            )}
          </div>
        )}

        {/* Fields */}
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-[12px] text-white/50 mb-1.5">
                {field.title}
              </label>
              {field.type === "number" ? (
                <input
                  type="number"
                  value={values[field.key]}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-white/25"
                />
              ) : field.key.toLowerCase().includes("key") || field.key.toLowerCase().includes("token") || field.key.toLowerCase().includes("secret") ? (
                <input
                  type="password"
                  value={values[field.key]}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25"
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key]}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-white/25"
                />
              )}
              {field.description && (
                <p className="text-[10px] text-white/25 mt-1">{field.description}</p>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-[13px] hover:border-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(skill.id, values); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.14] text-white/80 text-[13px] font-medium hover:bg-white/[0.11] hover:text-white transition-colors"
          >
            Save & Enable
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
