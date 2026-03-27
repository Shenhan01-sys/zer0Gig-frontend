"use client";

import { motion } from "framer-motion";

const layers = [
  {
    label: "Interface Layer",
    tech: "React + Wagmi + RainbowKit",
    color: "from-cyan-400 to-cyan-500",
    borderColor: "border-cyan-400/30",
    bgColor: "bg-cyan-400/5",
    textColor: "text-cyan-400",
  },
  {
    label: "Economy Layer",
    tech: "x402 + costTracker + Game Theory",
    color: "from-blue-400 to-blue-500",
    borderColor: "border-blue-400/30",
    bgColor: "bg-blue-400/5",
    textColor: "text-blue-400",
  },
  {
    label: "Arbiter Layer",
    tech: "0G AI Alignment Nodes + ECDSA",
    color: "from-indigo-400 to-indigo-500",
    borderColor: "border-indigo-400/30",
    bgColor: "bg-indigo-400/5",
    textColor: "text-indigo-400",
  },
  {
    label: "Privacy Layer",
    tech: "ECIES Encryption \u2192 Sealed Inference",
    color: "from-violet-400 to-violet-500",
    borderColor: "border-violet-400/30",
    bgColor: "bg-violet-400/5",
    textColor: "text-violet-400",
  },
  {
    label: "Storage Layer",
    tech: "0G Storage KV",
    color: "from-purple-400 to-purple-500",
    borderColor: "border-purple-400/30",
    bgColor: "bg-purple-400/5",
    textColor: "text-purple-400",
  },
  {
    label: "Identity + Escrow Layer",
    tech: "Agent ID + Progressive Escrow + 0G Chain",
    color: "from-fuchsia-400 to-fuchsia-500",
    borderColor: "border-fuchsia-400/30",
    bgColor: "bg-fuchsia-400/5",
    textColor: "text-fuchsia-400",
  },
];

export default function ArchitectureSection() {
  return (
    <section id="developers" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/[0.06] blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/60">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="10" height="2" rx="0.5" />
              <rect x="2" y="6" width="10" height="2" rx="0.5" />
              <rect x="2" y="9" width="10" height="2" rx="0.5" />
            </svg>
            Architecture
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-5xl font-medium text-center mb-4"
          style={{
            background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          The Full Stack, On-Chain
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[15px] text-white/50 text-center mb-14 max-w-lg mx-auto"
        >
          Six layers that create a trustless, privacy-preserving, and efficient AI marketplace from top to bottom.
        </motion.p>

        {/* Architecture Stack */}
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="relative"
            >
              {/* Connector arrow */}
              {i > 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 0v12M2 8l4 4 4-4" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              <div className={`relative flex items-center justify-between ${layer.bgColor} border ${layer.borderColor} rounded-xl px-6 py-4 group hover:border-white/20 transition-all duration-300`}>
                {/* Left gradient accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b ${layer.color}`} />

                <div className="flex items-center gap-4 pl-2">
                  {/* Layer number */}
                  <span className={`text-[12px] font-bold ${layer.textColor} opacity-60`}>
                    L{i + 1}
                  </span>
                  <div>
                    <h4 className="text-[15px] font-semibold text-white">
                      {layer.label}
                    </h4>
                    <p className="text-[13px] text-white/40 mt-0.5">
                      {layer.tech}
                    </p>
                  </div>
                </div>

                {/* Right side icon */}
                <div className={`shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${layer.color} p-[1px]`}>
                  <div className="w-full h-full rounded-lg bg-black/80 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                      <rect x="2" y="2" width="10" height="10" rx="2" />
                      <path d="M5 7h4M7 5v4" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-8"
        >
          <span className="text-[12px] text-white/25 uppercase tracking-widest">
            0G Chain &mdash; Decentralized Foundation
          </span>
        </motion.div>
      </div>
    </section>
  );
}
