"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Wallet, ShieldCheck, Zap, Sparkles, ArrowRight,
  TrendingUp, AlertTriangle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// IndonesiaBridge — the "why us, why now" section.
//
// Header + 3-zone bridge composition only. Tools wall and stakeholder pods
// have been consolidated into PartnershipTrust below so the "Built on" and
// "Validated by" subsections share a single source of truth.
// ─────────────────────────────────────────────────────────────────────────────

const PAIN_STATS = [
  { value: "270M+",   label: "Mobile subscriptions",      note: "Statista, 2024" },
  { value: "65M",     label: "MSMEs nationwide",          note: "BPS census 2023" },
  { value: "<1%",     label: "Own a deployed AI agent",   note: "Internal survey, Q1 2026" },
  { value: "$240/yr", label: "Avg USD SaaS lockout cost", note: "ChatGPT + Copilot floor" },
];

const GAIN_OUTCOMES: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "< ¢1",     label: "per agent inference",      icon: <Zap         className="w-4 h-4" /> },
  { value: "100%",     label: "owner-controlled wallet",  icon: <Wallet      className="w-4 h-4" /> },
  { value: "ERC-7857", label: "intelligent-NFT identity", icon: <Sparkles    className="w-4 h-4" /> },
  { value: "ERC-8183", label: "progressive escrow",       icon: <ShieldCheck className="w-4 h-4" /> },
];

export default function IndonesiaBridge() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: "-120px" });

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
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(56,189,248,0.10) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(124,58,237,0.07) 0%, transparent 55%)",
        }}
        aria-hidden
      />
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
      </div>
    </section>
  );
}

// ── HEADER ───────────────────────────────────────────────────────────────────

function Header({ inView }: { inView: boolean }) {
  return (
    <div className="mb-16 lg:mb-20 text-center max-w-4xl mx-auto">
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr_1fr] gap-6 lg:gap-4 items-stretch">
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

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative rounded-2xl border border-white/10 bg-[#050810]/60 p-6 flex flex-col items-center justify-center min-h-[360px] lg:min-h-[440px] overflow-hidden"
      >
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/55">
            The Bridge
          </span>
          <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
        </div>

        <BridgeSvg />

        <div className="absolute bottom-5 left-0 right-0 px-6 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/35">
            Hosted today · Owned tomorrow
          </p>
        </div>
      </motion.div>

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

      <g>
        <rect x="20" y="80" width="40" height="120" fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" rx="3" />
        <rect x="28" y="92"  width="24" height="10" fill="white" fillOpacity="0.08" />
        <rect x="28" y="108" width="24" height="10" fill="white" fillOpacity="0.08" />
        <rect x="28" y="124" width="24" height="10" fill="white" fillOpacity="0.08" />
        <text x="40" y="220" textAnchor="middle" fill="white" fillOpacity="0.45" style={{ fontSize: 8, fontFamily: "ui-monospace, monospace", letterSpacing: 1.5 }}>
          IDN
        </text>
      </g>

      <g>
        <rect x="340" y="80" width="40" height="120" fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" rx="3" />
        <rect x="348" y="92"  width="24" height="10" fill="#38BDF8" fillOpacity="0.18" />
        <rect x="348" y="108" width="24" height="10" fill="#38BDF8" fillOpacity="0.18" />
        <rect x="348" y="124" width="24" height="10" fill="#38BDF8" fillOpacity="0.18" />
        <text x="360" y="220" textAnchor="middle" fill="#7DD3FC" fillOpacity="0.7" style={{ fontSize: 8, fontFamily: "ui-monospace, monospace", letterSpacing: 1.5 }}>
          AGT
        </text>
      </g>

      <path d="M 60 100 Q 200 40 340 100" stroke="url(#bridgeStroke)" strokeWidth="1.5" fill="none" />
      <path d="M 60 110 Q 200 56 340 110" stroke="white" strokeOpacity="0.08" strokeWidth="1" fill="none" />

      <line x1="60" y1="130" x2="340" y2="130" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
      <line x1="60" y1="138" x2="340" y2="138" stroke="white" strokeOpacity="0.10" strokeWidth="1" />

      {[100, 160, 220, 280].map(x => (
        <line key={x} x1={x} y1="130" x2={x} y2="160" stroke="white" strokeOpacity="0.12" strokeWidth="1" />
      ))}
      <line x1="60" y1="160" x2="340" y2="160" stroke="white" strokeOpacity="0.10" strokeWidth="1" />

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
      <motion.circle
        r="5"
        cy="130"
        fill="url(#dotGlow)"
        initial={{ cx: 60 }}
        animate={{ cx: 340 }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
      />

      <text x="200" y="56" textAnchor="middle" fill="white" fillOpacity="0.55" style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", letterSpacing: 2 }}>
        ERC-7857 · ERC-8183 · 0G NEWTON
      </text>
    </svg>
  );
}
