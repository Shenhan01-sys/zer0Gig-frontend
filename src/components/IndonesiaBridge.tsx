"use client";

import { motion } from "framer-motion";
import { Smartphone, Wallet, ShieldCheck, Zap, TrendingUp, Users } from "lucide-react";

// Why zer0Gig for Indonesia (and emerging-market builders generally).
//
// Lead with the problem the way Dragon (0G DevRel) coached: feel the pain
// first, hear the solution second. The narrative comes from the founder:
// Indonesia's tech adoption is fast on the device side (everyone has a
// phone) but slow on the "build your own infrastructure" side (very few
// people actually run agents, hosted AI is priced for USD-earning users,
// service intermediaries get to mark up or outright defraud).
//
// zer0Gig sits between "I want an AI working for me" and "I have to learn
// LangChain + cloud + crypto rails" as the bridge. Hosted today, ownable
// tomorrow (the agent owns its own wallet — withdrawal flow on roadmap).

export default function IndonesiaBridge() {
  return (
    <section className="relative w-full bg-[#050810] py-24 px-6 overflow-hidden border-y border-white/[0.04]">
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 30%, rgba(56,189,248,0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-14 text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/55 mb-5 font-mono uppercase tracking-widest">
            <Smartphone className="w-3.5 h-3.5" />
            Why Indonesia First
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium mb-4 text-white leading-tight">
            Everyone here has a phone.
            <br className="hidden sm:block" />
            <span className="text-white/55">Almost nobody owns an agent.</span>
          </h2>
          <p className="text-white/55 text-[15px] max-w-2xl mx-auto leading-relaxed">
            Indonesia leapt to mobile-first faster than most of the world. But the next leap — having your own AI agent earn for you while you sleep — is gated by USD-priced SaaS, complex tooling, and middlemen who skim or outright defraud. zer0Gig is the bridge.
          </p>
        </motion.div>

        {/* ── The Problem (3 pain bullets, lead-with-pain) ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10"
        >
          <PainCard
            heading="USD pricing locks out IDR earners"
            body="Upwork, OpenAI Plus, Microsoft Copilot — priced for Western incomes. A 20 USD/month subscription is a meaningful expense for a warung owner. zer0Gig drains cost in OG at fractions of a cent per check-in."
          />
          <PainCard
            heading="Trust is broken on both sides"
            body="Hire a freelancer — pay upfront and pray. Pay a SaaS service — middleman can mark up, change terms, freeze accounts. Centralized rails make fraud profitable. On-chain escrow makes it impossible at the same scale."
          />
          <PainCard
            heading="Building agents requires too much"
            body="Run an agent today and you'll need LangChain, a cloud VM, an API key budget, a Telegram bot, a server certificate. Most people who could benefit from an agent will never set one up. zer0Gig handles the runtime — you just mint."
          />
        </motion.div>

        {/* ── How zer0Gig answers (4 capability tiles) ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <CapTile
            icon={<Wallet className="w-4 h-4" />}
            title="Agents own their wallet"
            body="Every agent has its own autonomous wallet (ERC-7857). It earns, holds, and pays other agents directly. Withdrawal flow lands on the agent-owner dashboard next."
          />
          <CapTile
            icon={<Zap className="w-4 h-4" />}
            title="0G Compute = local-economy pricing"
            body="LLM inference on the 0G stack is dramatically cheaper than centralized APIs. Margins that work for warungs, indie builders, and PT operations team — not just enterprises."
          />
          <CapTile
            icon={<ShieldCheck className="w-4 h-4" />}
            title="On-chain escrow, not third-party trust"
            body="No platform can freeze your funds. No middleman can change the deal after the fact. The contract holds the money until alignment attestation passes — that's the only gate."
          />
          <CapTile
            icon={<TrendingUp className="w-4 h-4" />}
            title="Boost humans, don't replace them"
            body="Agents handle the repeat work — daily reports, customer messages, alerts, content drafts — so the human focuses on judgment. The wallet is yours; the productivity is yours."
          />
        </motion.div>

        {/* ── Closing line (founder voice) ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          className="mt-12 max-w-3xl mx-auto rounded-2xl border border-white/10 bg-[#0d1525]/90 px-6 py-5 text-center"
        >
          <p className="text-white/80 text-[14px] sm:text-[15px] leading-relaxed">
            <Users className="w-4 h-4 inline-block mb-0.5 mr-2 text-white/45" />
            We&apos;re not betting that AI replaces Indonesia&apos;s workforce. We&apos;re betting it makes a single warung owner, a single Web3 builder, a single PT operations team
            <span className="text-white"> 10× more productive at the same cost</span>. The agent does the busywork. The wallet is yours. The on-chain receipts prove it.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ── presentational atoms ─────────────────────────────────────────────────────

function PainCard({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5">
      <p className="text-white font-medium text-[14px] mb-1.5">{heading}</p>
      <p className="text-white/50 text-[12.5px] leading-relaxed">{body}</p>
    </div>
  );
}

function CapTile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5 h-full">
      <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.05] border border-white/10 text-white/65 mb-3">
        {icon}
      </span>
      <p className="text-white font-medium text-[14px] mb-1.5">{title}</p>
      <p className="text-white/50 text-[12px] leading-relaxed">{body}</p>
    </div>
  );
}
