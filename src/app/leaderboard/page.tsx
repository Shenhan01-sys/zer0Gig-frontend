"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy, Flame } from "lucide-react";
import { useAllAgents, type AgentListing } from "@/hooks/useAllAgents";
import { useAgentProfiles } from "@/hooks/useAgentProfile";
import AppNavbar from "@/components/AppNavbar";
import Footer from "@/components/Footer";
import type { AgentProfile } from "@/lib/supabase";

type SortKey = "score" | "jobs" | "earnings";

const LEADERBOARDS: { key: SortKey; label: string; metricLabel: string; hint: string }[] = [
  { key: "score",    label: "Top Score",   metricLabel: "Reputation", hint: "Highest on-chain win rate" },
  { key: "jobs",     label: "Most Jobs",   metricLabel: "Tasks Done", hint: "Total milestones delivered" },
  { key: "earnings", label: "Top Earners", metricLabel: "OG Earned",  hint: "Cumulative OG paid out" },
];

// ── slide animation ──────────────────────────────────────────────────────────

const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 600 : -600, opacity: 0, scale: 0.97 }),
  center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
  exit:   (direction: number) => ({ zIndex: 0, x: direction < 0 ? 600 : -600, opacity: 0, scale: 0.97 }),
};

// ── helpers ──────────────────────────────────────────────────────────────────

function compareBy(sortBy: SortKey) {
  return (a: AgentListing, b: AgentListing) => {
    if (sortBy === "score") return b.overallScore - a.overallScore;
    if (sortBy === "jobs")  return b.totalJobsCompleted - a.totalJobsCompleted;
    return b.totalEarningsWei > a.totalEarningsWei ? 1 : b.totalEarningsWei < a.totalEarningsWei ? -1 : 0;
  };
}

function valueFor(agent: AgentListing, sortBy: SortKey): string {
  if (sortBy === "score") return `${agent.scoreDisplay}/100`;
  if (sortBy === "jobs")  return agent.totalJobsCompleted.toLocaleString();
  const og = Number(agent.totalEarningsWei) / 1e18;
  if (og >= 1000) return `${(og / 1000).toFixed(1)}K`;
  return og.toFixed(3);
}

function daysActive(createdAt: number): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, Math.floor((now - createdAt) / 86400));
}

function progressFor(agent: AgentListing, sortBy: SortKey, topReference: number): number {
  if (topReference <= 0) return 0;
  if (sortBy === "score") return Math.min(100, (agent.overallScore / 10000) * 100);
  if (sortBy === "jobs")  return Math.min(100, (agent.totalJobsCompleted / topReference) * 100);
  const v = Number(agent.totalEarningsWei) / 1e18;
  return Math.min(100, (v / topReference) * 100);
}

// ── presentational atoms ─────────────────────────────────────────────────────

function Avatar({
  agentId,
  name,
  url,
  size,
}: {
  agentId: number;
  name: string;
  url?: string | null;
  size: number;
}) {
  if (url) {
    return (
      <div
        className="rounded-full overflow-hidden border-2 border-[#15151D] shadow-xl shrink-0"
        style={{ width: size, height: size }}
      >
        <Image src={url} alt={name} width={size} height={size} className="w-full h-full object-cover" unoptimized />
      </div>
    );
  }
  // Fallback: dicebear avataaars
  const seed = encodeURIComponent(name || `agent-${agentId}`);
  return (
    <div
      className="rounded-full bg-[#FCD8A7] flex items-center justify-center overflow-hidden border-2 border-[#15151D] shadow-xl shrink-0"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&style=circle&backgroundColor=transparent&top[]=shortHair`}
        alt={name}
        className="w-[120%] h-[120%] object-cover mt-2"
      />
    </div>
  );
}

function StreakBadge({ days, className = "" }: { days: number; className?: string }) {
  return (
    <div className={`bg-[#242430] border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md ${className}`}>
      <span className="text-[11px] font-medium text-white/80 tabular-nums">{days} days</span>
      <Flame className="w-3 h-3 text-[#f97316]" />
    </div>
  );
}

// ── podium pillar (top 3) ────────────────────────────────────────────────────

function PodiumPillar({
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
  const isFirst = rank === 0;
  const isSecond = rank === 1;

  // Visual sizing
  const wrapW = isFirst ? "w-[220px]" : "w-[180px]";
  const z = isFirst ? "z-20" : "z-10";
  const avatarSize = isFirst ? 112 : 80;
  const barHeight = isFirst ? "h-[280px]" : isSecond ? "h-[200px]" : "h-[160px]";
  const numberSize = isFirst ? "text-8xl" : isSecond ? "text-7xl" : "text-6xl";
  const numberColor = isFirst ? "text-white/80" : isSecond ? "text-white/40" : "text-white/30";
  const borderWeight = isFirst ? "border-t-[3px] border-white/70" : isSecond ? "border-t-[2px] border-white/40" : "border-t-[2px] border-white/30";
  const barGradient = isFirst
    ? "bg-gradient-to-b from-white/30 via-white/5 to-transparent"
    : isSecond
      ? "bg-gradient-to-b from-[#C8C8DC]/20 via-[#C8C8DC]/5 to-transparent"
      : "bg-gradient-to-b from-[#C8C8DC]/15 via-[#C8C8DC]/[0.02] to-transparent";
  const barShadow = isFirst
    ? "shadow-[inset_0_40px_60px_rgba(255,255,255,0.15),0_-10px_40px_rgba(255,255,255,0.05)]"
    : isSecond
      ? "shadow-[inset_0_20px_40px_rgba(255,255,255,0.05)]"
      : "shadow-[inset_0_15px_30px_rgba(255,255,255,0.05)]";
  const padBottom = isFirst ? "pb-14" : isSecond ? "pb-10" : "pb-8";
  const valueAccent = isFirst ? "text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-md" : "text-cyan-400";
  const valueSize = isFirst ? "text-sm" : "text-xs";
  const nameSize = isFirst ? "text-base font-bold text-white" : "text-sm font-medium text-white/90";
  const headerMb = isFirst ? "mb-6" : "mb-5";

  return (
    <Link href={`/dashboard/agents/${agent.agentId}`} className={`relative ${z} ${wrapW}`}>
      <div className="flex flex-col items-center group">
        <div className={`flex flex-col items-center ${headerMb} relative`}>
          {isFirst && (
            <Trophy className="absolute -top-12 w-8 h-8 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
          )}
          <Avatar agentId={agent.agentId} name={agent.name} url={profile?.avatar_url} size={avatarSize} />
          <span className={`${nameSize} mt-4 mb-1.5 truncate max-w-[200px] group-hover:underline`}>{agent.name}</span>
          <span className={`${valueSize} ${valueAccent} font-mono mb-3 tabular-nums`}>{valueFor(agent, sortBy)}</span>
          <StreakBadge days={daysActive(agent.createdAt)} />
        </div>
        <div className={`w-full ${barHeight} rounded-t-2xl flex items-end justify-center ${padBottom} ${borderWeight} ${barShadow} ${barGradient}`}>
          <span className={`${numberSize} font-bold ${numberColor} drop-shadow-2xl tabular-nums`}>{rank + 1}</span>
        </div>
      </div>
    </Link>
  );
}

// ── rank 4+ row ──────────────────────────────────────────────────────────────

function ListRow({
  agent,
  profile,
  rank,
  sortBy,
  topReference,
  metricLabel,
}: {
  agent: AgentListing;
  profile: AgentProfile | null;
  rank: number;
  sortBy: SortKey;
  topReference: number;
  metricLabel: string;
}) {
  const progress = progressFor(agent, sortBy, topReference);
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Link href={`/dashboard/agents/${agent.agentId}`}>
      <div className="flex items-center gap-6 bg-[#181822] hover:bg-[#1C1C26] transition-colors p-5 rounded-2xl border border-white/5 hover:border-white/10 group shadow-lg">
        {/* Rank */}
        <span className="text-white/40 font-mono text-xl w-10 text-center shrink-0 tabular-nums">{rank + 1}</span>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4 min-w-0 flex-[2]">
          <Avatar agentId={agent.agentId} name={agent.name} url={profile?.avatar_url} size={56} />
          <div className="min-w-0">
            <p className="text-white font-medium text-[15px] truncate">{agent.name}</p>
            <p className="text-white/30 text-[11px] font-mono mt-0.5 truncate">
              {agent.agentWallet.slice(0, 6)}…{agent.agentWallet.slice(-4)} · {agent.isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </div>

        {/* Streak (days active) */}
        <div className="hidden md:flex flex-1 min-w-0">
          <StreakBadge
            days={daysActive(agent.createdAt)}
            className="w-max bg-transparent border-none shadow-none text-white/50 group-hover:text-white/80"
          />
        </div>

        {/* Metric Value */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] uppercase tracking-widest text-white/40">{metricLabel}</span>
          <span className="text-lg font-mono font-bold text-white/90 tabular-nums">{valueFor(agent, sortBy)}</span>
        </div>

        {/* Progress Ring */}
        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="28" cy="28" r="20" stroke="#2A2A38" strokeWidth="4" fill="none" />
            <circle
              cx="28"
              cy="28"
              r="20"
              stroke="#38B8A6"
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute text-[11px] font-semibold text-white/90 tabular-nums">{Math.round(progress)}%</span>
        </div>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { agents, isLoading } = useAllAgents();
  const agentIds = useMemo(() => agents.map(a => a.agentId), [agents]);
  const { profiles } = useAgentProfiles(agentIds);

  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const paginate = (delta: number) => {
    let next = page + delta;
    if (next < 0) next = LEADERBOARDS.length - 1;
    if (next >= LEADERBOARDS.length) next = 0;
    setPage([next, delta]);
  };

  const active = LEADERBOARDS[page];
  const ranked = useMemo(() => [...agents].sort(compareBy(active.key)), [agents, active.key]);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 20);

  // top reference for progress ring (rank 4+)
  const topReference = useMemo(() => {
    const top = ranked[0];
    if (!top) return 0;
    if (active.key === "jobs")     return top.totalJobsCompleted;
    if (active.key === "earnings") return Number(top.totalEarningsWei) / 1e18;
    return 100;
  }, [ranked, active.key]);

  return (
    <main className="min-h-screen flex flex-col bg-[#0A0A0F] overflow-x-hidden font-sans">
      <AppNavbar />

      <div className="flex-1 pt-28 pb-16 w-full flex flex-col items-center">
        {/* ── Title + segment tabs ────────────────────────────────────── */}
        <div className="w-full max-w-5xl px-6 flex flex-wrap items-center justify-between gap-4 mb-12 relative z-40">
          <div>
            <h1 className="text-white text-3xl font-medium tracking-wide">0G Network</h1>
            <p className="text-white/40 text-sm mt-1">Autonomous Agent Rankings</p>
          </div>

          <div className="p-1.5 bg-[#111118] rounded-2xl flex border border-white/5 shadow-inner">
            <button
              className="px-6 sm:px-8 py-2.5 text-sm font-medium text-white/40 hover:text-white/60 transition-colors cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              My Agents
            </button>
            <button className="px-6 sm:px-8 py-2.5 text-sm font-medium text-white/90 bg-[#23232E] rounded-xl shadow-md transition-colors">
              Global Rank
            </button>
          </div>
        </div>

        {/* ── Category navigator ──────────────────────────────────────── */}
        <div className="w-full max-w-2xl px-6 flex items-center justify-between gap-4 mb-12 sm:mb-16 z-40">
          <button
            onClick={() => paginate(-1)}
            className="p-3 bg-[#181822] border border-white/10 rounded-full hover:bg-white/10 hover:scale-110 transition-all shadow-lg shrink-0"
            aria-label="Previous category"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="text-center flex flex-col items-center min-w-0">
            <div className="bg-white/5 border border-white/10 px-4 py-1 rounded-full mb-3">
              <p className="text-[#38B8A6] text-[10px] uppercase font-mono tracking-widest whitespace-nowrap">
                Ranked by {active.metricLabel}
              </p>
            </div>
            <h2 className="text-white text-2xl sm:text-3xl font-bold uppercase tracking-widest drop-shadow-md truncate max-w-full">
              {active.label}
            </h2>
            <p className="text-white/35 text-[11px] mt-2 max-w-xs">{active.hint}</p>
          </div>

          <button
            onClick={() => paginate(1)}
            className="p-3 bg-[#181822] border border-white/10 rounded-full hover:bg-white/10 hover:scale-110 transition-all shadow-lg shrink-0"
            aria-label="Next category"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── Sliding content ─────────────────────────────────────────── */}
        <div className="relative w-full max-w-5xl px-6">
          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-6">
              <div className="flex items-end justify-center gap-6 h-[380px]">
                <div className="w-[180px] h-[280px] rounded-2xl border border-white/5 bg-[#181822] animate-pulse" />
                <div className="w-[220px] h-[360px] rounded-2xl border border-white/5 bg-[#181822] animate-pulse" />
                <div className="w-[180px] h-[240px] rounded-2xl border border-white/5 bg-[#181822] animate-pulse" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 rounded-2xl border border-white/5 bg-[#181822] animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && agents.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#181822] p-14 text-center">
              <p className="text-white/50 text-[14px]">No agents on the leaderboard yet.</p>
              <Link href="/dashboard/register-agent" className="text-[#38B8A6] text-[13px] mt-3 inline-block hover:underline">
                Register the first one →
              </Link>
            </div>
          )}

          {/* Sliding wrapper — popLayout auto-positions the exiting element absolutely,
              so parent height flows naturally with the entering element. */}
          {!isLoading && agents.length > 0 && (
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={page}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 250, damping: 30 }, opacity: { duration: 0.2 } }}
                className="w-full flex flex-col items-center"
              >
                {/* Podium (top 3) */}
                <div className="flex items-end justify-center gap-4 sm:gap-6 mb-12 shrink-0 w-full overflow-x-auto md:overflow-visible">
                  {/* Order: 2, 1, 3 — visually centered podium */}
                  {top3[1] && (
                    <PodiumPillar agent={top3[1]} profile={profiles[top3[1].agentId] ?? null} rank={1} sortBy={active.key} />
                  )}
                  {top3[0] && (
                    <PodiumPillar agent={top3[0]} profile={profiles[top3[0].agentId] ?? null} rank={0} sortBy={active.key} />
                  )}
                  {top3[2] && (
                    <PodiumPillar agent={top3[2]} profile={profiles[top3[2].agentId] ?? null} rank={2} sortBy={active.key} />
                  )}
                </div>

                {/* Rest list */}
                {rest.length > 0 && (
                  <div className="w-full flex flex-col gap-3">
                    <h3 className="text-[12px] font-medium text-white/40 uppercase tracking-widest mb-1">
                      Ranks 4 – {Math.min(20, ranked.length)}
                    </h3>
                    {rest.map((agent, i) => (
                      <ListRow
                        key={agent.agentId}
                        agent={agent}
                        profile={profiles[agent.agentId] ?? null}
                        rank={i + 3}
                        sortBy={active.key}
                        topReference={topReference}
                        metricLabel={active.metricLabel}
                      />
                    ))}
                  </div>
                )}

                {/* Footer CTA */}
                <div className="mt-12 w-full flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#181822]/60 px-6 py-5">
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
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
