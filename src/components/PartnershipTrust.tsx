"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Handshake, GraduationCap, Layers, ExternalLink } from "lucide-react";

// Trust signals for the landing page, ordered strongest → most forward-looking
// per Dragon's "show consistency not just a big launch moment" framing.
//
//   1. BUILT ON      — concrete infrastructure dependencies (most defensible)
//   2. VALIDATED BY  — soft endorsements + ecosystem context
//   3. ROADMAP       — pipeline partners (honestly framed, no overclaim)
//
// Logos are intentionally text-first instead of image-first. We don't ship
// partner logos we haven't been explicitly authorized to use, and a sober
// text wall reads more credible than a generic logo soup for a hackathon
// project at this stage.

const BUILT_ON = [
  { name: "0G Chain",           sub: "Settlement layer (Newton testnet, Chain ID 16602)" },
  { name: "0G Storage",         sub: "Encrypted briefs + outputs, merkle-rooted" },
  { name: "0G Compute",         sub: "Decentralized LLM inference (TEE-verified)" },
  { name: "0G KV",              sub: "Agent persistent memory" },
  { name: "0G Alignment Nodes", sub: "ECDSA quality attestation" },
  { name: "Privy",              sub: "Wallet + social login" },
  { name: "Supabase",           sub: "Off-chain profile / chat / activity feed" },
  { name: "Vercel · Railway",   sub: "Frontend + agent-runtime hosting" },
];

const VALIDATED_BY = [
  {
    org:  "Halim Budi Santoso",
    sub:  "Computing Head, UKDW Yogyakarta",
    note: "Private demo + endorsement on 2026-05-11",
    href: null,
  },
  {
    org:  "0G APAC Hackathon 2026",
    sub:  "Track 3 — Agentic Economy",
    note: "First production deployment of ERC-7857 + ERC-8183 on 0G",
    href: "https://0g.ai",
  },
  {
    org:  "0G Labs research",
    sub:  "ERC-7857 (Intelligent NFT) origin",
    note: "We ship the standard proposed by 0G's team",
    href: "https://eips.ethereum.org/EIPS/eip-7857",
  },
];

export default function PartnershipTrust() {
  return (
    <section className="relative w-full bg-[#050810] py-24 px-6 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/55 mb-5 font-mono uppercase tracking-widest">
            <Handshake className="w-3.5 h-3.5" />
            Trust Layer
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium mb-4 text-white">
            Built on real infrastructure.
            <br className="hidden sm:block" />
            <span className="text-white/55">Backed by real people.</span>
          </h2>
          <p className="text-white/55 text-[14px] max-w-xl mx-auto">
            No vapor logos. Three honest layers of trust — the protocols we use today, the partners who endorsed us, and the pipeline we&apos;re onboarding next.
          </p>
        </motion.div>

        {/* ── 1. BUILT ON ──────────────────────────────────────────────────── */}
        <Section
          title="Built on"
          icon={<Layers className="w-4 h-4 text-white/55" />}
          subtitle="Infrastructure dependencies we run in production today"
          delay={0.1}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {BUILT_ON.map(b => (
              <div
                key={b.name}
                className="rounded-xl border border-white/10 bg-[#0d1525]/90 px-4 py-3"
              >
                <p className="text-white text-[13px] font-medium mb-0.5">{b.name}</p>
                <p className="text-white/40 text-[11px] leading-snug">{b.sub}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 2. VALIDATED BY ─────────────────────────────────────────────── */}
        <Section
          title="Validated by"
          icon={<GraduationCap className="w-4 h-4 text-white/55" />}
          subtitle="Academic + ecosystem endorsements"
          delay={0.2}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {VALIDATED_BY.map(v => (
              <div
                key={v.org}
                className="rounded-xl border border-white/10 bg-[#0d1525]/90 px-5 py-4 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white text-[14px] font-medium leading-tight">{v.org}</p>
                  {v.href && (
                    <a
                      href={v.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white/35 hover:text-white/70 shrink-0 mt-0.5"
                      aria-label="External link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-white/50 text-[12px] mt-0.5">{v.sub}</p>
                <p className="text-white/35 text-[11.5px] mt-3 leading-relaxed">{v.note}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 3. ROADMAP PARTNERS (honest, no logo overclaim) ──────────────── */}
        <Section
          title="Onboarding next"
          icon={<Handshake className="w-4 h-4 text-white/55" />}
          subtitle="Pipeline partners in motion — not a launch logo wall"
          delay={0.3}
        >
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-[260px]">
                <p className="text-white text-[15px] font-medium mb-1">
                  5–8 Indonesian PT partners
                </p>
                <p className="text-white/55 text-[13px] leading-relaxed">
                  Coalition opened on 2026-05-11 with{" "}
                  <a
                    href="https://www.linkedin.com/in/jadid-purwaka-aji-408961144/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white underline underline-offset-2 hover:no-underline"
                  >
                    Jadid Purwaka Aji
                  </a>
                  {" "}— Indonesia Startup Ecosystem Player &amp; Community Builder. Partners onboarding through Q3 2026.
                </p>
              </div>
              <Link
                href="/marketplace/agents-for-sale"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/15 hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.06] text-[12px] font-medium text-white/75 hover:text-white transition-all shrink-0"
              >
                Browse Agents
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Partner pipeline placeholders — opacity-30 to signal "in motion" */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 opacity-40">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-dashed border-white/15 bg-[#050810]/40 px-2 py-3 text-center"
                >
                  <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">
                    PT #{i + 1}
                  </p>
                  <p className="text-[9px] text-white/25 mt-0.5">Coming soon</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </section>
  );
}

function Section({
  title, subtitle, icon, delay, children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className="mb-10"
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-white/85 text-[12px] uppercase tracking-widest font-medium">
          {title}
        </p>
      </div>
      <p className="text-white/40 text-[12px] mb-4 pl-6">{subtitle}</p>
      {children}
    </motion.div>
  );
}
