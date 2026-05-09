"use client";

/**
 * FullStackLive — proof that all four 0G stack layers are wired up and
 * running, not aspirational. Each layer card shows the concrete on-chain
 * artifact (txSeq, providerId, chainId) so the claim is verifiable.
 *
 * Aesthetic: aligned with AgentCapabilities — bg-[#032A3D]/80 cards,
 * BorderBeam on hover (per-layer accent), shared SectionLabel header.
 * Unique to this section: emerald LIVE pulse chip + per-layer LIVE dot,
 * monospace on-chain proof labels (txSeq, providerId, chainId).
 */

import { motion } from "framer-motion";
import { Cpu, Database, KeyRound, Link as LinkIcon } from "lucide-react";
import HoverRevealCTA from "./ui/HoverRevealCTA";

// Live pulse chip — kept emerald to signal "running right now"
// (shared canonical SectionLabel pattern lives in AgentCapabilities;
//  this section uses the live-pulse variant in its header)
function LivePulseChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] text-[11px] text-emerald-400 uppercase tracking-widest font-medium">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
      </span>
      {children}
    </span>
  );
}

const LAYERS = [
  {
    id: "compute",
    Icon: Cpu,
    accent: "#47A9CF",
    label: "0G Compute",
    title: "qwen-2.5-7b inference",
    proof: "provider 0xa48f0128…",
    detail: "Ledger funded · Decentralized inference · Per-job billing",
  },
  {
    id: "storage",
    Icon: Database,
    accent: "#A6E0F4",
    label: "0G Storage",
    title: "Outputs hashed on-chain",
    proof: "txSeq 94301",
    detail: "Merkle-rooted milestone deliverables · Censorship-resistant",
  },
  {
    id: "kv",
    Icon: KeyRound,
    accent: "#09799E",
    label: "0G KV Node",
    title: "3-layer agent memory",
    proof: "+ Supabase fallback",
    detail: "KV → Supabase → in-process · Cross-restart proven",
  },
  {
    id: "chain",
    Icon: LinkIcon,
    accent: "#10b981",
    label: "0G Newton Chain",
    title: "4 contracts deployed",
    proof: "chainId 16602",
    detail: "AgentRegistry · Escrow · Subscriptions · UserRegistry",
  },
] as const;

const PROOFS = [
  { value: "10+", label: "Jobs minted on-chain" },
  { value: "3",   label: "Subscriptions ticking 60s" },
  { value: "197", label: "Tests passing across 5 suites" },
  { value: "4",   label: "Contracts live on testnet" },
];

// ── Stack layer card ──────────────────────────────────────────────────────────
function LayerCard({
  layer,
  delay,
}: {
  layer: (typeof LAYERS)[number];
  delay: number;
}) {
  const Icon = layer.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className="group relative rounded-2xl border border-white/[0.08] bg-[#032A3D]/80 p-5 flex flex-col gap-4
                 hover:border-white/30 hover:-translate-y-0.5
                 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                 transition-all duration-300 ease-out overflow-hidden"
    >
      {/* Live pulse — kept as the unique signature element */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: layer.accent, boxShadow: `0 0 8px ${layer.accent}` }}
        />
        <span
          className="text-[9px] font-mono tracking-[0.15em] uppercase"
          style={{ color: `${layer.accent}cc` }}
        >
          LIVE
        </span>
      </div>

      {/* Icon — sits in a screen-within-screen surface */}
      <div className="rounded-xl border border-white/[0.06] bg-[#021F2E]/60 p-4 min-h-[88px] flex items-center justify-center overflow-hidden">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            background: `${layer.accent}14`,
            border: `1px solid ${layer.accent}30`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: layer.accent }} />
        </div>
      </div>

      {/* Text */}
      <div>
        <p
          className="text-[11px] font-mono uppercase tracking-[0.18em] mb-1.5"
          style={{ color: layer.accent }}
        >
          {layer.label}
        </p>
        <h3
          className="text-[15px] font-semibold text-white mb-3 leading-snug"
          style={{ textShadow: `0 0 20px ${layer.accent}44` }}
        >
          {layer.title}
        </h3>

        {/* Mono proof label — unique signature element */}
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-1.5 mb-3 inline-block">
          <span className="text-[11px] font-mono text-white/65">{layer.proof}</span>
        </div>

        <p className="text-[12px] text-white/40 leading-relaxed">{layer.detail}</p>

        {/* Hidden reveal CTA — slides up + fades in on hover */}
        <HoverRevealCTA
          className="mt-3"
          href="https://scan-testnet.0g.ai"
          label="Explorer"
          external
        />
      </div>
    </motion.div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function FullStackLive() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Subtle background glow — matched to AgentCapabilities */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#47A9CF]/[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <LivePulseChip>Full 0G Stack — Live</LivePulseChip>
          <h2
            className="text-3xl md:text-5xl font-medium tracking-tight mt-5 mb-4"
            style={{
              background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Every layer of 0G — proven on-chain, not promised
          </h2>
          <p className="text-[15px] text-white/45 max-w-2xl mx-auto leading-relaxed">
            Compute, Storage, KV, Chain — zer0Gig is the only project in the cohort with all four
            layers wired into a production code path you can verify yourself.
          </p>
        </motion.div>

        {/* Stack grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {LAYERS.map((layer, i) => (
            <LayerCard key={layer.id} layer={layer} delay={i * 0.08} />
          ))}
        </div>

        {/* Proof stat strip — same family card, gradient counters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="group relative rounded-2xl border border-white/[0.08] bg-[#032A3D]/80 p-6 md:p-8
                     hover:border-white/30 hover:-translate-y-0.5
                     hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                     transition-all duration-300 ease-out overflow-hidden"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            {PROOFS.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                className="text-center"
              >
                <div
                  className="text-3xl md:text-4xl font-medium tracking-tight tabular-nums"
                  style={{
                    background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {p.value}
                </div>
                <p className="text-[11px] text-white/40 mt-1.5 uppercase tracking-[0.12em]">
                  {p.label}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-white/[0.05] flex items-center justify-center gap-2 text-[11px] text-white/30">
            <span className="font-mono">scan-testnet.0g.ai</span>
            <span className="text-white/15">·</span>
            <span>verifiable on-chain</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
