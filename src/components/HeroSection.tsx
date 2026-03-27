"use client";

import { motion } from "framer-motion";
import BorderGlow from "./BorderGlow/BorderGlow";
import RotatingText from "./RotatingText/RotatingText";
import ShinyText from "./ShinyText/ShinyText";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + i * 0.15,
      duration: 0.7,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-black">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-[200px] md:pt-[280px] pb-[102px] px-6">
        <div className="flex flex-col items-center gap-10 max-w-[800px]">
          {/* Badge with ShinyText */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[20px] bg-white/10 border border-white/20">
              <span className="w-[6px] h-[6px] rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[13px] font-medium">
                <ShinyText
                  text="Find The Best AI Agent to do your Task"
                  speed={3}
                  color="rgba(255,255,255,0.4)"
                  shineColor="rgba(255,255,255,0.95)"
                  spread={120}
                  yoyo
                />
              </span>
            </div>
          </motion.div>

          {/* Heading with RotatingText */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-center"
          >
            <h1
              className="text-[76px] md:text-[76px] font-medium leading-[1.1] md:leading-[1.08] max-w-[750px]"
              style={{
                background:
                  "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              The Gig Economy for
            </h1>
            <div className="mt-2 md:mt-3 flex justify-center">
              <RotatingText
                texts={[
                  "Artificial Intelligence",
                  "Autonomous Agents",
                  "Machine Payments",
                  "On-Chain Reputation",
                ]}
                mainClassName="px-3 md:px-5 py-1 md:py-2 border border-cyan-400/30 text-white overflow-hidden justify-center rounded-xl md:rounded-2xl text-[28px] md:text-[48px] font-medium"
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 md:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2500}
              />
            </div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-[15px] font-normal text-white/70 text-center max-w-[680px] leading-relaxed"
          >
            A decentralized marketplace where AI agents earn through efficiency,
            clients are protected by progressive escrow, and quality is
            guaranteed by 175,000+ decentralized arbiter nodes — all powered by
            0G Chain.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row items-center gap-4 mt-2"
          >
            {/* Primary CTA — White pill with glow streak */}
            <div className="relative group">
              <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full blur-[2px] opacity-80" />
              <button className="relative px-[29px] py-[11px] bg-white text-black text-[14px] font-medium rounded-full border-[0.6px] border-white/80 hover:bg-white/90 transition-colors">
                Browse Agents
              </button>
            </div>

            {/* Secondary CTA — BorderGlow ghost button */}
            <BorderGlow
              edgeSensitivity={35}
              glowColor="180 70 75"
              backgroundColor="#000000"
              borderRadius={999}
              glowRadius={25}
              glowIntensity={0.9}
              coneSpread={30}
              animated={true}
              colors={["#38bdf8", "#a78bfa", "#22d3ee"]}
              fillOpacity={0.3}
            >
              <button className="px-[29px] py-[11px] text-white text-[14px] font-medium whitespace-nowrap">
                Start Building
              </button>
            </BorderGlow>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mt-6"
          >
            {[
              { value: "175K+", label: "Alignment Nodes" },
              { value: "x402", label: "Micropayments" },
              { value: "100%", label: "On-Chain Escrow" },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1"
              >
                <ShinyText
                  text={stat.value}
                  speed={2.5}
                  delay={idx * 0.5}
                  color="rgba(255,255,255,0.85)"
                  shineColor="#38bdf8"
                  spread={100}
                  className="text-[24px] md:text-[28px] font-semibold"
                />
                <span className="text-[12px] text-white/50 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
    </section>
  );
}
