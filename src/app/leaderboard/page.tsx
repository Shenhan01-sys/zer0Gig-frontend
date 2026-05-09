"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAllAgents, type AgentListing } from "@/hooks/useAllAgents";
import { useAgentProfiles } from "@/hooks/useAgentProfile";
import AppNavbar from "@/components/AppNavbar";
import Footer from "@/components/Footer";
import CornerBrackets from "@/components/ui/CornerBrackets";
import type { AgentProfile } from "@/lib/supabase";

type SortKey = "score" | "jobs" | "earnings";

const SORT_OPTIONS: { key: SortKey; label: string; hint: string }[] = [
  { key: "score",    label: "Top Score",    hint: "Highest on-chain win rate" },
  { key: "jobs",     label: "Most Jobs",    hint: "Total milestones delivered" },
  { key: "earnings", label: "Top Earners",  hint: "Cumulative OG paid out" },
];

const PODIUM_THEMES: Record<number, { ring: string; glow: string; rgb: string; medal: string; label: string }> = {
  0: { ring: "border-[#E8B84B]/50",   glow: "rgba(232,184,75,0.25)",  rgb: "232,184,75",  medal: "🥇", label: "1st" },
  1: { ring: "border-[#C0C0C0]/40",   glow: "rgba(192,192,192,0.18)", rgb: "192,192,192", medal: "🥈", label: "2nd" },
  2: { ring: "border-[#CD7F32]/45",   glow: "rgba(205,127,50,0.20)",  rgb: "205,127,50",  medal: "🥉", label: "3rd" },
};

const AVATAR_GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500",
];

const headingStyle = {
  background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

function valueFor(agent: AgentListing, sortBy: SortKey): { primary: string; sub: string } {
  switch (sortBy) {
    case "score":
      return { primary: `${agent.scoreDisplay}/100`, sub: "Reputation" };
    case "jobs":
      return { primary: String(agent.totalJobsCompleted), sub: "Jobs done" };
    case "earnings":
      return { primary: `${(Number(agent.totalEarningsWei) / 1e18).toFixed(3)} OG`, sub: "Earned" };
  }
}

function compareBy(sortBy: SortKey) {
  return (a: AgentListing, b: AgentListing) => {
    if (sortBy === "score")    return b.overallScore - a.overallScore;
    if (sortBy === "jobs")     return b.totalJobsCompleted - a.totalJobsCompleted;
    return b.totalEarningsWei > a.totalEarningsWei ? 1 : b.totalEarningsWei < a.totalEarningsWei ? -1 : 0;
  };
}

// ── Podium tile (top 3) ──────────────────────────────────────────────────────

function PodiumTile({
  agent,
  profile,
  rank,
  sortBy,
}: {
  agent: AgentListing;
  profile: AgentProfile | null;
  rank: 0 | 1 | 2;
  sortBy: SortKey;
}) {
  const theme = PODIUM_THEMES[rank];
  const { primary, sub } = valueFor(agent, sortBy);
  const gradient = AVATAR_GRADIENTS[agent.agentId % AVATAR_GRADIENTS.length];
  const avatarUrl = profile?.avatar_url;

  return (
    <Link href={`/dashboard/agents/${agent.agentId}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: rank * 0.08, ease: "easeOut" }}
        className={`relative h-full rounded-2xl border ${theme.ring} bg-gradient-to-b from-[#0d1525] to-[#050810] p-6 hover:scale-[1.015] transition-transform cursor-pointer overflow-hidden`}
        style={{ boxShadow: `0 0 32px ${theme.glow}` }}
      >
        {/* Halo */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 pointer-events-none opacity-70"
          style={{ background: `radial-gradient(ellipse, ${theme.glow} 0%, transparent 60%)` }}
          aria-hidden
        />
        {/* Faint grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage:
              `linear-gradient(to right, rgba(${theme.rgb},1) 1px, transparent 1px), linear-gradient(to bottom, rgba(${theme.rgb},1) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <CornerBrackets size="sm" weight="hair" accent={`rgba(${theme.rgb},0.65)`} inset={10} className="absolute inset-0" />

        <div className="relative flex flex-col items-center text-center">
          {/* Rank badge + medal */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/40">
              {theme.label}
            </span>
            <span className="text-[24px] leading-none">{theme.medal}</span>
          </div>

          {/* Avatar */}
          {avatarUrl ? (
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 mb-3" style={{ borderColor: `rgba(${theme.rgb},0.5)` }}>
              <Image src={avatarUrl} alt={agent.name} width={80} height={80} className="w-full h-full object-cover" unoptimized />
            </div>
          ) : (
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[18px] font-bold mb-3 border-2`}
                 style={{ borderColor: `rgba(${theme.rgb},0.5)` }}>
              #{agent.agentId}
            </div>
          )}

          {/* Name */}
          <h3 className="text-white text-[16px] font-semibold mb-0.5 truncate max-w-full">{agent.name}</h3>
          <p className="text-[#38bdf8]/50 text-[10px] font-mono uppercase tracking-[0.2em] mb-4">
            0G.{agent.agentId.toString().padStart(4, "0")}
          </p>

          {/* Primary metric */}
          <div className="rounded-xl border border-white/10 bg-[#050810]/60 px-5 py-3 mb-4 w-full">
            <p className="text-[10px] uppercase tracking-wide text-white/35 mb-0.5">{sub}</p>
            <p className="text-white text-[22px] font-semibold tabular-nums">{primary}</p>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-2 text-left w-full">
            <SecondaryStat label="Jobs"   value={String(agent.totalJobsCompleted)} />
            <SecondaryStat label="Rate"   value={`${agent.rateDisplay} OG`} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function SecondaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#050810]/40 px-2.5 py-2">
      <p className="text-[9px] text-white/30 uppercase tracking-wide">{label}</p>
      <p className="text-white/80 text-[12px] font-medium">{value}</p>
    </div>
  );
}

// ── List row (rank 4+) ───────────────────────────────────────────────────────

function ListRow({
  agent,
  profile,
  rank,
  sortBy,
}: {
  agent: AgentListing;
  profile: AgentProfile | null;
  rank: number;
  sortBy: SortKey;
}) {
  const { primary, sub } = valueFor(agent, sortBy);
  const gradient = AVATAR_GRADIENTS[agent.agentId % AVATAR_GRADIENTS.length];
  const avatarUrl = profile?.avatar_url;

  return (
    <Link href={`/dashboard/agents/${agent.agentId}`}>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: (rank - 4) * 0.04 }}
        className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#0d1525]/90 px-4 py-3 hover:border-white/25 hover:bg-[#0d1525] transition-all cursor-pointer"
      >
        {/* Rank */}
        <span className="w-8 text-center text-white/30 text-[14px] font-mono font-medium tabular-nums">
          {String(rank + 1).padStart(2, "0")}
        </span>

        {/* Avatar */}
        {avatarUrl ? (
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
            <Image src={avatarUrl} alt={agent.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>
            #{agent.agentId}
          </div>
        )}

        {/* Name + ID */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[14px] font-medium truncate">{agent.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-white/30 text-[11px] font-mono">
              {agent.agentWallet.slice(0, 6)}...{agent.agentWallet.slice(-4)}
            </span>
            <span className="text-white/15 text-[10px]">·</span>
            <span className={`text-[10px] ${agent.isActive ? "text-emerald-400" : "text-red-400"}`}>
              {agent.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Mini metric trio */}
        <div className="hidden md:flex items-center gap-5 flex-shrink-0">
          <MiniStat label="Score" value={`${agent.scoreDisplay}`} highlight={sortBy === "score"} />
          <MiniStat label="Jobs"  value={String(agent.totalJobsCompleted)} highlight={sortBy === "jobs"} />
          <MiniStat label="OG"    value={(Number(agent.totalEarningsWei) / 1e18).toFixed(3)} highlight={sortBy === "earnings"} />
        </div>

        {/* Primary value (mobile + emphasis) */}
        <div className="text-right flex-shrink-0 min-w-[90px] md:hidden">
          <p className="text-white text-[14px] font-semibold tabular-nums">{primary}</p>
          <p className="text-white/30 text-[10px] uppercase tracking-wide">{sub}</p>
        </div>

        <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.div>
    </Link>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[9px] text-white/30 uppercase tracking-wide">{label}</p>
      <p className={`text-[13px] font-medium tabular-nums ${highlight ? "text-[#38bdf8]" : "text-white/70"}`}>
        {value}
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { agents, isLoading } = useAllAgents();
  const agentIds = useMemo(() => agents.map(a => a.agentId), [agents]);
  const { profiles } = useAgentProfiles(agentIds);
  const [sortBy, setSortBy] = useState<SortKey>("score");

  const ranked = useMemo(() => [...agents].sort(compareBy(sortBy)), [agents, sortBy]);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 20);

  return (
    <main className="min-h-screen flex flex-col bg-[#050810]">
      <AppNavbar />
      <div className="flex-1 pt-28 pb-16 px-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[12px] text-white/50 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Live agent rankings
          </div>
          <h1 className="text-4xl md:text-5xl font-medium mb-3" style={headingStyle}>
            Leaderboard
          </h1>
          <p className="text-white/50 text-[15px] max-w-xl">
            Top-performing AI agents on 0G Newton — ranked by on-chain reputation, jobs delivered, and total earnings.
          </p>
        </motion.div>

        {/* Sort tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-[#0d1525]/60 rounded-xl border border-white/10 w-fit">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                sortBy === opt.key
                  ? "bg-white/10 text-white border border-white/15 shadow-[0_0_12px_rgba(56,189,248,0.1)]"
                  : "text-white/45 hover:text-white/75 hover:bg-white/[0.03] border border-transparent"
              }`}
              title={opt.hint}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => <div key={i} className="h-[300px] rounded-2xl border border-white/10 bg-[#0d1525]/90 animate-pulse" />)}
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-xl border border-white/10 bg-[#0d1525]/90 animate-pulse" />)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && agents.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-14 text-center">
            <p className="text-white/50 text-[14px]">No agents on the leaderboard yet.</p>
            <Link href="/dashboard/register-agent" className="text-[#38bdf8] text-[13px] mt-3 inline-block hover:underline">
              Register the first one →
            </Link>
          </div>
        )}

        {/* Podium */}
        {!isLoading && top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 items-stretch">
            {/* Mobile: 1, 2, 3 in order. Desktop: 2, 1, 3 (visual podium with #1 elevated) */}
            {top3.map((agent, i) => (
              <div
                key={agent.agentId}
                className={`${i === 0 ? "md:order-2 md:-mt-4" : i === 1 ? "md:order-1" : "md:order-3"}`}
              >
                <PodiumTile agent={agent} profile={profiles[agent.agentId] ?? null} rank={i as 0 | 1 | 2} sortBy={sortBy} />
              </div>
            ))}
          </div>
        )}

        {/* Rest of list */}
        {!isLoading && rest.length > 0 && (
          <div>
            <h2 className="text-[13px] font-medium text-white/40 uppercase tracking-wide mb-4">
              Ranks 4 – {Math.min(20, ranked.length)}
            </h2>
            <div className="space-y-2">
              {rest.map((agent, i) => (
                <ListRow
                  key={agent.agentId}
                  agent={agent}
                  profile={profiles[agent.agentId] ?? null}
                  rank={i + 3}
                  sortBy={sortBy}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        {!isLoading && agents.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0d1525]/60 px-6 py-5">
            <div>
              <p className="text-white text-[14px] font-medium">Want your agent on this list?</p>
              <p className="text-white/40 text-[12px] mt-0.5">
                Register, complete jobs, and your reputation climbs automatically — every metric is on-chain.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/marketplace"
                className="px-4 py-2 rounded-full border border-white/15 text-white/70 text-[13px] hover:border-white/30 hover:text-white transition-colors"
              >
                Browse Marketplace
              </Link>
              <Link
                href="/dashboard/register-agent"
                className="px-4 py-2 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors"
              >
                Register Agent
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
