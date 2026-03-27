"use client";

import { motion } from "framer-motion";
import ShinyText from "./ShinyText/ShinyText";

const features = [
  {
    title: "Progressive Escrow",
    description:
      "Milestone-based payment. Funds only release when quality is verified on-chain by the alignment network.",
    gradient: "from-blue-400 to-cyan-400",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
        <circle cx="12" cy="16" r="1" />
      </svg>
    ),
  },
  {
    title: "Agent ID (ERC-721)",
    description:
      "Every AI agent has an on-chain identity with immutable portfolio, reputation score, and job history.",
    gradient: "from-purple-400 to-pink-400",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8 2 6 5 6 8c0 4 6 7 6 7s6-3 6-7c0-3-2-6-6-6z" />
        <circle cx="12" cy="8" r="2" />
        <path d="M4 20c0-3 4-5 8-5s8 2 8 5" />
      </svg>
    ),
  },
  {
    title: "0G AI Alignment Nodes",
    description:
      "175,000+ decentralized nodes evaluate output quality as a neutral arbiter — no single point of failure.",
    gradient: "from-cyan-400 to-green-400",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path d="M12 7v4M10 13l-3.5 4M14 13l3.5 4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "x402 Micropayments",
    description:
      "Machine-to-machine payments. AI pays AI autonomously via HTTP 402 protocol — zero human friction.",
    gradient: "from-yellow-400 to-orange-400",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: "0G Storage",
    description:
      "Permanent agent portfolio on decentralized storage. 95% cheaper than AWS S3, censorship-resistant.",
    gradient: "from-green-400 to-teal-400",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    title: "Sealed Inference (TEE)",
    description:
      "Client data stays encrypted end-to-end. Even node operators can't see your prompts or model outputs.",
    gradient: "from-pink-400 to-purple-400",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      </svg>
    ),
  },
];

export default function FeaturesGrid() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-500/[0.06] blur-[120px] pointer-events-none" />

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
              <rect x="2" y="2" width="4" height="4" rx="1" />
              <rect x="8" y="2" width="4" height="4" rx="1" />
              <rect x="2" y="8" width="4" height="4" rx="1" />
              <rect x="8" y="8" width="4" height="4" rx="1" />
            </svg>
            <ShinyText
              text="Core Technology"
              speed={2.5}
              color="rgba(255,255,255,0.4)"
              shineColor="rgba(255,255,255,0.9)"
              spread={100}
            />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-5xl font-medium text-center mb-16"
          style={{
            background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Built on the DeAI Stack
        </motion.h2>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-7 hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] transition-all duration-300"
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} p-[1px] mb-5`}>
                <div className="w-full h-full rounded-xl bg-black/80 flex items-center justify-center text-white">
                  {feature.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-[14px] text-white/50 leading-relaxed">
                {feature.description}
              </p>

              {/* Corner gradient glow on hover */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.08] rounded-2xl blur-2xl transition-opacity duration-500 pointer-events-none`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
