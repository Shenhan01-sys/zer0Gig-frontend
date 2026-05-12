"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  Smartphone, Wallet, ShieldCheck, Zap, TrendingUp, Users,
  ServerCrash, DollarSign, Lock, Cpu, Globe2,
  ArrowRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// GlobalBridgeCinematic — 300vh scroll-driven 3-chapter cinematic for the
// "Why Indonesia first" narrative. Chapters fade-cross-fade as the viewport
// scrolls through the section, with a vertical timeline navigator on the left
// and giant lucide icons at the bottom of each chapter.
//
// Spec source: Docs/Frontend/LandingPage/GlobalBridgeCinematic/GlobalBridgeSection.md
// Background per landing-page convention: #000000 with chapter color blend.
// ─────────────────────────────────────────────────────────────────────────────

const STORY_CHAPTERS = [
  {
    id:         "barrier",
    number:     "01",
    shortTitle: "THE BARRIER",
    title:      "Everyone has a phone. Nobody owns an agent.",
    color:      "#f43f5e",
    bgImage:    "/landing/scene1-barrier.jpg.webp",
    description:
      "Indonesia leapt to mobile-first instantly. But the next leap is gated by Western USD pricing, middleman fraud, and insane tech barriers. A $20/mo subscription locks out local builders.",
    metrics: [
      { icon: DollarSign,  label: "USD Paywalls", value: "SaaS drain" },
      { icon: Lock,        label: "Trust Broken", value: "Middleman fraud" },
      { icon: ServerCrash, label: "Complexity",   value: "Cloud VMs required" },
    ],
  },
  {
    id:         "bridge",
    number:     "02",
    shortTitle: "THE 0G BRIDGE",
    title:      "Abstract the complexity. Drain the cost.",
    color:      "#06b6d4",
    bgImage:    "/landing/scene2-bridge.png.png",
    description:
      "zer0Gig handles the runtime. 0G Compute provides local-economy pricing at fractions of a cent. On-chain escrow eliminates middlemen. You don't build infrastructure, you just mint.",
    metrics: [
      { icon: Wallet,      label: "ERC-7857",    value: "Agent owns wallet" },
      { icon: Zap,         label: "0G Compute",  value: "Micro-cent execution" },
      { icon: ShieldCheck, label: "Smart Escrow", value: "Trustless payouts" },
    ],
  },
  {
    id:         "impact",
    number:     "03",
    shortTitle: "THE IMPACT",
    title:      "10× productivity at the exact same cost.",
    color:      "#10b981",
    bgImage:    "https://images.unsplash.com/photo-1555899434-94d1368aa7af?q=80&w=2070&auto=format&fit=crop",
    description:
      "We are not betting AI replaces the workforce. We are betting it empowers a single indie builder, a local shop owner, or a PT ops team to scale like a massive enterprise.",
    metrics: [
      { icon: TrendingUp, label: "Shop Owners", value: "Auto-daily reports" },
      { icon: Globe2,     label: "Web3 Devs",   value: "Swarm code audits" },
      { icon: Users,      label: "Operations",  value: "24/7 Autonomous CS" },
    ],
  },
];

export default function GlobalBridgeCinematic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", latest => {
    if (latest < 0.33 && activeChapter !== 0)                     setActiveChapter(0);
    else if (latest >= 0.33 && latest < 0.66 && activeChapter !== 1) setActiveChapter(1);
    else if (latest >= 0.66 && activeChapter !== 2)               setActiveChapter(2);
  });

  // Preload images for smoother chapter transitions
  useEffect(() => {
    STORY_CHAPTERS.forEach(chapter => {
      const img = new Image();
      img.src = chapter.bgImage;
    });
  }, []);

  const scrollToChapter = (index: number) => {
    if (!containerRef.current) return;
    const startY  = containerRef.current.offsetTop;
    const vh      = window.innerHeight;
    const targetY = startY + index * vh;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  const current = STORY_CHAPTERS[activeChapter];

  return (
    <div ref={containerRef} className="relative w-full bg-black font-sans text-white h-[300vh]">
      {/* Sticky viewport — locks chapter to screen as we scroll */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        {/* Cinematic background layer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChapter}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${current.bgImage}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
            <div
              className="absolute inset-0 mix-blend-multiply opacity-40 transition-colors duration-1000"
              style={{ backgroundColor: current.color }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Floating badge */}
        <div className="absolute top-8 left-8 md:left-16 z-50 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 text-[11px] text-white/80 uppercase tracking-[0.3em] font-mono backdrop-blur-md">
            <Smartphone className="w-4 h-4" />
            Indonesia Market Reality
          </div>
        </div>

        {/* Vertical timeline navigator (left) */}
        <div className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-8">
          {STORY_CHAPTERS.map((chapter, index) => {
            const isActive = activeChapter === index;
            return (
              <button
                key={chapter.id}
                onClick={() => scrollToChapter(index)}
                className="relative flex items-center group cursor-pointer"
              >
                <div className="flex flex-col items-center">
                  <span
                    className={`font-mono text-sm font-bold transition-colors duration-500 ${
                      isActive ? "text-white" : "text-white/30 group-hover:text-white/60"
                    }`}
                  >
                    {chapter.number}
                  </span>
                  {index < STORY_CHAPTERS.length - 1 && (
                    <div className="w-[1px] h-16 bg-white/10 mt-4 absolute top-6" />
                  )}
                </div>
                <span
                  className={`absolute left-10 uppercase tracking-[0.2em] text-[10px] whitespace-nowrap transition-all duration-500 ${
                    isActive
                      ? "opacity-100 translate-x-0 font-bold"
                      : "opacity-0 -translate-x-4 pointer-events-none"
                  }`}
                  style={{ color: chapter.color }}
                >
                  {chapter.shortTitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main content foreground */}
        <div className="relative z-20 w-full h-full flex flex-col justify-center pl-24 md:pl-48 pr-8 md:pr-16 max-w-7xl mx-auto pt-10 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChapter}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col h-full justify-center pointer-events-auto"
            >
              <h4
                className="font-mono text-sm md:text-base uppercase tracking-[0.3em] mb-4 transition-colors duration-700"
                style={{ color: current.color }}
              >
                {current.shortTitle}
              </h4>

              <h3
                className="text-4xl md:text-6xl lg:text-7xl font-medium leading-[1.1] tracking-tight text-white mb-8 max-w-4xl drop-shadow-2xl"
                style={{
                  background:
                    "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.55) 95%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor:  "transparent",
                  backgroundClip:       "text",
                }}
              >
                {current.title}
              </h3>

              <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-2xl mb-16 drop-shadow-lg">
                {current.description}
              </p>

              {/* Giant icons row */}
              <div className="flex flex-wrap md:flex-nowrap gap-12 md:gap-24 mt-auto pb-12">
                {current.metrics.map((metric, i) => {
                  const Icon = metric.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 + i * 0.1, type: "spring" }}
                      className="group relative flex flex-col items-start cursor-default"
                    >
                      <Icon
                        className="w-20 h-20 md:w-28 md:h-28 transition-all duration-500 ease-out group-hover:-translate-y-3 text-white/30 group-hover:text-white/80"
                        style={{ strokeWidth: 1.5 }}
                      />
                      <div className="mt-6 transition-all duration-500 group-hover:translate-x-2">
                        <h4 className="text-xl md:text-2xl font-bold text-white tracking-wide mb-1">
                          {metric.label}
                        </h4>
                        <p className="text-white/40 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                          {metric.value}
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-white/80" />
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
