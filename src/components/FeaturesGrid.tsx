"use client";

import React from "react";
import { motion } from "framer-motion";
import HoverRevealCTA from "./ui/HoverRevealCTA";

// ── Reusable section label (canonical pattern shared with AgentCapabilities) ──
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[11px] text-white/40 uppercase tracking-widest font-medium">
      {children}
    </span>
  );
}

// ── Mini isometric math for card visualizations ─────────────────
const T = 18, Z = 12;
function iso(x: number, y: number, z: number) {
  return { sx: (x - y) * Math.cos(Math.PI / 6) * T, sy: (x + y) * Math.sin(Math.PI / 6) * T - z * Z };
}
interface Pt { x: number; y: number }
function mkCircle(ox: number, oy: number, r: number, n = 24): Pt[] {
  return Array.from({ length: n }, (_, i) => ({ x: ox + r * Math.cos(2 * Math.PI * i / n), y: oy + r * Math.sin(2 * Math.PI * i / n) }));
}
function mkGear(ox: number, oy: number, ri: number, ro: number, teeth: number): Pt[] {
  const pts: Pt[] = [];
  const s = Math.PI / teeth;
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? ro : ri;
    pts.push({ x: ox + r * Math.cos(i * s - s * 0.35), y: oy + r * Math.sin(i * s - s * 0.35) });
    pts.push({ x: ox + r * Math.cos(i * s + s * 0.35), y: oy + r * Math.sin(i * s + s * 0.35) });
  }
  return pts;
}
function mkRect(ox: number, oy: number, w: number, h: number): Pt[] {
  return [{ x: ox - w / 2, y: oy - h / 2 }, { x: ox + w / 2, y: oy - h / 2 }, { x: ox + w / 2, y: oy + h / 2 }, { x: ox - w / 2, y: oy + h / 2 }];
}
function mkPoly(ox: number, oy: number, r: number, sides: number): Pt[] { return mkCircle(ox, oy, r, sides); }

function Ext({ cx, cy, pts, z, h, color, glow }: { cx: number; cy: number; pts: Pt[]; z: number; h: number; color: string; glow?: boolean }) {
  const bot = pts.map(p => { const i = iso(p.x, p.y, z); return { sx: cx + i.sx, sy: cy + i.sy }; });
  const top = pts.map(p => { const i = iso(p.x, p.y, z + h); return { sx: cx + i.sx, sy: cy + i.sy }; });
  const faces: { d: number; s: string }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const n = (i + 1) % pts.length;
    faces.push({ d: (pts[i].x + pts[n].x) / 2 + (pts[i].y + pts[n].y) / 2, s: [bot[i], bot[n], top[n], top[i]].map(p => `${p.sx},${p.sy}`).join(" ") });
  }
  faces.sort((a, b) => a.d - b.d);
  const tp = top.map(p => `${p.sx},${p.sy}`).join(" ");
  return (
    <g>
      {faces.map((f, i) => <polygon key={i} points={f.s} fill={color} fillOpacity={0.15} stroke={color} strokeWidth="0.5" strokeOpacity={0.4} strokeLinejoin="round" />)}
      <polygon points={tp} fill={color} fillOpacity={0.25} stroke={color} strokeWidth="0.7" strokeOpacity={0.6} strokeLinejoin="round"
        filter={glow ? `drop-shadow(0 0 8px ${color}66)` : "none"} />
    </g>
  );
}

// ── CSS animation styles ────────────────────────────────────────
const animStyles = `
@keyframes cardFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
@keyframes cardFloatFast { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
@keyframes cardPiston { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
@keyframes cardSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes cardPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.9; } }
.float-s { animation: cardFloat 3s ease-in-out infinite; }
.float-f { animation: cardFloatFast 1.8s ease-in-out infinite; }
.piston-a { animation: cardPiston 1.2s ease-in-out infinite; }
.pulse-a { animation: cardPulse 2s ease-in-out infinite; }
`;

// ── Feature data with unique 3D renders ─────────────────────────
// Trimmed from 9 → 4 strongest differentiators. Removed: ECIES Briefs,
// 3-Layer Memory, Self-Evaluation Loop, 0G Compute, 0G Storage —
// those technical details are covered elsewhere (FullStackLive,
// AgentCapabilities). FeaturesGrid now leads with the four standards
// + product primitives that uniquely define zer0Gig.
const features = [
  {
    title: "Agent ID (ERC-7857 iNFT)",
    description: "Every agent is an Intelligent NFT with encrypted capability data, oracle-verified iTransfer / iClone, and time-bounded authorizeUsage permissions.",
    accent: "#09799E",
    deep: "#021F2E",
    pattern: "grid",
    render: (cx: number, cy: number) => {
      const sats = mkCircle(0, 0, 3.5, 5).sort((a, b) => (a.x + a.y) - (b.x + b.y));
      return (
        <g>
          {/* NFT token base */}
          <Ext cx={cx} cy={cy} pts={mkPoly(0, 0, 4, 6)} z={0} h={0.5} color="#09799E" />
          {/* Identity pillar */}
          <Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 2, 24)} z={0.5} h={3} color="#09799E" />
          {/* Orbiting identity nodes */}
          <g className="float-s">{sats.map((s, i) => <Ext key={i} cx={cx} cy={cy} pts={mkCircle(s.x, s.y, 0.5, 8)} z={1.5 + i * 0.3} h={0.8} color="#09799E" glow />)}</g>
          {/* Crown */}
          <g className="float-f"><Ext cx={cx} cy={cy} pts={mkPoly(0, 0, 1.5, 6)} z={3.8} h={0.8} color="#09799E" glow /></g>
        </g>
      );
    },
  },
  {
    title: "Progressive Escrow (ERC-8183)",
    description: "Milestone-based escrow aligned with the ERC-8183 agent commerce standard. Funds release per milestone on alignment attestation; cancelStaleJob reclaims escrow after 7 days of agent silence.",
    accent: "#47A9CF",
    deep: "#032A3D",
    pattern: "dots",
    render: (cx: number, cy: number) => (
      <g>
        {/* Vault base */}
        <Ext cx={cx} cy={cy} pts={mkRect(0, 0, 7, 7)} z={0} h={0.6} color="#47A9CF" />
        {/* Milestone layers (stacked) */}
        <g className="float-s">{[0, 1, 2].map(i => <Ext key={i} cx={cx} cy={cy} pts={mkRect(0, 0, 5 - i * 0.8, 5 - i * 0.8)} z={1 + i * 1.4} h={1} color="#47A9CF" glow={i === 2} />)}</g>
        {/* Lock cylinder on top */}
        <g className="float-f"><Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 1, 12)} z={5.5} h={1.2} color="#47A9CF" glow /></g>
      </g>
    ),
  },
  {
    title: "Recurring Subscriptions",
    description: "SubscriptionEscrow runs autonomous agents on a tick interval — three modes (CLIENT_SET, AGENT_PROPOSED, AGENT_AUTO). Each cycle: skills run, 0G Compute fires, contract drains OG to the agent. Live now.",
    accent: "#A6E0F4",
    deep: "#022B3D",
    pattern: "diag",
    render: (cx: number, cy: number) => (
      <g>
        {/* Power base */}
        <Ext cx={cx} cy={cy} pts={mkRect(0, 0, 7, 2.5)} z={0} h={1} color="#A6E0F4" />
        <Ext cx={cx} cy={cy} pts={mkRect(0, 0, 2.5, 7)} z={0} h={1} color="#A6E0F4" />
        {/* Core block */}
        <Ext cx={cx} cy={cy} pts={mkRect(0, 0, 3.5, 3.5)} z={1} h={1.5} color="#A6E0F4" />
        {/* Piston */}
        <g className="piston-a"><Ext cx={cx} cy={cy} pts={mkRect(0, 0, 2, 2)} z={2.5} h={2.5} color="#A6E0F4" glow /></g>
        {/* Lightning tip */}
        <g className="float-f"><Ext cx={cx} cy={cy} pts={mkPoly(0, 0, 0.8, 3)} z={5.5} h={1} color="#A6E0F4" glow /></g>
      </g>
    ),
  },
  {
    title: "0G Alignment Attestations",
    description: "A distributed alignment network scores every output and signs an ECDSA attestation. The contract verifies the signature on-chain — neutral arbiter, no human bottleneck, no single point of failure.",
    accent: "#10b981",
    deep: "#021F2E",
    pattern: "cross",
    render: (cx: number, cy: number) => {
      const nodes = mkCircle(0, 0, 3.5, 8).sort((a, b) => (a.x + a.y) - (b.x + b.y));
      return (
        <g>
          {/* Central hub */}
          <Ext cx={cx} cy={cy} pts={mkCircle(0, 0, 1.8, 16)} z={0} h={2.5} color="#10b981" />
          {/* Verification ring */}
          <Ext cx={cx} cy={cy} pts={mkGear(0, 0, 2.5, 3.2, 10)} z={2.5} h={0.4} color="#10b981" glow />
          {/* Distributed nodes */}
          {nodes.map((n, i) => (
            <g key={i} className={i % 2 === 0 ? "float-s" : "float-f"}>
              <Ext cx={cx} cy={cy} pts={mkCircle(n.x, n.y, 0.6, 8)} z={0.5 + (i % 3) * 0.5} h={1.5} color="#10b981" glow={i === 3} />
            </g>
          ))}
        </g>
      );
    },
  },
];

// ── SVG pattern defs ────────────────────────────────────────────
function PatternDefs() {
  return (
    <svg width="0" height="0" className="absolute">
      <defs>
        <pattern id="p-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="white" />
        </pattern>
        <pattern id="p-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
        <pattern id="p-cross" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 12 8 L 12 16 M 8 12 L 16 12" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
        <pattern id="p-diag" x="0" y="0" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <path d="M 0 5 L 10 5" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
        <pattern id="p-lines" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 0 5 L 10 5" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
        <pattern id="p-hex" x="0" y="0" width="28" height="48" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
          <path d="M14 0l14 8v16l-14 8L0 24V8z M14 48l14-8V24l-14-8L0 24v16z" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
        <pattern id="p-circuit" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M8 0v8h16V0M8 32v-8h16V32M0 8h8M24 8h8M0 24h8M24 24h8" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="8" cy="8" r="1.5" fill="white" fillOpacity="0.4"/><circle cx="24" cy="8" r="1.5" fill="white" fillOpacity="0.4"/>
          <circle cx="8" cy="24" r="1.5" fill="white" fillOpacity="0.4"/><circle cx="24" cy="24" r="1.5" fill="white" fillOpacity="0.4"/>
        </pattern>
      </defs>
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────
export default function FeaturesGrid() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: animStyles }} />
      <PatternDefs />

      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#47A9CF]/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#09799E]/[0.07] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <SectionLabel>Core Primitives</SectionLabel>
          <h2
            className="text-3xl md:text-5xl font-medium tracking-tight mt-5 mb-4"
            style={{
              background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Four standards. One agent economy.
          </h2>
          <p className="text-[15px] text-white/45 max-w-2xl mx-auto leading-relaxed">
            zer0Gig is the only marketplace shipping ERC-7857 iNFTs and ERC-8183 progressive
            escrow together — with autonomous subscriptions and on-chain alignment attestations
            wired in from day one.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto" id="card-grid">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.21, 1.11, 0.81, 0.99] }}
              className="group relative overflow-hidden rounded-2xl cursor-pointer z-10
                         border border-white/[0.08] bg-[#032A3D]/80
                         hover:border-white/30 hover:-translate-y-0.5
                         hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                         transition-all duration-300 ease-out"
              style={{ background: f.deep }}
            >
              {/* Background pattern texture */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <svg width="100%" height="100%"><rect width="100%" height="100%" fill={`url(#p-${f.pattern})`} /></svg>
              </div>

              {/* 3D Isometric Visualization */}
              <div className="relative h-[200px] flex items-center justify-center pointer-events-none overflow-hidden">
                <svg viewBox="0 0 300 250" className="w-full h-full overflow-visible">
                  {f.render(150, 140)}
                </svg>
                {/* Radial glow behind shape */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: `radial-gradient(circle at 50% 60%, ${f.accent}12 0%, transparent 65%)`,
                }} />
              </div>

              {/* Text content */}
              <div className="relative px-6 pb-6 pt-0">
                {/* Accent line */}
                <div className="w-8 h-[2px] rounded-full mb-4" style={{ background: f.accent, boxShadow: `0 0 8px ${f.accent}` }} />

                <h3 className="text-[16px] font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-white/45 leading-relaxed">{f.description}</p>

                {/* Hidden reveal CTA — slides up + fades in on hover */}
                <HoverRevealCTA
                  className="mt-4"
                  href="https://stylenecy.gitbook.io/zer0gig"
                  label="Read in docs"
                  external
                />
              </div>

              {/* Stat badge top-right */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full pulse-a" style={{ background: f.accent }} />
                <span className="text-[9px] font-mono tracking-[0.15em] uppercase" style={{ color: `${f.accent}80` }}>ACTIVE</span>
              </div>
            </motion.div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
