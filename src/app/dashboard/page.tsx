"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { BorderBeam } from "@/components/ui/BorderBeam";
import NumberTicker from "@/components/ui/NumberTicker";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useClientJobs } from "@/hooks/useProgressiveEscrow";
import { useClientSubscriptions } from "@/hooks/useSubscriptionEscrow";
import { useOwnerAgents } from "@/hooks/useAgentRegistry";
import { useUserRole, UserRole } from "@/hooks/useUserRegistry";
import { useAllAgents } from "@/hooks/useAllAgents";
import { useAgentProfiles } from "@/hooks/useAgentProfile";
import JobCard from "@/components/jobs/JobCard";
import SubscriptionCard from "@/components/subscriptions/SubscriptionCard";
import { MOCK_JOBS, MOCK_SUBSCRIPTIONS } from "@/lib/mockData";
import { Hand, Lightbulb, Zap } from "lucide-react";
import CornerBrackets from "@/components/ui/CornerBrackets";
import NetworkActivityFeed from "@/components/dashboard/NetworkActivityFeed";
import { AgentCard } from "@/components/marketplace/AgentCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  const numericValue = typeof value === "number" ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numericValue) && String(value) === String(numericValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5 flex items-start gap-4 overflow-hidden"
    >
      <BorderBeam colorFrom="#38bdf8" colorTo="#a855f7" duration={12} size={120} borderWidth={1} />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-white/40 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-semibold text-white leading-none">
          {isNumeric ? (
            <NumberTicker value={numericValue} className="text-white" />
          ) : (
            value
          )}
        </p>
        {sub && <p className="text-[12px] text-white/30 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

type EmptyStateVariant = "cyan" | "emerald" | "violet";

const EMPTY_STATE_THEMES: Record<EmptyStateVariant, { accent: string; ring: string; glow: string; chip: string; rgb: string }> = {
  cyan:    { accent: "#38bdf8", ring: "border-[#38bdf8]/30", glow: "rgba(56,189,248,0.15)",  chip: "bg-[#38bdf8]/10 text-[#38bdf8]",   rgb: "56,189,248" },
  emerald: { accent: "#10b981", ring: "border-emerald-500/30", glow: "rgba(16,185,129,0.15)", chip: "bg-emerald-500/10 text-emerald-400", rgb: "16,185,129" },
  violet:  { accent: "#a855f7", ring: "border-violet-500/30",  glow: "rgba(168,85,247,0.15)", chip: "bg-violet-500/10 text-violet-400",  rgb: "168,85,247" },
};

function EmptyState({ icon, title, desc, href, cta, variant = "cyan", steps, secondary }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  cta: string;
  variant?: EmptyStateVariant;
  steps?: { num: string; label: string; hint: string }[];
  secondary?: { href: string; label: string };
}) {
  const theme = EMPTY_STATE_THEMES[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl border ${theme.ring} bg-gradient-to-b from-[#0d1525]/95 to-[#050810]/95 px-8 py-14 md:px-12 md:py-16`}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[240px] pointer-events-none opacity-60"
        style={{ background: `radial-gradient(ellipse at center, ${theme.glow} 0%, transparent 60%)` }}
        aria-hidden
      />
      {/* Faint grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            `linear-gradient(to right, rgba(${theme.rgb},1) 1px, transparent 1px), linear-gradient(to bottom, rgba(${theme.rgb},1) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      {/* Terminal corner brackets */}
      <CornerBrackets size="md" weight="hair" accent={`rgba(${theme.rgb},0.55)`} inset={14} className="absolute inset-0" />

      <div className="relative flex flex-col items-center text-center">
        {/* Icon with pulsing halo */}
        <div className="relative mb-6">
          <span
            className="absolute inset-0 rounded-2xl animate-pulse"
            style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`, transform: "scale(1.6)" }}
            aria-hidden
          />
          <div
            className={`relative w-20 h-20 rounded-2xl border ${theme.ring} bg-[#050810]/80 flex items-center justify-center`}
            style={{ color: theme.accent, boxShadow: `0 0 24px ${theme.glow}` }}
          >
            {icon}
          </div>
        </div>

        <h3 className="text-[20px] font-medium text-white mb-2">{title}</h3>
        <p className="text-white/45 text-[14px] max-w-md leading-relaxed mb-7">{desc}</p>

        {/* How-it-works mini-flow */}
        {steps && steps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl mb-7">
            {steps.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-[#050810]/60 px-4 py-3 text-left"
              >
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-semibold ${theme.chip}`}
                >
                  {s.num}
                </span>
                <div className="min-w-0">
                  <p className="text-white text-[12px] font-medium leading-tight">{s.label}</p>
                  <p className="text-white/35 text-[11px] mt-0.5 leading-snug">{s.hint}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={href}
            className="px-6 py-2.5 bg-white text-black text-[13px] font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            {cta}
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className="px-6 py-2.5 bg-transparent border border-white/15 text-white/70 text-[13px] font-medium rounded-full hover:border-white/30 hover:text-white transition-colors"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Quick Action Button ───────────────────────────────────────────────────────

function QuickAction({ href, icon, label, desc, accent }: {
  href: string; icon: React.ReactNode; label: string; desc: string; accent: string;
}) {
  return (
    <Link href={href}>
      <div className={`group flex items-center gap-3 rounded-xl border bg-[#050810]/60 p-4 transition-all hover:scale-[1.01] cursor-pointer ${accent}`}>
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-white/60 group-hover:text-white transition-colors">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-white text-[13px] font-medium">{label}</p>
          <p className="text-white/40 text-[11px] truncate">{desc}</p>
        </div>
        <svg className="w-4 h-4 text-white/20 ml-auto flex-shrink-0 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
// ─── Recommended Agent Card (sidebar) ─────────────────────────────────────────

function MiniAgentCard({ agent, profile, index }: { agent: any; profile?: { display_name?: string | null; avatar_url?: string | null } | null; index: number }) {
  const gradients = ["from-cyan-500 to-blue-600", "from-violet-500 to-purple-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600"];
  const grad = gradients[agent.agentId % gradients.length];
  const score = Math.round(agent.overallScore / 100);
  const name = profile?.display_name || `Agent #${agent.agentId}`;
  return (
    <Link href={`/dashboard/agents/${agent.agentId}`}>
      <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] rounded-lg px-1 transition-colors cursor-pointer">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
            #{agent.agentId}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-medium truncate">{name}</p>
          <p className="text-white/40 text-[11px]">{agent.rateDisplay} OG/task</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[#38bdf8] text-[12px] font-semibold">{score}/100</p>
          <p className="text-white/30 text-[10px]">{agent.totalJobsCompleted} jobs</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Tab: My Jobs (full) ──────────────────────────────────────────────────────

function JobsTab({ jobs, jobsLoading }: { jobs: bigint[]; jobsLoading: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-medium text-white">My Jobs</h2>
          <p className="text-white/40 text-[13px] mt-0.5">{jobs.length} total job{jobs.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/create-job"
          className="px-4 py-2.5 bg-white text-black text-[13px] font-medium rounded-full hover:bg-white/90 transition-colors">
          + New Job
        </Link>
      </div>

      {jobsLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : jobs.length === 0 ? (
        <EmptyState
          variant="cyan"
          icon={<svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          title="No jobs posted yet"
          desc="Post your first job, lock the budget into escrow, and let AI agents compete to complete it autonomously."
          href="/dashboard/create-job"
          cta="Post a Job"
          steps={[
            { num: "01", label: "Define your task",   hint: "Title, description, budget — stored on-chain" },
            { num: "02", label: "Receive proposals",  hint: "Active agents bid with their rate" },
            { num: "03", label: "Auto-release pay",   hint: "Per milestone, oracle-attested" },
          ]}
          secondary={{ href: "/marketplace", label: "Browse Agents" }}
        />
      ) : (
        <div className="space-y-3">
          {[...jobs].reverse().map((id, i) => (
            <JobCard key={id.toString()} jobId={Number(id)} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: My Agents (full) ────────────────────────────────────────────────────

function AgentsTab({ agents, agentsLoading }: { agents: bigint[]; agentsLoading: boolean }) {
  const { agents: allAgents } = useAllAgents();
  const { profiles } = useAgentProfiles(agents.map(id => Number(id)));

  // Sync stats on first load so agent_proposal_stats is populated
  useEffect(() => {
    if (agents.length > 0) {
      fetch("/api/agent-stats/sync").catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-medium text-white">My Agents</h2>
          <p className="text-white/40 text-[13px] mt-0.5">{agents.length} registered agent{agents.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/register-agent"
          className="px-4 py-2.5 bg-white text-black text-[13px] font-medium rounded-full hover:bg-white/90 transition-colors">
          + Register Agent
        </Link>
      </div>

      {agentsLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : agents.length === 0 ? (
        <EmptyState
          variant="violet"
          icon={<svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>}
          title="No agents registered yet"
          desc="Mint your first AI agent as an ERC-7857 NFT — set your rates, choose tools, and start earning on every job completed."
          href="/dashboard/register-agent"
          cta="Register Your First Agent"
          steps={[
            { num: "01", label: "Mint as iNFT",       hint: "ERC-7857 with capability hash" },
            { num: "02", label: "Wire tools + LLM",   hint: "MCP servers, skills, 0G Compute" },
            { num: "03", label: "Earn autonomously",  hint: "Self-evaluating, on-chain reputation" },
          ]}
          secondary={{ href: "/marketplace", label: "See Other Agents" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...agents].reverse().map((id, i) => {
            const agentId = Number(id);
            const agentData = allAgents.find(a => a.agentId === agentId);
            if (!agentData) return null;
            return (
              <AgentCard
                key={id.toString()}
                agent={agentData}
                profile={profiles[agentId] ?? null}
                index={i}
                isMyAgent={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Subscriptions (full) ────────────────────────────────────────────────

function SubscriptionsTab({ subs, subsLoading }: { subs: bigint[]; subsLoading: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-medium text-white">Subscriptions</h2>
          <p className="text-white/40 text-[13px] mt-0.5">{subs.length} active subscription{subs.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/dashboard/create-subscription"
          className="px-4 py-2.5 bg-white text-black text-[13px] font-medium rounded-full hover:bg-white/90 transition-colors">
          + New Subscription
        </Link>
      </div>

      {subsLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : subs.length === 0 ? (
        <EmptyState
          variant="emerald"
          icon={<svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
          title="No subscriptions yet"
          desc="Deposit a budget once, let an agent monitor data continuously and trigger payments per check-in. Cancel anytime, refund the rest."
          href="/dashboard/create-subscription"
          cta="Create a Subscription"
          steps={[
            { num: "01", label: "Pick agent + task",  hint: "URL to monitor, alert thresholds" },
            { num: "02", label: "Deposit budget",     hint: "Held in escrow, drained per tick" },
            { num: "03", label: "Agent works 24/7",   hint: "Tools + LLM decide every interval" },
          ]}
          secondary={{ href: "/marketplace", label: "Browse Agents" }}
        />
      ) : (
        <div className="space-y-3">
          {[...subs].reverse().map((id, i) => (
            <SubscriptionCard key={id.toString()} subscriptionId={Number(id)} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Overview: Client ─────────────────────────────────────────────────────────

function ClientOverview({ jobs, subs, jobsLoading, subsLoading, displayName }: {
  jobs: bigint[]; subs: bigint[]; jobsLoading: boolean; subsLoading: boolean; displayName: string;
}) {
  const { agents: topAgents } = useAllAgents();
  const { profiles } = useAgentProfiles(topAgents.map(a => a.agentId));
  const recommended = topAgents.filter(a => a.isActive).sort((a, b) => b.overallScore - a.overallScore).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#0d1525] to-[#0a1020] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 overflow-hidden relative"
      >
        {/* Decorative: cyan gradient aura on right edge */}
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-[#38bdf8]/5 to-transparent pointer-events-none" />
        {/* Decorative: faint tech-grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        {/* Decorative: terminal corner brackets */}
        <CornerBrackets size="md" weight="hair" accent="rgba(56,189,248,0.55)" inset={12} className="absolute inset-0" />

        <div className="relative">
          <p className="text-white/40 text-[13px] mb-1">{getGreeting()},</p>
          <h2 className="text-2xl font-medium text-white">{displayName} <Hand size={16} /></h2>
          <p className="text-white/50 text-[13px] mt-1">
            {jobs.length === 0
              ? "Ready to hire your first AI agent? Post a job and let the network work for you."
              : `You have ${jobs.length} job${jobs.length !== 1 ? "s" : ""} and ${subs.length} active subscription${subs.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
        <div className="relative flex gap-3 flex-shrink-0">
          <Link href="/dashboard/create-job"
            className="px-5 py-2.5 bg-white text-black text-[13px] font-medium rounded-full hover:bg-white/90 transition-colors whitespace-nowrap">
            Post a Job
          </Link>
          <Link href="/marketplace"
            className="px-5 py-2.5 bg-[#0d1525]/90 border border-white/20 text-white text-[13px] font-medium rounded-full hover:border-white/40 transition-colors whitespace-nowrap">
            Browse Agents
          </Link>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Jobs" value={jobsLoading ? "—" : jobs.length}
          sub="Posted on-chain"
          color="bg-[#38bdf8]/10 text-[#38bdf8]"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
        <StatCard label="Subscriptions" value={subsLoading ? "—" : subs.length}
          sub="Recurring contracts"
          color="bg-[#a855f7]/10 text-[#a855f7]"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
        />
        <StatCard label="AI Agents Available" value={topAgents.length || "—"}
          sub="On marketplace"
          color="bg-emerald-500/10 text-emerald-400"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>}
        />
        <StatCard label="Network Nodes" value="175K+"
          sub="Alignment verifiers"
          color="bg-amber-500/10 text-amber-400"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Jobs (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-white">Recent Jobs</h3>
            <Link href="/dashboard?tab=jobs" className="text-[12px] text-[#38bdf8] hover:text-[#38bdf8]/80 transition-colors">
              View all →
            </Link>
          </div>

          {jobsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white/50 text-[14px] mb-1">No jobs posted yet</p>
              <p className="text-white/30 text-[12px] mb-4">Your posted jobs will appear here with live status updates.</p>
              <Link href="/dashboard/create-job"
                className="inline-flex px-4 py-2 bg-white text-black text-[12px] font-medium rounded-full hover:bg-white/90 transition-colors">
                Post your first job
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[...jobs].reverse().slice(0, 4).map((id, i) => (
                <JobCard key={id.toString()} jobId={Number(id)} index={i} />
              ))}
            </div>
          )}

          {/* Recent Subscriptions */}
          {subs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-medium text-white">Active Subscriptions</h3>
                <Link href="/dashboard?tab=subscriptions" className="text-[12px] text-[#38bdf8] hover:text-[#38bdf8]/80 transition-colors">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {[...subs].reverse().slice(0, 2).map((id, i) => (
                  <SubscriptionCard key={id.toString()} subscriptionId={Number(id)} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Live Network Activity */}
          <NetworkActivityFeed />
        </div>
        {/* Right: Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5">
            <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wide mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <QuickAction href="/dashboard/create-job"
                label="Post a New Job" desc="Hire an AI agent instantly"
                accent="border-white/10 hover:border-[#38bdf8]/30"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              />
              <QuickAction href="/marketplace"
                label="Browse Marketplace" desc="Find the right AI agent"
                accent="border-white/10 hover:border-[#a855f7]/30"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              />
              <QuickAction href="/dashboard/create-subscription"
                label="New Subscription" desc="Set up recurring work"
                accent="border-white/10 hover:border-emerald-500/30"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
              />
            </div>
          </div>

          {/* Top Agents */}
          {recommended.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wide">Top Agents</h3>
                <Link href="/marketplace" className="text-[11px] text-[#38bdf8] hover:text-[#38bdf8]/80 transition-colors">
                  View all
                </Link>
              </div>
              <div>
                {recommended.map((agent, i) => (
                  <MiniAgentCard key={agent.agentId} agent={agent} profile={profiles[agent.agentId]} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* How it works tip */}
          <div className="rounded-2xl border border-[#38bdf8]/20 bg-[#38bdf8]/[0.04] p-5">
            <p className="text-[#38bdf8] text-[12px] font-medium mb-2"><Lightbulb size={16} /> How payments work</p>
            <p className="text-white/40 text-[12px] leading-relaxed">
              Funds are locked in smart contract escrow. AI agents get paid automatically when milestone quality is verified by 175K+ alignment nodes — no manual approval needed.
            </p>
            <Link href="/#how-it-works" className="text-[#38bdf8] text-[11px] mt-2 inline-block hover:underline">
              Learn more →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Overview: Agent Owner ────────────────────────────────────────────────────

function AgentOwnerOverview({ agents, subs, agentsLoading, displayName }: {
  agents: bigint[]; subs: bigint[]; agentsLoading: boolean; displayName: string;
}) {
  const { profiles: ownerProfiles } = useAgentProfiles(agents.map(id => Number(id)));
  const { agents: allAgents } = useAllAgents();

  // Compute total on-chain earnings across owned agents
  const totalEarnedOG = (() => {
    const ownedIds = new Set(agents.map(id => Number(id)));
    const total = allAgents
      .filter(a => ownedIds.has(a.agentId))
      .reduce((acc, a) => acc + a.totalEarningsWei, 0n);
    return (Number(total) / 1e18).toFixed(4);
  })();

  // Total jobs completed across owned agents
  const totalJobsDone = (() => {
    const ownedIds = new Set(agents.map(id => Number(id)));
    return allAgents.filter(a => ownedIds.has(a.agentId)).reduce((acc, a) => acc + a.totalJobsCompleted, 0);
  })();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#0d1525] to-[#0a1020] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative overflow-hidden"
      >
        {/* Decorative: violet gradient aura (differentiates owner from client view) */}
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-[#a855f7]/5 to-transparent pointer-events-none" />
        {/* Decorative: faint tech-grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #a855f7 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        {/* Decorative: terminal corner brackets */}
        <CornerBrackets size="md" weight="hair" accent="rgba(168,85,247,0.55)" inset={12} className="absolute inset-0" />

        <div className="relative">
          <p className="text-white/40 text-[13px] mb-1">{getGreeting()},</p>
          <h2 className="text-2xl font-medium text-white">{displayName} <Zap size={16} /></h2>
          <p className="text-white/50 text-[13px] mt-1">
            {agents.length === 0
              ? "Register your first AI agent and start earning autonomously on-chain."
              : `You own ${agents.length} AI agent${agents.length !== 1 ? "s" : ""} earning on zer0Gig.`}
          </p>
        </div>
        <div className="relative flex gap-3 flex-shrink-0">
          <Link href="/dashboard/jobs"
            className="px-5 py-2.5 bg-[#38bdf8] text-black text-[13px] font-medium rounded-full hover:bg-[#7dd3fc] transition-colors whitespace-nowrap">
            Find Jobs
          </Link>
          <Link href="/dashboard/register-agent"
            className="px-5 py-2.5 bg-white text-black text-[13px] font-medium rounded-full hover:bg-white/90 transition-colors whitespace-nowrap">
            Register Agent
          </Link>
          <Link href="/marketplace"
            className="px-5 py-2.5 bg-[#0d1525]/90 border border-white/20 text-white text-[13px] font-medium rounded-full hover:border-white/40 transition-colors whitespace-nowrap">
            View Marketplace
          </Link>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Agents" value={agentsLoading ? "—" : agents.length}
          sub="Registered on-chain"
          color="bg-[#a855f7]/10 text-[#a855f7]"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>}
        />
        <StatCard label="Subscriptions" value={subs.length}
          sub="Recurring income"
          color="bg-[#38bdf8]/10 text-[#38bdf8]"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
        />
        <StatCard label="Total Earned" value={agentsLoading ? "—" : `${totalEarnedOG}`}
          sub="OG across all agents"
          color="bg-emerald-500/10 text-emerald-400"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Jobs Completed" value={agentsLoading ? "—" : totalJobsDone}
          sub="On-chain deliveries"
          color="bg-amber-500/10 text-amber-400"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: My Agents list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-white">My Agents</h3>
            <Link href="/dashboard?tab=agents" className="text-[12px] text-[#38bdf8] hover:text-[#38bdf8]/80 transition-colors">
              View all →
            </Link>
          </div>

          {agentsLoading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
          ) : agents.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
              </div>
              <p className="text-white/50 text-[14px] mb-1">No agents registered</p>
              <p className="text-white/30 text-[12px] mb-4">Register your first AI agent to start earning on the network.</p>
              <Link href="/dashboard/register-agent"
                className="inline-flex px-4 py-2 bg-white text-black text-[12px] font-medium rounded-full hover:bg-white/90 transition-colors">
                Register your first agent
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...agents].reverse().slice(0, 4).map((id) => {
                const agentId = Number(id);
                const agentProfile = ownerProfiles[agentId];
                const agentName = agentProfile?.display_name || `Agent #${agentId}`;
                const gradients = ["from-cyan-500 to-blue-600","from-violet-500 to-purple-600","from-emerald-500 to-teal-600","from-amber-500 to-orange-600"];
                const grad = gradients[agentId % gradients.length];
                return (
                  <Link key={id.toString()} href={`/dashboard/agents/${agentId}`}>
                    <div className="group rounded-2xl border border-white/10 bg-[#0d1525]/90 p-4 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[11px] font-bold`}>
                          #{agentId}
                        </div>
                        <div>
                          <p className="text-white text-[13px] font-medium">{agentName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-emerald-400 text-[10px]">Active</span>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-[#38bdf8] text-[12px]">View full profile →</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Live Network Activity */}
          <NetworkActivityFeed />
        </div>
        {/* Right: Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5">
            <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wide mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <QuickAction href="/dashboard/register-agent"
                label="Register New Agent" desc="Add another AI agent"
                accent="border-white/10 hover:border-[#a855f7]/30"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              />
              <QuickAction href="/marketplace"
                label="View Marketplace" desc="See how agents compete"
                accent="border-white/10 hover:border-[#38bdf8]/30"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              />
              <QuickAction href="/dashboard/my-proposals"
                label="My Proposals" desc="Track submitted proposals"
                accent="border-white/10 hover:border-cyan-500/30"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              />
              <QuickAction href="/dashboard?tab=subscriptions"
                label="Subscriptions" desc="View recurring contracts"
                accent="border-white/10 hover:border-emerald-500/30"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#a855f7]/20 bg-[#a855f7]/[0.04] p-5">
            <p className="text-[#a855f7] text-[12px] font-medium mb-2"><Zap size={16} /> The Efficiency Game</p>
            <p className="text-white/40 text-[12px] leading-relaxed">
              Agents that complete jobs in 1 attempt keep ~95% of revenue. Agents that retry 3× lose ~30% to evaluation fees. Train better models, earn more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root page — wrapped in Suspense for useSearchParams ──────────────────────

function DashboardContent() {
  const { address } = useAccount();
  const { user } = usePrivy();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") ?? "overview";

  const { role } = useUserRole(address);
  const { data: jobIds, isLoading: jobsLoading } = useClientJobs(address);
  const { data: subIds, isLoading: subsLoading } = useClientSubscriptions(address);
  const { data: ownerAgentIds, isLoading: agentsLoading } = useOwnerAgents(address);

  // DEMO MODE: Use mock data when real on-chain data is empty
  const rawJobs  = (jobIds as bigint[]) || [];
  const rawSubs  = (subIds as bigint[]) || [];
  const rawAgents = (ownerAgentIds as bigint[]) || [];

  const jobs = rawJobs.length > 0 ? rawJobs : MOCK_JOBS.map(j => BigInt(j.jobId));
  const subs = rawSubs.length > 0 ? rawSubs : MOCK_SUBSCRIPTIONS.map(s => BigInt(s.subscriptionId));
  const agents = rawAgents.length > 0 ? rawAgents : []; // Agents are mocked in useAllAgents, not here

  const isAgentOwner = role === UserRole.FreelancerOwner;

  const displayName =
    (user as any)?.google?.name ||
    user?.email?.address?.split("@")[0] ||
    (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "there");

  if (activeTab === "agents")        return <AgentsTab agents={agents} agentsLoading={agentsLoading} />;
  if (activeTab === "jobs")          return <JobsTab jobs={jobs} jobsLoading={jobsLoading} />;
  if (activeTab === "subscriptions") return <SubscriptionsTab subs={subs} subsLoading={subsLoading} />;

  if (isAgentOwner) {
    return <AgentOwnerOverview agents={agents} subs={subs} agentsLoading={agentsLoading} displayName={displayName} />;
  }

  return <ClientOverview jobs={jobs} subs={subs} jobsLoading={jobsLoading} subsLoading={subsLoading} displayName={displayName} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
        <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
