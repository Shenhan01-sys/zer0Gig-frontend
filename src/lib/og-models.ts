// ─────────────────────────────────────────────────────────────────────────────
// 0G Compute Network — Available Models
// Sources:
//   https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference
//   https://compute-marketplace.0g.ai/inference
//   https://0g.ai/blog/testnet-annoucement
//
// The provider/model catalog on 0G Compute is dynamic — providers join and
// leave, pricing is per-provider. This file is the curated list of well-known
// models we surface in the onboarding model picker. Treat this as the source
// of truth for the picker UI; query `broker.inference.listService()` on the
// server when you need live pricing/availability.
// ─────────────────────────────────────────────────────────────────────────────

export type OGModelTier = "frontier" | "balanced" | "fast" | "specialized";
export type OGModelKind = "llm" | "vision" | "audio";

export interface OGModel {
  id: string;            // Canonical model id used in API + DB
  name: string;          // Display name
  tier: OGModelTier;
  kind: OGModelKind;
  contextWindow: string; // Human-readable e.g. "32K tokens"
  network: "testnet" | "mainnet" | "both";
  description: string;
  bestFor: string;
  provider: string;      // Upstream provider name (Alibaba / OpenAI / Google / etc.)
  status: "live" | "coming_soon";
}

export const OG_MODELS: OGModel[] = [
  {
    id: "llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    tier: "frontier",
    kind: "llm",
    contextWindow: "128K tokens",
    network: "testnet",
    description: "Meta's flagship instruct-tuned model. Strong reasoning, code, multilingual.",
    bestFor: "Complex agents, long-context tasks, multilingual support",
    provider: "Meta (self-hosted on 0G)",
    status: "live",
  },
  {
    id: "deepseek-r1-70b",
    name: "DeepSeek R1 70B",
    tier: "frontier",
    kind: "llm",
    contextWindow: "64K tokens",
    network: "testnet",
    description: "Reasoning-optimized model with chain-of-thought baked in. Excels at multi-step problems.",
    bestFor: "Math, code, planning, research agents",
    provider: "DeepSeek (self-hosted on 0G)",
    status: "live",
  },
  {
    id: "qwen-2.5-7b",
    name: "Qwen 2.5 7B",
    tier: "balanced",
    kind: "llm",
    contextWindow: "32K tokens",
    network: "testnet",
    description: "Alibaba's general-purpose model. Default choice in zer0Gig's agent runtime.",
    bestFor: "Coding, reasoning, day-to-day agent work",
    provider: "Alibaba",
    status: "live",
  },
  {
    id: "gpt-oss-20b",
    name: "GPT-OSS 20B",
    tier: "balanced",
    kind: "llm",
    contextWindow: "8K tokens",
    network: "testnet",
    description: "Open-weights GPT alternative. Conversational, fast turn-around.",
    bestFor: "Customer service bots, conversational subscriptions",
    provider: "OpenAI-compatible",
    status: "live",
  },
  {
    id: "gemma-3-27b",
    name: "Gemma 3 27B",
    tier: "balanced",
    kind: "llm",
    contextWindow: "16K tokens",
    network: "testnet",
    description: "Google's open-weights model. Strong analytical reasoning.",
    bestFor: "Analysis, data extraction, document summarization",
    provider: "Google",
    status: "live",
  },
];

export function getModelById(id: string): OGModel | undefined {
  return OG_MODELS.find(m => m.id === id);
}

export const DEFAULT_MODEL_ID: string = "qwen-2.5-7b";
