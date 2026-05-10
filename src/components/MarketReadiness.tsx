"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, Cpu, Globe2 } from "lucide-react";

const springTransition = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 0.8,
};

export default function MarketReadiness() {
  const [hoveredPanel, setHoveredPanel] = useState<"none" | "b2b" | "p2p">("none");

  const getWidth = (panel: "b2b" | "p2p") => {
    if (hoveredPanel === "none") return "50%";
    if (hoveredPanel === panel) return "75%";
    return "25%";
  };

  const getHeight = (panel: "b2b" | "p2p") => {
    if (hoveredPanel === "none") return "50%";
    if (hoveredPanel === panel) return "75%";
    return "25%";
  };

  return (
    <section className="relative w-full h-screen bg-[#050B14] overflow-hidden font-sans text-white">

      {/* Center guide text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none mix-blend-difference">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: hoveredPanel === "none" ? 1 : 0 }}
          className="flex flex-col items-center"
        >
          <div className="w-[1px] h-12 bg-white mb-4" />
          <span className="font-mono text-xs tracking-[0.4em] uppercase text-center bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
            Select Deployment Model
          </span>
          <div className="w-[1px] h-12 bg-white mt-4" />
        </motion.div>
      </div>

      <div className="flex flex-col lg:flex-row w-full h-full">

        {/* B2B ENTERPRISE panel */}
        <motion.div
          className="relative h-full overflow-hidden flex-shrink-0 cursor-crosshair border-b lg:border-b-0 lg:border-r border-white/10 group"
          animate={{
            width: typeof window !== "undefined" && window.innerWidth >= 1024 ? getWidth("b2b") : "100%",
            height: typeof window !== "undefined" && window.innerWidth < 1024 ? getHeight("b2b") : "100%",
          }}
          transition={springTransition}
          onMouseEnter={() => setHoveredPanel("b2b")}
          onMouseLeave={() => setHoveredPanel("none")}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')`,
              opacity: hoveredPanel === "b2b" ? 0.3 : 0.1,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#09799E]/20 to-transparent" />

          <div className="relative w-full h-full p-8 lg:p-16 flex flex-col justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#47A9CF]" />
              <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">Enterprise Ready</span>
            </div>

            <div className="flex flex-col justify-center">
              <h2
                className="text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-none"
                style={{
                  WebkitTextStroke: hoveredPanel === "b2b" ? "0px" : "1px rgba(255,255,255,0.3)",
                  color: hoveredPanel === "b2b" ? "white" : "transparent",
                  transition: "all 0.5s ease",
                }}
              >
                B2B
                <br />
                Scale
              </h2>
            </div>

            <AnimatePresence>
              {hoveredPanel === "b2b" && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="grid grid-cols-2 gap-8 pt-8 border-t border-cyan-500/30"
                >
                  <div className="flex flex-col gap-2">
                    <ShieldCheck className="w-6 h-6 text-cyan-400 mb-1" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">Compliance</span>
                    <span className="text-xl font-medium text-white">SOC2 Type II</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Cpu className="w-6 h-6 text-cyan-400 mb-1" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">Execution</span>
                    <span className="text-xl font-medium text-white">Dedicated Nodes</span>
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Throughput Limits</span>
                    <div className="w-full h-1 bg-white/10 relative mt-1">
                      <div className="absolute top-0 left-0 h-full w-[95%] bg-cyan-400 shadow-[0_0_10px_#47A9CF]" />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-white/40 mt-1">
                      <span>10,000+ TPS</span>
                      <span>SLA 99.999%</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* P2P SWARM panel */}
        <motion.div
          className="relative h-full overflow-hidden flex-shrink-0 cursor-crosshair group"
          animate={{
            width: typeof window !== "undefined" && window.innerWidth >= 1024 ? getWidth("p2p") : "100%",
            height: typeof window !== "undefined" && window.innerWidth < 1024 ? getHeight("p2p") : "100%",
          }}
          transition={springTransition}
          onMouseEnter={() => setHoveredPanel("p2p")}
          onMouseLeave={() => setHoveredPanel("none")}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?q=80&w=2070&auto=format&fit=crop')`,
              opacity: hoveredPanel === "p2p" ? 0.35 : 0.1,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-emerald-900/20 to-transparent" />

          <div className="relative w-full h-full p-8 lg:p-16 flex flex-col justify-between z-10">
            <div className="flex items-center gap-3 lg:self-end">
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">Permissionless</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
            </div>

            <div className="flex flex-col justify-center lg:items-end">
              <h2
                className="text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-none lg:text-right"
                style={{
                  WebkitTextStroke: hoveredPanel === "p2p" ? "0px" : "1px rgba(255,255,255,0.3)",
                  color: hoveredPanel === "p2p" ? "white" : "transparent",
                  transition: "all 0.5s ease",
                }}
              >
                P2P
                <br />
                Swarm
              </h2>
            </div>

            <AnimatePresence>
              {hoveredPanel === "p2p" && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="grid grid-cols-2 gap-8 pt-8 border-t border-emerald-500/30"
                >
                  <div className="flex flex-col gap-2">
                    <Globe2 className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">Distribution</span>
                    <span className="text-xl font-medium text-white">14,204 Nodes</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Lock className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">Access</span>
                    <span className="text-xl font-medium text-white">Censorship Res.</span>
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Network Consensus</span>
                    <div className="flex gap-1 mt-1">
                      {[...Array(15)].map((_, i) => (
                        <div
                          key={i}
                          className="h-2 flex-1 rounded-sm bg-emerald-400/80"
                          style={{ opacity: (i * 7 + 3) % 10 > 2 ? 1 : 0.3 }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-white/40 mt-1">
                      <span>Proof of Intelligence</span>
                      <span>Global Mesh</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
