"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Smartphone, Wallet, ShieldCheck, Zap, Sparkles, ArrowRight,
  Quote, TrendingUp, AlertTriangle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// IndonesiaBridge — the "why us, why now" section.
//
// Designed to match the visual ambition of MarketReadiness (B2B/P2P toggle):
// big stroke-outline typography, animated SVG centerpiece, branded tool wall,
// stakeholder pods with geometric portraits. Single section, multi-zone.
//
// Brand logos for known SaaS come from simple-icons.org CDN (CORS-friendly,
// no Next/Image domain config needed). 0G stack uses an inline glyph since
// there's no public icon CDN entry for it yet.
// ─────────────────────────────────────────────────────────────────────────────

// ── DATA ─────────────────────────────────────────────────────────────────────

const PAIN_STATS = [
  { value: "270M+",  label: "Mobile subscriptions",         note: "Statista, 2024" },
  { value: "65M",    label: "MSMEs nationwide",             note: "BPS census 2023" },
  { value: "<1%",    label: "Own a deployed AI agent",      note: "Internal survey, Q1 2026" },
  { value: "$240/yr",label: "Avg USD SaaS lockout cost",    note: "ChatGPT + Copilot floor" },
];

const GAIN_OUTCOMES: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "< ¢1",     label: "per agent inference",         icon: <Zap         className="w-4 h-4" /> },
  { value: "100%",     label: "owner-controlled wallet",     icon: <Wallet      className="w-4 h-4" /> },
  { value: "ERC-7857", label: "intelligent-NFT identity",    icon: <Sparkles    className="w-4 h-4" /> },
  { value: "ERC-8183", label: "progressive escrow",          icon: <ShieldCheck className="w-4 h-4" /> },
];

// Tools we run in prod. `cdn` = simple-icons slug (real brand color via /color suffix).
// `inline` = use the 0G glyph instead.
type Tool = {
  name:    string;
  sub:     string;
  brand:   string;        // hex without #, used for simple-icons color override
  cdn?:    string;        // simple-icons slug
  inline?: "zg";
};

const TOOLS: Tool[] = [
  { name: "0G Chain",    sub: "Settlement layer",   brand: "7C5CFF", inline: "zg" },
  { name: "0G Storage",  sub: "Encrypted briefs",   brand: "7C5CFF", inline: "zg" },
  { name: "0G Compute",  sub: "LLM inference",      brand: "7C5CFF", inline: "zg" },
  { name: "0G KV",       sub: "Agent memory",       brand: "7C5CFF", inline: "zg" },
  { name: "Supabase",    sub: "Profile + activity", brand: "3ECF8E", cdn: "supabase" },
  { name: "Vercel",      sub: "Frontend hosting",   brand: "FFFFFF", cdn: "vercel" },
  { name: "Next.js",     sub: "App framework",      brand: "FFFFFF", cdn: "nextdotjs" },
  { name: "Ethereum",    sub: "EVM execution",      brand: "627EEA", cdn: "ethereum" },
  { name: "Solidity",    sub: "Smart contracts",    brand: "AAAAAA", cdn: "solidity" },
  { name: "TypeScript",  sub: "Runtime + frontend", brand: "3178C6", cdn: "typescript" },
  { name: "Framer",      sub: "Motion choreo",      brand: "FFFFFF", cdn: "framer" },
  { name: "Foundry",     sub: "Contract tests",     brand: "FFFFFF", cdn: "foundry" },
];

const STAKEHOLDERS = [
  {
    initials: "HG",
    name:     "Hans Gunawan",
    role:     "Founder · Indonesia",
    quote:    "Built this because paying USD for tools my warung neighbor can't afford felt wrong.",
    accentA:  "#38BDF8",
    accentB:  "#0EA5E9",
    stamp:    "founder",
  },
  {
    initials: "JP",
    name:     "Jadid Purwaka Aji",
    role:     "ID Startup Ecosystem · Coalition Lead",
    quote:    "5–8 PT partners onboarding through Q3 2026. The on-ramp is concrete, not vapor.",
    accentA:  "#34D399",
    accentB:  "#059669",
    stamp:    "partner",
  },
  {
    initials: "HB",
    name:     "Halim Budi Santoso",
    role:     "Head of Computing, UKDW Yogyakarta",
    quote:    "ERC-7857 + ERC-8183 are the standards to watch. zer0Gig shipped them first.",
    accentA:  "#FBBF24",
    accentB:  "#D97706",
    stamp:    "academic",
  },
  {
    initials: "0G",
    name:     "0G APAC Hackathon",
    role:     "Track 3 · Agentic Economy",
    quote:    "First intelligent-NFT + agentic-commerce stack live on 0G Newton.",
    accentA:  "#C084FC",
    accentB:  "#7C3AED",
    stamp:    "ecosystem",
  },
];

// ── COMPONENT ────────────────────────────────────────────────────────────────

export default function IndonesiaBridge() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: "-120px" });

  // Rotating pain stat — cycles every 2.4s for ambient motion
  const [painIdx, setPainIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPainIdx(i => (i + 1) % PAIN_STATS.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#050810] py-28 lg:py-36 px-6 overflow-hidden border-y border-white/[0.04]"
    >
      {/* Ambient ceiling + floor gradients */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(56,189,248,0.10) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(124,58,237,0.07) 0%, transparent 55%)",
        }}
        aria-hidden
      />
      {/* Soft scanline grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto">
        <Header inView={inView} />
        <BridgeComposition painIdx={painIdx} inView={inView} />
        <ToolsWall inView={inView} />
        <PeopleStrip />
      </div>
    </section>
  );
}

// ── HEADER ───────────────────────────────────────────────────────────────────

function Header({ inView }: { inView: boolean }) {
  return (
    <div className="mb-20 lg:mb-28 text-center max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-white/65 mb-7 font-mono uppercase tracking-[0.25em]"
      >
        <span className="relative flex w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-60" />
          <span className="relative w-2 h-2 rounded-full bg-cyan-400" />
        </span>
        Why Indonesia First
      </motion.div>

      {/* Stroke-outline mega title — fills in on enter */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] mb-6"
      >
        <span
          className="block text-white"
          style={{ WebkitTextStroke: "0px", color: "white" }}
        >
          Build agents.
        </span>
        <span
          className="block transition-all duration-700"
          style={{
            WebkitTextStroke: inView ? "0px" : "1px rgba(255,255,255,0.35)",
            color: inView ? "rgba(255,255,255,0.55)" : "transparent",
          }}
        >
          Not just dream them.
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="text-white/55 text-[15px] sm:text-base max-w-2xl mx-auto leading-relaxed"
      >
        Indonesia leapt to mobile-first faster than most of the world. The next leap —
        owning AI that earns for you — has been gated by USD-priced SaaS, broken trust,
        and complexity nobody asked for. zer0Gig is the bridge.
      </motion.p>
    </div>
  );
}

// ── BRIDGE COMPOSITION (3-zone centerpiece) ──────────────────────────────────

function BridgeComposition({ painIdx, inView }: { painIdx: number; inView: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr_1fr] gap-6 lg:gap-4 items-stretch mb-24 lg:mb-32">
      {/* LEFT — Indonesia today (pain) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d1525]/95 to-[#080d18]/95 p-7 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80" />
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400/80">
            Indonesia · 2026
          </span>
        </div>

        <h3 className="text-2xl font-bold text-white leading-tight mb-1">
          The adoption gap
        </h3>
        <p className="text-white/45 text-[12.5px] leading-relaxed mb-6">
          The phones are here. The agents aren&apos;t.
        </p>

        {/* Rotating featured stat */}
        <div className="relative h-[110px] rounded-xl border border-white/10 bg-[#050810]/80 px-5 py-4 mb-4 overflow-hidden">
          <motion.div
            key={painIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1.5">
              {PAIN_STATS[painIdx].note}
            </p>
            <p className="text-4xl font-black text-white tracking-tight">
              {PAIN_STATS[painIdx].value}
            </p>
            <p className="text-[12px] text-white/55 mt-1">
              {PAIN_STATS[painIdx].label}
            </p>
          </motion.div>
          {/* Tab dots */}
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {PAIN_STATS.map((_, i) => (
              <span
                key={i}
                className={`w-1 h-1 rounded-full transition-all ${
                  i === painIdx ? "bg-white/70 w-3" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Pain bullet list */}
        <ul className="space-y-2">
          {[
            "USD SaaS pricing locks out IDR earners",
            "Middleman fraud is profitable on web2 rails",
            "Building an agent requires too much scaffolding",
          ].map(p => (
            <li key={p} className="flex items-start gap-2 text-[12.5px] text-white/55 leading-snug">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400/60 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* CENTER — animated bridge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative rounded-2xl border border-white/10 bg-[#050810]/60 p-6 flex flex-col items-center justify-center min-h-[360px] lg:min-h-[440px] overflow-hidden"
      >
        {/* Center label */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/55">
            The Bridge
          </span>
          <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
        </div>

        <BridgeSvg />

        {/* Bottom subline */}
        <div className="absolute bottom-5 left-0 right-0 px-6 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/35">
            Hosted today · Owned tomorrow
          </p>
        </div>
      </motion.div>

      {/* RIGHT — outcome (zer0Gig delivers) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d1525]/95 to-[#080d18]/95 p-7 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400">
            With zer0Gig
          </span>
        </div>

        <h3 className="text-2xl font-bold text-white leading-tight mb-1">
          Practical agent ownership
        </h3>
        <p className="text-white/45 text-[12.5px] leading-relaxed mb-6">
          Local-economy pricing. On-chain receipts. Wallet stays yours.
        </p>

        {/* Outcome grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {GAIN_OUTCOMES.map(o => (
            <div
              key={o.label}
              className="rounded-xl border border-white/10 bg-[#050810]/80 px-3 py-3"
            >
              <span className="w-6 h-6 rounded-md flex items-center justify-center bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 mb-2">
                {o.icon}
              </span>
              <p className="text-[15px] font-bold text-white tracking-tight">
                {o.value}
              </p>
              <p className="text-[10.5px] text-white/45 leading-snug mt-0.5">
                {o.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTA pill */}
        <a
          href="/marketplace/agents-for-sale"
          className="mt-2 inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-full bg-white text-black text-[12px] font-medium hover:bg-white/90 transition-colors"
        >
          Browse agents on 0G
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </motion.div>
    </div>
  );
}

// SVG bridge between left and right pillars
function BridgeSvg() {
  return (
    <svg viewBox="0 0 400 240" className="w-full max-w-md" aria-hidden>
      <defs>
        <linearGradient id="bridgeStroke" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FBBF24" stopOpacity="0.5" />
          <stop offset="50%"  stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="dotGlow">
          <stop offset="0%"  stopColor="#7DD3FC" stopOpacity="1" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Left tower (Indonesia) */}
      <g>
        <rect x="20" y="80" width="40" height="120" fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" rx="3" />
        <rect x="28" y="92"  width="24" height="10" fill="white" fillOpacity="0.08" />
        <rect x="28" y="108" width="24" height="10" fill="white" fillOpacity="0.08" />
        <rect x="28" y="124" width="24" height="10" fill="white" fillOpacity="0.08" />
        <text x="40" y="220" textAnchor="middle" className="text-[9px]" fill="white" fillOpacity="0.45" style={{ fontSize: 8, fontFamily: "ui-monospace, monospace", letterSpacing: 1.5 }}>
          IDN
        </text>
      </g>

      {/* Right tower (Agent economy) */}
      <g>
        <rect x="340" y="80" width="40" height="120" fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" rx="3" />
        <rect x="348" y="92"  width="24" height="10" fill="#38BDF8" fillOpacity="0.18" />
        <rect x="348" y="108" width="24" height="10" fill="#38BDF8" fillOpacity="0.18" />
        <rect x="348" y="124" width="24" height="10" fill="#38BDF8" fillOpacity="0.18" />
        <text x="360" y="220" textAnchor="middle" fill="#7DD3FC" fillOpacity="0.7" style={{ fontSize: 8, fontFamily: "ui-monospace, monospace", letterSpacing: 1.5 }}>
          AGT
        </text>
      </g>

      {/* Bridge cables — two arc strokes */}
      <path
        d="M 60 100 Q 200 40 340 100"
        stroke="url(#bridgeStroke)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M 60 110 Q 200 56 340 110"
        stroke="white"
        strokeOpacity="0.08"
        strokeWidth="1"
        fill="none"
      />

      {/* Deck */}
      <line x1="60" y1="130" x2="340" y2="130" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="60" y1="138" x2="340" y2="138" stroke="white" strokeOpacity="0.10" strokeWidth="1" />

      {/* Deck pillars */}
      {[100, 160, 220, 280].map(x => (
        <line key={x} x1={x} y1="130" x2={x} y2="160" stroke="white" strokeOpacity="0.12" strokeWidth="1" />
      ))}
      <line x1="60" y1="160" x2="340" y2="160" stroke="white" strokeOpacity="0.10" strokeWidth="1" />

      {/* Traveling data dots (4 dots, staggered) */}
      {[0, 1, 2, 3].map(i => (
        <motion.circle
          key={i}
          r="3"
          cy="130"
          fill="#7DD3FC"
          initial={{ cx: 60, opacity: 0 }}
          animate={{ cx: 340, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 2.6,
            repeat:    Infinity,
            delay:     i * 0.65,
            ease:      "linear",
            times:     [0, 0.1, 0.9, 1],
          }}
        />
      ))}
      {/* One bright lead dot */}
      <motion.circle
        r="5"
        cy="130"
        fill="url(#dotGlow)"
        initial={{ cx: 60 }}
        animate={{ cx: 340 }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
      />

      {/* Labels */}
      <text x="200" y="56" textAnchor="middle" fill="white" fillOpacity="0.55" style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", letterSpacing: 2 }}>
        ERC-7857 · ERC-8183 · 0G NEWTON
      </text>
    </svg>
  );
}

// ── TOOLS WALL ───────────────────────────────────────────────────────────────

function ToolsWall({ inView }: { inView: boolean }) {
  return (
    <div className="mb-24 lg:mb-32">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center max-w-2xl mx-auto mb-10"
      >
        <p className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-white/55 mb-3">
          <span className="w-6 h-px bg-white/30" />
          The Rails
          <span className="w-6 h-px bg-white/30" />
        </p>
        <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
          Built on production infrastructure
        </h3>
        <p className="text-white/45 text-[13px] max-w-lg mx-auto">
          Twelve real dependencies running in production right now. No vapor logos. No "coming soon" rails.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {TOOLS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.55 + i * 0.04 }}
            className="group relative rounded-xl border border-white/10 bg-[#0d1525]/90 px-4 py-4 hover:border-white/25 hover:bg-[#0d1525] transition-all"
          >
            {/* Soft brand-color glow on hover */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: `radial-gradient(circle at 30% 0%, #${t.brand}22 0%, transparent 60%)`,
              }}
            />

            <div className="relative flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/10 shrink-0">
                <ToolGlyph tool={t} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-medium truncate">{t.name}</p>
                <p className="text-white/40 text-[10.5px] leading-snug truncate">{t.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ToolGlyph({ tool }: { tool: Tool }) {
  if (tool.inline === "zg") {
    // 0G stack inline glyph — concentric ring + center cross
    return (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" style={{ color: `#${tool.brand}` }}>
        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="6"  stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        <circle cx="16" cy="16" r="2"  fill="currentColor" />
      </svg>
    );
  }
  // Real-brand logo from simple-icons CDN.
  // simple-icons.org supports `/<slug>/<hex>` color override.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${tool.cdn}/${tool.brand}`}
      alt={tool.name}
      className="w-5 h-5"
      loading="lazy"
    />
  );
}

// ── PEOPLE STRIP ─────────────────────────────────────────────────────────────

function PeopleStrip() {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto mb-10"
      >
        <p className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-white/55 mb-3">
          <span className="w-6 h-px bg-white/30" />
          The People
          <span className="w-6 h-px bg-white/30" />
        </p>
        <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
          Standing behind the bridge
        </h3>
        <p className="text-white/45 text-[13px] max-w-lg mx-auto">
          Founder, ecosystem partner, academic validator, and the hackathon track that vetted the stack.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STAKEHOLDERS.map((s, i) => (
          <motion.div
            key={s.initials}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5 hover:border-white/20 transition-all"
          >
            {/* Stamp */}
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[9px] font-mono uppercase tracking-widest text-white/45">
              {s.stamp}
            </span>

            {/* Geometric avatar */}
            <AvatarBadge initials={s.initials} accentA={s.accentA} accentB={s.accentB} />

            <p className="text-white text-[14px] font-semibold leading-tight mb-0.5">{s.name}</p>
            <p className="text-white/45 text-[11px] leading-snug mb-4">{s.role}</p>

            <div className="relative pt-4 border-t border-white/[0.06]">
              <Quote className="absolute -top-1 left-0 w-3 h-3 text-white/25" strokeWidth={2.5} />
              <p className="text-white/65 text-[12px] leading-relaxed pl-5 italic">
                {s.quote}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AvatarBadge({
  initials, accentA, accentB,
}: {
  initials: string;
  accentA:  string;
  accentB:  string;
}) {
  // Stable hash → deterministic decorative dot pattern (not random, so SSR-stable)
  const dots = Array.from({ length: 12 }).map((_, i) => {
    const a = (initials.charCodeAt(0) * (i + 7)) % 360;
    return {
      cx: 32 + Math.cos((a * Math.PI) / 180) * (16 + (i % 3) * 4),
      cy: 32 + Math.sin((a * Math.PI) / 180) * (16 + (i % 3) * 4),
      r:  0.6 + (i % 3) * 0.3,
    };
  });

  return (
    <div className="relative w-14 h-14 mb-4">
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <defs>
          <linearGradient id={`avgrad-${initials}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={accentA} stopOpacity="0.55" />
            <stop offset="100%" stopColor={accentB} stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill={`url(#avgrad-${initials})`} stroke={accentA} strokeOpacity="0.35" strokeWidth="1" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={accentA} fillOpacity="0.45" />
        ))}
        <text
          x="32" y="38"
          textAnchor="middle"
          fill="white"
          style={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.5, fontFamily: "ui-sans-serif, system-ui" }}
        >
          {initials}
        </text>
      </svg>
      {/* Status dot */}
      <span
        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0d1525]"
        style={{ background: accentA, boxShadow: `0 0 8px ${accentA}80` }}
      />
    </div>
  );
}
