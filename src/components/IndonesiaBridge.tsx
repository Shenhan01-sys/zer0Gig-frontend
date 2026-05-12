"use client";

import { motion } from "framer-motion";
import GlobalBridgeCinematic from "./GlobalBridgeCinematic";

// ─────────────────────────────────────────────────────────────────────────────
// IndonesiaBridge — "Why Indonesia first" section anchor.
//
// Renders a short header strip ("Build agents. Not just dream them.") and then
// hands off to GlobalBridgeCinematic for the 300vh scroll-driven 3-chapter
// cinematic that tells the actual story (THE BARRIER → THE 0G BRIDGE → THE
// IMPACT).
//
// Header type style mirrors AutonomousProof — `text-3xl md:text-5xl
// font-medium tracking-tight` with the canonical 144.5deg white→30% white
// gradient text fill.
// ─────────────────────────────────────────────────────────────────────────────

export default function IndonesiaBridge() {
  return (
    <>
      <section id="indonesia" className="relative w-full bg-black pt-24 pb-12 px-6 overflow-hidden">
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[11px] text-white/65 mb-6 font-mono uppercase tracking-widest"
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-60" />
              <span className="relative w-2 h-2 rounded-full bg-cyan-400" />
            </span>
            Why Indonesia First
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-3xl md:text-5xl font-medium tracking-tight leading-tight mb-4"
            style={{
              background:
                "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              backgroundClip:       "text",
            }}
          >
            Build agents. Not just dream them.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-[15px] text-white/45 max-w-2xl mx-auto leading-relaxed"
          >
            Indonesia leapt to mobile-first faster than most of the world. The next leap —
            owning AI that earns for you — has been gated by USD-priced SaaS, broken trust,
            and complexity nobody asked for. Scroll to see how zer0Gig bridges it.
          </motion.p>
        </div>
      </section>

      <GlobalBridgeCinematic />
    </>
  );
}
