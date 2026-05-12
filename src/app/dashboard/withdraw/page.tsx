"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Cpu, ArrowRight, ShieldCheck, CheckCircle2,
  Activity, Fingerprint, Coins, Zap, Landmark, ExternalLink,
  AlertCircle, ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useAccount, useBalance, useReadContracts, useSignMessage } from "wagmi";
import { formatEther } from "viem";
import type { Address } from "viem";
import { useOwnerAgents } from "@/hooks/useAgentRegistry";
import { useAllAgents } from "@/hooks/useAllAgents";
import { useAgentProfiles } from "@/hooks/useAgentProfile";
import { useUserRole, UserRole } from "@/hooks/useUserRegistry";
import { CONTRACT_CONFIG } from "@/lib/contracts";

// ─────────────────────────────────────────────────────────────────────────────
// Agent Wallet Withdrawal Hub — /dashboard/withdraw
//
// Adapted from the founder's mockup (Docs/Frontend/Components/Page/WithdrawalPage.md)
// with real wagmi hooks + the buy-agents palette per direction. Per-agent
// accent color survives ONLY around the holographic core; every other
// surface is the neutral white-tint card pattern shared with /marketplace/agents-for-sale.
//
// Flow documented at Docs/Frontend/Components/Page/WithdrawalFlow.md. The
// backend POST is currently a stub — UI is production-ready, on-chain
// dispatch is a Phase-2 deliverable.
// ─────────────────────────────────────────────────────────────────────────────

// Deterministic accent color per agentId so the holographic ring is stable
// across re-renders. Five-stop palette keeps the wall visually varied without
// drifting into rainbow.
const ACCENT_PALETTE = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899"];
function accentFor(agentId: number) {
  return ACCENT_PALETTE[agentId % ACCENT_PALETTE.length];
}

type WithdrawState = "idle" | "signing" | "processing" | "success" | "error";

interface AgentChoice {
  agentId:     number;
  name:        string;
  agentWallet: `0x${string}`;
  category:    string;
  isActive:    boolean;
  color:       string;
  avatarUrl:   string | null;
}

export default function WithdrawPage() {
  const { address: owner } = useAccount();
  const { role, isLoading: roleLoading } = useUserRole(owner);
  const { data: ownerAgentIds, isLoading: idsLoading } = useOwnerAgents(owner);
  const { agents: allAgents, isLoading: allLoading } = useAllAgents();
  const { signMessageAsync } = useSignMessage();

  // Owner's agent ID list — normalized to number[]
  const ownerIds: number[] = useMemo(() => {
    if (!ownerAgentIds) return [];
    return (ownerAgentIds as bigint[]).map(b => Number(b));
  }, [ownerAgentIds]);

  // Direct on-chain read for each owned agent's profile. This is the source of
  // truth for the agentWallet address (which we need for balance reads) and
  // ensures the switcher works even when the Supabase indexer behind
  // useAllAgents lags or doesn't have the agent yet.
  const profileContracts = useMemo(
    () =>
      ownerIds.map(id => ({
        address:      CONTRACT_CONFIG.AgentRegistry.address as Address,
        abi:          CONTRACT_CONFIG.AgentRegistry.abi,
        functionName: "getAgentProfile" as const,
        args:         [BigInt(id)] as const,
      })),
    [ownerIds],
  );
  const { data: profileResults, isLoading: profilesLoading } = useReadContracts({
    contracts: profileContracts,
    query:     { enabled: ownerIds.length > 0 },
  });

  // Supabase agent_profiles rows for each owned agent — supplies the avatar
  // image rendered inside the holographic core (display_name + avatar_url).
  const { profiles: agentProfiles } = useAgentProfiles(ownerIds);

  // Resolve the owner's iNFTs into rich AgentChoice objects. Cross-references
  // allAgents (for friendly name + category) but falls back to a synthesized
  // entry from the on-chain profile when the indexer doesn't have the agent
  // yet — fixes the switcher silently dropping agents.
  const myAgents: AgentChoice[] = useMemo(() => {
    return ownerIds
      .map((id, i) => {
        const fromApi  = allAgents.find(a => a.agentId === id);
        // wagmi useReadContracts result shape: { status, result }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onChain  = profileResults?.[i]?.result as any;
        const supaProf = agentProfiles[id];
        const wallet   = (fromApi?.agentWallet as `0x${string}` | undefined)
                      ?? (onChain?.agentWallet as `0x${string}` | undefined);
        if (!wallet || wallet === "0x0000000000000000000000000000000000000000") return null;
        return {
          agentId:     id,
          name:        supaProf?.display_name ?? fromApi?.name ?? `Agent #${id}`,
          agentWallet: wallet,
          category:    fromApi?.tags?.[0] ?? fromApi?.skills?.[0] ?? "AI Agent",
          isActive:    fromApi?.isActive ?? true,
          color:       accentFor(id),
          avatarUrl:   supaProf?.avatar_url ?? null,
        };
      })
      .filter((a): a is AgentChoice => !!a);
  }, [ownerIds, allAgents, profileResults, agentProfiles]);

  // Selected agent (default: first one)
  const [selectedId, setSelectedId] = useState<number | null>(null);
  useEffect(() => {
    if (selectedId === null && myAgents.length > 0) setSelectedId(myAgents[0].agentId);
  }, [myAgents, selectedId]);
  const selected = myAgents.find(a => a.agentId === selectedId) ?? null;

  // Live on-chain balance of the selected agent's autonomous wallet
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
    address: selected?.agentWallet,
    chainId: 16602, // 0G Newton
    query:   { enabled: !!selected, refetchInterval: 15_000 },
  });
  const balanceOG = balance ? Number(formatEther(balance.value)) : 0;

  // Form state
  const [amount,      setAmount]      = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [state,       setState]       = useState<WithdrawState>("idle");
  const [error,       setError]       = useState<string | null>(null);
  const [txHash,      setTxHash]      = useState<string | null>(null);

  // Default destination = connected owner wallet
  useEffect(() => {
    if (owner && !destination) setDestination(owner);
  }, [owner, destination]);

  // Reset amount when switching agents
  useEffect(() => {
    setAmount("");
    setTxHash(null);
    setError(null);
  }, [selectedId]);

  const setPercentage = (percent: number) => {
    if (balanceOG <= 0) return;
    const v = (balanceOG * percent).toFixed(6);
    setAmount(v);
  };

  const amountNum = Number(amount);
  const canSubmit =
    state === "idle" &&
    !!selected &&
    !!destination &&
    /^0x[a-fA-F0-9]{40}$/.test(destination) &&
    amountNum > 0 &&
    amountNum <= balanceOG;

  async function handleHarvest() {
    if (!canSubmit || !selected || !owner) return;
    setError(null);
    setTxHash(null);
    setState("signing");

    try {
      const timestamp = Date.now();
      const message =
        `zer0Gig agent wallet withdrawal\n` +
        `Agent: #${selected.agentId} (${selected.name})\n` +
        `Amount: ${amount} OG\n` +
        `Destination: ${destination}\n` +
        `Timestamp: ${timestamp}`;

      const signature = await signMessageAsync({ message });

      setState("processing");

      const res = await fetch("/api/agent/withdraw", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          agentId:     String(selected.agentId),
          amount,
          destination,
          signature,
          message,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Withdraw failed");

      setTxHash(json.txHash);
      setState("success");
      // Refresh the balance reading so the UI reflects the (eventual) drain
      setTimeout(() => refetchBalance(), 4000);
      // Auto-return to idle so the user can do another harvest
      setTimeout(() => {
        setState("idle");
        setAmount("");
      }, 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Withdraw failed";
      setError(msg);
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  // ── Role guard — only agent owners can hit this page ──────────────────────
  if (!roleLoading && role !== null && role !== UserRole.FreelancerOwner) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-[#0d1525]/90 p-10 text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-4 text-amber-400/70" />
        <h2 className="text-2xl font-medium text-white mb-2">Agent owners only</h2>
        <p className="text-white/55 text-[14px] mb-6">
          This page is for harvesting yield from agents you own. Clients use the
          job + subscription flows instead.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isLoading = roleLoading || idsLoading || (ownerIds.length > 0 && profilesLoading) || allLoading;

  // ── Empty state — no agents owned ─────────────────────────────────────────
  if (!isLoading && myAgents.length === 0) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-[#0d1525]/90 p-10 text-center">
        <Landmark className="w-10 h-10 mx-auto mb-4 text-white/40" />
        <h2 className="text-2xl font-medium text-white mb-2">No agents to harvest from</h2>
        <p className="text-white/55 text-[14px] mb-6">
          You don&apos;t own any agents yet. Register one to start earning, or buy a
          mature agent from the marketplace.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/dashboard/register-agent"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black text-[13px] font-medium"
          >
            Register Agent
          </Link>
          <Link
            href="/marketplace/agents-for-sale"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-white/15 text-white/75 text-[13px] font-medium hover:border-white/30"
          >
            Buy Agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Ambient gradient driven by the selected agent's accent color */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.agentId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 pointer-events-none -z-10"
            style={{ background: `radial-gradient(ellipse 60% 50% at 30% 30%, ${selected.color}, transparent 60%)` }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[12px] text-white/55 mb-4 font-mono uppercase tracking-widest">
          <Activity className="w-3.5 h-3.5" />
          Agent Yield Harvest
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-3">
          Withdraw Agent Earnings
        </h1>
        <p className="text-white/55 text-[15px] max-w-2xl">
          Extract autonomous OG earnings from your agent&apos;s wallet (ERC-7857) to your
          owner address. Custody stays with the agent runtime — you authorize each
          withdrawal by signing a message with your owner wallet.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[420px] rounded-2xl border border-white/10 bg-[#0d1525]/60 animate-pulse" />
          <div className="h-[420px] rounded-2xl border border-white/10 bg-[#0d1525]/60 animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_56px_1fr] gap-6 lg:gap-4 items-stretch">

          {/* ── LEFT — Agent picker + holographic profile ─────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-8 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                Source · Agent Wallet
              </span>
              {selected && (
                <span className={`text-[10px] font-mono uppercase tracking-widest ${selected.isActive ? "text-emerald-400/80" : "text-white/35"}`}>
                  {selected.isActive ? "ACTIVE" : "IDLE"}
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {selected && (
                <motion.div
                  key={selected.agentId}
                  initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1,    filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col items-center w-full"
                >
                  {/* Holographic core */}
                  <div className="relative w-44 h-44 rounded-full flex items-center justify-center mb-6">
                    <div
                      className="absolute inset-0 rounded-full border border-dashed opacity-40 animate-[spin_10s_linear_infinite]"
                      style={{ borderColor: selected.color }}
                    />
                    <div
                      className="absolute inset-2 rounded-full border opacity-20 animate-[spin_15s_linear_infinite_reverse]"
                      style={{ borderColor: selected.color }}
                    />
                    <div
                      className="relative w-28 h-28 rounded-full overflow-hidden bg-[#050810] border z-10"
                      style={{
                        borderColor: `${selected.color}55`,
                        boxShadow: `0 0 40px ${selected.color}40, inset 0 0 20px ${selected.color}20`,
                      }}
                    >
                      {selected.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selected.avatarUrl}
                          alt={selected.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Landmark className="w-10 h-10" style={{ color: selected.color }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xl font-medium text-white mb-1">{selected.name}</p>
                  <div className="flex items-center gap-1.5 mb-5">
                    <Cpu className="w-3 h-3 text-white/35" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                      {selected.category}
                    </span>
                  </div>

                  {/* Available balance */}
                  <div className="w-full rounded-xl border border-white/10 bg-[#050810]/80 px-5 py-4 mb-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-1">
                      Available
                    </p>
                    <p className="text-3xl font-medium text-white tracking-tight tabular-nums">
                      {balanceLoading ? (
                        <span className="text-white/30">—</span>
                      ) : (
                        <>
                          {balanceOG.toLocaleString("en-US", { maximumFractionDigits: 6 })}
                          <span className="text-base text-white/40 ml-2 font-mono">OG</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Wallet address */}
                  <p className="text-[10px] font-mono text-white/30 truncate w-full text-center">
                    {selected.agentWallet}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Agent switcher — tile cards (works for 1 or many) */}
            {myAgents.length > 0 && (
              <div className="w-full mt-6">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-2">
                  Switch Agent · {myAgents.length}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {myAgents.map(a => {
                    const active = selectedId === a.agentId;
                    return (
                      <button
                        key={a.agentId}
                        type="button"
                        onClick={() => state === "idle" && setSelectedId(a.agentId)}
                        disabled={state !== "idle"}
                        aria-label={`Select ${a.name}`}
                        aria-pressed={active}
                        className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          active
                            ? "border-white/30 bg-white/[0.06]"
                            : "border-white/10 bg-[#050810]/60 hover:border-white/25 hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: a.color,
                            boxShadow: active ? `0 0 10px ${a.color}` : "none",
                          }}
                        />
                        <span className={`text-[12px] font-medium whitespace-nowrap ${active ? "text-white" : "text-white/65"}`}>
                          {a.name}
                        </span>
                        <span className="text-[10px] font-mono text-white/35">#{a.agentId}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── CENTER — flow connector (desktop only) ─────────────────────── */}
          <div className="hidden lg:flex flex-col items-center justify-center relative">
            <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            <AnimatePresence>
              {state === "processing" && selected && (
                <motion.div
                  initial={{ top: "0%", opacity: 0 }}
                  animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute w-1 h-12 rounded-full"
                  style={{
                    background: `linear-gradient(to bottom, transparent, ${selected.color})`,
                    boxShadow: `0 0 10px ${selected.color}`,
                  }}
                />
              )}
            </AnimatePresence>
            <div className="w-9 h-9 rounded-full bg-[#0d1525] border border-white/10 z-10 flex items-center justify-center shadow-xl">
              <ArrowRight className="w-4 h-4 text-white/40" />
            </div>
          </div>

          {/* ── RIGHT — Withdrawal terminal ────────────────────────────────── */}
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-7 flex flex-col gap-5">

            {/* Destination */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                Destination · Owner Wallet
              </p>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#050810]/80 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 border border-white/10">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <input
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  disabled={state !== "idle"}
                  spellCheck={false}
                  placeholder="0x…"
                  className="flex-1 min-w-0 bg-transparent text-[13px] text-white font-mono focus:outline-none disabled:opacity-50"
                />
                {destination === owner ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400/80 shrink-0" aria-label="Connected wallet" />
                ) : null}
              </div>
              {destination && !/^0x[a-fA-F0-9]{40}$/.test(destination) && (
                <p className="text-amber-400/80 text-[11px] mt-1.5">Invalid address format.</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                  Extraction Amount
                </p>
                <span className="text-[11px] font-mono text-white/45">
                  Max: {balanceOG.toLocaleString("en-US", { maximumFractionDigits: 6 })} OG
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  disabled={state !== "idle"}
                  placeholder="0.000000"
                  className="w-full bg-[#050810]/80 border border-white/10 rounded-xl py-4 pl-4 pr-16 text-2xl font-mono text-white placeholder-white/15 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50 tabular-nums"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-white/45">
                  OG
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {[
                  { label: "25%",  v: 0.25 },
                  { label: "50%",  v: 0.50 },
                  { label: "MAX",  v: 1    },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setPercentage(opt.v)}
                    disabled={state !== "idle" || balanceOG <= 0}
                    className={`flex-1 py-2 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-[12px] font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      opt.label === "MAX" ? "text-white font-semibold" : "text-white/65"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {amountNum > balanceOG && (
                <p className="text-amber-400/80 text-[11px] mt-1.5">
                  Amount exceeds available balance.
                </p>
              )}
            </div>

            {/* Action button — multi-state */}
            <button
              onClick={handleHarvest}
              disabled={!canSubmit}
              className="relative w-full py-3.5 rounded-full font-medium transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black hover:bg-white/90"
            >
              <AnimatePresence mode="wait">
                {state === "idle" && (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    Harvest Yield
                  </motion.span>
                )}
                {state === "signing" && (
                  <motion.span key="signing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center justify-center gap-2 text-amber-700">
                    <Fingerprint className="w-4 h-4 animate-pulse" />
                    Awaiting Wallet Signature…
                  </motion.span>
                )}
                {state === "processing" && (
                  <motion.span key="processing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center justify-center gap-2 text-black/70">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Processing On-Chain…
                  </motion.span>
                )}
                {state === "success" && (
                  <motion.span key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Harvest Successful
                  </motion.span>
                )}
                {state === "error" && (
                  <motion.span key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    {error ?? "Failed"}
                  </motion.span>
                )}
              </AnimatePresence>

              {state === "processing" && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, ease: "linear" }}
                  className="absolute left-0 top-0 bottom-0 bg-black/10 pointer-events-none"
                />
              )}
            </button>

            {/* Success receipt */}
            {state === "success" && txHash && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-4 py-3 text-[12px] flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-emerald-300 font-medium mb-0.5">Withdrawal submitted</p>
                  <p className="text-emerald-300/70 font-mono truncate">{txHash}</p>
                </div>
                <a
                  href={`https://scan-testnet.0g.ai/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 text-[11px] font-medium shrink-0"
                >
                  Chainscan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Network info footer */}
            <div className="flex justify-between items-center text-[10px] font-mono text-white/30 pt-2 border-t border-white/[0.05]">
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3" /> Est. fee · ~0.001 OG
              </span>
              <span>Network · 0G Newton · 16602</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
