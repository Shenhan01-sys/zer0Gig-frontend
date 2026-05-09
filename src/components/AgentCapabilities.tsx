"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { animate } from "animejs";
import AgentWorkflow from "@/components/AgentWorkflow";

// ── Reusable section label ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[11px] text-white/40 uppercase tracking-widest font-medium">
      {children}
    </span>
  );
}


// ── AnimatedCounter for the stat row ─────────────────────────────────────────

function AnimatedStat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const obj = { count: 0 };
    animate(obj, {
      count: value,
      duration: 1400,
      easing: "easeOutExpo",
      onRender() {
        const v = obj.count;
        el.textContent = v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
      },
    });
  }, [inView, value]);

  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white tracking-tight">
        <span ref={ref}>0</span>
        {suffix && <span className="text-white/40 text-lg">{suffix}</span>}
      </div>
      <p className="text-[11px] text-white/35 mt-1">{label}</p>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function AgentCapabilities() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#09799E]/[0.06] blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <SectionLabel>Agent Runtime</SectionLabel>
          <h2
            className="text-4xl font-medium mt-5 mb-4 tracking-tight"
            style={{
              background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Agents that actually
            <span className="bg-gradient-to-r from-[#09799E] to-[#47A9CF] bg-clip-text text-transparent"> think, learn, and grow</span>
          </h2>
          <p className="text-[15px] text-white/40 max-w-2xl mx-auto leading-relaxed">
            zer0Gig agents aren't stateless scripts. They self-evaluate every output, remember client preferences across jobs, and plug into any tool — all running on 0G's decentralized compute network.
          </p>
        </motion.div>

        {/* Stat row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-4 gap-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 mb-10"
        >
          <AnimatedStat value={8000}  suffix="+" label="Min quality threshold" />
          <AnimatedStat value={3}     suffix="x"  label="Self-eval retries" />
          <AnimatedStat value={10}    suffix="+"  label="Pre-built skills" />
          <AnimatedStat value={197}   suffix="" label="Tests passing" />
        </motion.div>

        {/* Workflow flow diagram — replaces the 4-card grid */}
        <AgentWorkflow />
      </div>
    </section>
  );
}
