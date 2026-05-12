import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { AgentListing } from "@/hooks/useAllAgents";
import { AgentProfile } from "@/lib/supabase";
import { useAccount, useWalletClient } from "wagmi";
import { formatEther } from "viem";
import CornerBrackets from "../ui/CornerBrackets";
import { useUserRole, UserRole } from "@/hooks/useUserRegistry";

interface AgentCardProps {
  agent:     AgentListing;
  profile:   AgentProfile | null;
  index:     number;
  isMyAgent?: boolean;
}

const AVATAR_GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500",
];

const CARD_HEIGHT = "h-[480px]";
const SWIPE = { duration: 0.42, ease: [0.25, 0.4, 0.25, 1] as const };

function getRuntimeBadge(capabilityHash: string) {
  if (typeof capabilityHash === "string" && capabilityHash.startsWith("pm:")) return { label: "Platform", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" };
  if (typeof capabilityHash === "string" && capabilityHash.startsWith("sh:")) return { label: "Self-Hosted", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" };
  return null;
}

export function AgentCard({ agent, profile, index, isMyAgent: isMyAgentProp }: AgentCardProps) {
  const { data: walletClient } = useWalletClient();
  const { address: viewerAddress } = useAccount();
  const { role: viewerRole } = useUserRole(viewerAddress);
  const connectedWallet = walletClient?.account.address;
  const isMyAgent = isMyAgentProp ?? (connectedWallet?.toLowerCase() === agent.agentWallet?.toLowerCase());
  // Agent owners are sellers, not buyers — they should never see Hire/Subscribe
  // CTAs on other people's agent cards. Falls back to showing them when role is
  // null/unknown (visitor without a registered profile) so the marketplace
  // remains usable for anon browsers.
  const isAgentOwner = viewerRole === UserRole.FreelancerOwner;

  const gradient    = AVATAR_GRADIENTS[agent.agentId % AVATAR_GRADIENTS.length];
  const runtime     = getRuntimeBadge(agent.capabilityHash);
  const displayName = agent.name;
  const bio         = profile?.bio;
  const avatarUrl   = profile?.avatar_url;
  const featured    = profile?.featured ?? false;
  const readableSkills = agent.skills.filter(s => !s.startsWith("0x") && s.length < 40);
  const totalEarnedOG = (Number(agent.totalEarningsWei) / 1e18).toFixed(4);

  const [showDetail, setShowDetail] = useState(false);
  const [dir, setDir] = useState(1); // 1 = forward (open detail), -1 = back (close detail)
  void isMyAgent;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`group relative ${CARD_HEIGHT} overflow-hidden rounded-2xl border bg-[#0d1525]/90 hover:shadow-[0_0_32px_rgba(56,189,248,0.15)] transition-shadow duration-200 ${
        featured ? "border-[#38bdf8]/30 shadow-[0_0_24px_rgba(56,189,248,0.07)]" : "border-white/10"
      }`}
    >
      {/* Decorative layers — kept OUTSIDE the swipe content so they persist across flips */}
      <CornerBrackets
        size="sm"
        weight="hair"
        accent={featured ? "#38bdf8" : "rgba(255,255,255,0.22)"}
        inset={10}
        className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-200 opacity-70 group-hover:opacity-100"
      />
      {featured && (
        <div
          className="absolute -top-16 -right-16 w-48 h-48 pointer-events-none opacity-40 z-0"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.25) 0%, transparent 60%)" }}
          aria-hidden
        />
      )}
      {featured && (
        <div className="absolute top-3 right-3 z-30 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
          Featured
        </div>
      )}

      {/* Sliding face container */}
      <AnimatePresence initial={false} mode="wait" custom={dir}>
        {!showDetail ? (
          <motion.div
            key="front"
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SWIPE}
            className="absolute inset-0 z-10 p-6 flex flex-col gap-4"
          >
            {/* Header */}
            <div className={`relative flex items-start gap-3 ${featured ? "pr-16" : ""}`}>
              <div className="shrink-0">
                {avatarUrl ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                    <Image src={avatarUrl} alt={displayName} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-[13px] font-bold">#{agent.agentId}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-semibold text-[16px] truncate">{displayName}</h3>
                  {runtime && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${runtime.color}`}>
                      {runtime.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-white/35 text-[12px] font-mono">
                    {agent.agentWallet.slice(0, 6)}...{agent.agentWallet.slice(-4)}
                  </p>
                  <span className="text-white/15 text-[10px]">·</span>
                  <p className="text-[#38bdf8]/50 text-[10px] font-mono uppercase tracking-[0.18em]">
                    0G.{agent.agentId.toString().padStart(4, "0")}
                  </p>
                </div>
              </div>
              {!featured && (
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] ${agent.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {agent.isActive ? "Active" : "Inactive"}
                </span>
              )}
            </div>

            {/* Bio (clamped) */}
            <p className="text-white/45 text-[13px] leading-relaxed line-clamp-2 -mt-1 min-h-[34px]">
              {bio || <span className="text-white/20 italic">No bio yet</span>}
            </p>

            {/* Reputation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-white/35 uppercase tracking-wide">Reputation</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-[2px] h-3" aria-hidden>
                    {[0.4, 0.7, 0.5, 0.9, 0.6, 0.85, 0.55].map((h, i) => (
                      <div
                        key={i}
                        className="w-[2px] rounded-sm bg-[#38bdf8]/60"
                        style={{
                          height: `${h * 100}%`,
                          animation: `barPulse 1.6s ease-in-out ${i * 0.12}s infinite`,
                          transformOrigin: "bottom",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-white font-medium text-[12px]">{agent.scoreDisplay}/100</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] transition-all duration-700"
                  style={{ width: `${Math.min(100, agent.overallScore / 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#050810]/60 rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-white/30 uppercase tracking-wide mb-0.5">Rate / Task</p>
                <p className="text-[15px] text-white font-semibold">{agent.rateDisplay} OG</p>
              </div>
              <div className="bg-[#050810]/60 rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-white/30 uppercase tracking-wide mb-0.5">Jobs Done</p>
                <p className="text-[15px] text-white font-semibold">{agent.totalJobsCompleted}</p>
              </div>
            </div>

            {/* Skills (clamped to 4 + show-more chip) */}
            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
              {readableSkills.slice(0, 4).map((skill, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50">
                  {skill}
                </span>
              ))}
              {readableSkills.length > 4 && (
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/30">
                  +{readableSkills.length - 4}
                </span>
              )}
            </div>

            {/* Footer actions */}
            <div className="mt-auto flex items-center gap-2">
              {isMyAgent ? (
                <Link
                  href={`/dashboard/agents/${agent.agentId}`}
                  className="flex-1 px-4 py-2 bg-[#0d1525]/90 border border-[#38bdf8]/20 text-[#38bdf8] text-[13px] font-medium rounded-full text-center hover:border-[#38bdf8]/40 transition-colors"
                >
                  Manage Agent
                </Link>
              ) : isAgentOwner ? (
                <Link
                  href={`/dashboard/agents/${agent.agentId}`}
                  className="flex-1 px-4 py-2 border border-white/15 text-white/70 hover:text-white hover:border-white/30 text-[13px] font-medium rounded-full text-center transition-colors"
                >
                  View Profile
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => { setDir(1); setShowDetail(true); }}
                    className="flex items-center gap-1 px-3 py-2 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-[12px] font-medium transition-colors"
                    aria-label="Show full details"
                  >
                    Show detail
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <Link
                    href={`/dashboard/create-job?agent=${agent.agentId}`}
                    className="flex-1 px-4 py-2 bg-white text-black text-[13px] font-medium rounded-full text-center hover:bg-white/90 transition-colors"
                  >
                    Hire
                  </Link>
                  <Link
                    href={`/dashboard/create-subscription?agent=${agent.agentId}`}
                    className="flex-1 px-4 py-2 bg-[#0d1525]/90 border border-white/20 text-white text-[13px] font-medium rounded-full text-center hover:border-white/40 transition-colors"
                  >
                    Subscribe
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SWIPE}
            className="absolute inset-0 z-10 p-6 flex flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
          >
            {/* Detail header — back chevron, name, score */}
            <div className="flex items-center gap-3 pr-12">
              <button
                onClick={() => { setDir(-1); setShowDetail(false); }}
                className="flex-shrink-0 w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors"
                aria-label="Back to summary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-[15px] truncate">{displayName}</h3>
                <p className="text-[#38bdf8]/60 text-[10px] font-mono uppercase tracking-[0.2em]">
                  Agent details · 0G.{agent.agentId.toString().padStart(4, "0")}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-[10px] text-white/30 uppercase tracking-wide">Score</p>
                <p className="text-white text-[14px] font-semibold">{agent.scoreDisplay}</p>
              </div>
            </div>

            {/* Full bio */}
            {bio && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">Bio</p>
                <p className="text-white/60 text-[12px] leading-relaxed">{bio}</p>
              </div>
            )}

            {/* On-chain identity */}
            <div className="grid grid-cols-1 gap-2 bg-[#050810]/60 rounded-xl p-3 border border-white/[0.06]">
              <DetailRow label="Wallet"          value={agent.agentWallet} mono />
              <DetailRow label="Capability Hash" value={agent.capabilityHash} mono truncate />
              <DetailRow label="Total Earned"    value={`${totalEarnedOG} OG`} accent />
              <DetailRow label="Default Rate"    value={`${formatEther(agent.defaultRate)} OG`} />
              <DetailRow label="Win Rate"        value={`${(agent.overallScore / 100).toFixed(2)}%`} />
              <DetailRow label="Jobs Attempted"  value={String(agent.totalJobsAttempted)} />
              <DetailRow label="Jobs Completed"  value={String(agent.totalJobsCompleted)} />
              <DetailRow label="Created At"      value={new Date(agent.createdAt * 1000).toLocaleDateString()} />
            </div>

            {/* All skills */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1.5">
                All Skills ({readableSkills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {readableSkills.length > 0 ? (
                  readableSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full bg-[#38bdf8]/[0.06] border border-[#38bdf8]/15 text-[11px] text-[#38bdf8]/80"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-white/25 text-[11px] italic">No skills declared</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-2 flex items-center gap-2">
              <Link
                href={`/dashboard/agents/${agent.agentId}`}
                className="flex-1 px-3 py-2 border border-white/15 text-white/70 text-[12px] font-medium rounded-full text-center hover:border-white/30 hover:text-white transition-colors"
              >
                {isMyAgent ? "Manage Agent" : "View Full Profile"}
              </Link>
              {!isMyAgent && !isAgentOwner && (
                <Link
                  href={`/dashboard/create-job?agent=${agent.agentId}`}
                  className="flex-1 px-3 py-2 bg-white text-black text-[12px] font-medium rounded-full text-center hover:bg-white/90 transition-colors"
                >
                  Hire Agent
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Detail row helper ────────────────────────────────────────────────────────

function DetailRow({ label, value, mono, truncate, accent }: {
  label: string; value: string; mono?: boolean; truncate?: boolean; accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10px] text-white/35 uppercase tracking-wide flex-shrink-0">{label}</span>
      <span
        className={`text-[11.5px] ${mono ? "font-mono" : ""} ${accent ? "text-[#38bdf8]" : "text-white/70"} ${truncate ? "truncate min-w-0" : ""}`}
        title={value}
      >
        {truncate && value.length > 20 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value}
      </span>
    </div>
  );
}
