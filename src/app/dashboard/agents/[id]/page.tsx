"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentProfile as useOnChainAgentProfile } from "@/hooks/useAgentRegistry";
import { useAgentProfile as useSupabaseAgentProfile } from "@/hooks/useAgentProfile";
import { useAgentSkills, ALL_SKILLS, SKILL_LABELS } from "@/hooks/useAgentManagement";
import { useAgentManagement } from "@/hooks/useAgentManagement";
import { useUpsertAgentProfile } from "@/hooks/useAgentProfile";
import { useWalletClient } from "wagmi";
import { formatOG, avatarGradient } from "@/lib/utils";
import Image from "next/image";
import { parseContractError } from "@/lib/utils";
import { Address } from "viem";
import {
  Settings, X, Plus, Shield, RefreshCw, Copy, ArrowRightLeft, Layers,
  ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import RBACGuard from "@/components/RBACGuard";
import ConnectTelegramButton from "@/components/ConnectTelegramButton";
import CornerBrackets from "@/components/ui/CornerBrackets";
import ReputationRadar from "@/components/agents/ReputationRadar";
import {
  useUpdateCapability,
  useAuthorizeUsage,
  useRevokeUsage,
  useITransfer,
  useIClone,
  useTransferDigest,
  useAuthorizedUsersOf,
  hashString,
  isValidAddress,
} from "@/hooks/useAgentERC7857";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 9500) return { label: "S", color: "text-amber-400" };
  if (score >= 9000) return { label: "A", color: "text-emerald-400" };
  if (score >= 8500) return { label: "B", color: "text-[#38bdf8]" };
  if (score >= 8000) return { label: "C", color: "text-white/60" };
  if (score >= 7000) return { label: "D", color: "text-amber-400/70" };
  return { label: "F", color: "text-red-400" };
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.2)" }}
      transition={{ duration: 0.2 }}
      className="rounded-xl bg-[#050810]/60 border border-white/10 px-4 py-3"
    >
      <p className="text-[11px] text-white/40 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-[15px] font-medium">{value}</p>
    </motion.div>
  );
}

// ─── action tab types ─────────────────────────────────────────────────────────

type ActionTab = "updateCapability" | "authorize" | "transfer" | "clone" | null;

const ACTION_TABS: { id: ActionTab; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: "updateCapability",
    label: "Update Capability",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    desc: "Rotate encrypted capability hash and AES key",
  },
  {
    id: "authorize",
    label: "Authorize Usage",
    icon: <Shield className="w-3.5 h-3.5" />,
    desc: "Grant time-bounded access to an executor",
  },
  {
    id: "transfer",
    label: "Transfer Agent",
    icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
    desc: "Transfer ownership with oracle-verified re-seal",
  },
  {
    id: "clone",
    label: "Clone Agent",
    icon: <Layers className="w-3.5 h-3.5" />,
    desc: "Mint a copy for a new owner (reputation resets)",
  },
];

// ─── main page ────────────────────────────────────────────────────────────────

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = BigInt(params?.id as string);
  const agentIdNum = Number(agentId);
  const { data: walletClient } = useWalletClient();
  const connectedWallet = walletClient?.account.address?.toLowerCase();

  const { data: profileRaw, isLoading: onChainLoading } = useOnChainAgentProfile(agentId);
  const { profile: supabaseProfile } = useSupabaseAgentProfile(agentIdNum);
  const { data: onChainSkillIds, refetch: refetchSkills } = useAgentSkills(agentId);
  const { addSkill, removeSkill, toggleActive } = useAgentManagement();
  const { upsert: upsertProfile } = useUpsertAgentProfile();

  // ERC-7857 hooks
  const { updateCapability, loading: updCapLoading } = useUpdateCapability();
  const { authorizeUsage, loading: authLoading } = useAuthorizeUsage();
  const { revokeUsage, loading: revokeLoading } = useRevokeUsage();
  const { iTransfer, loading: transferLoading } = useITransfer();
  const { iClone, loading: cloneLoading } = useIClone();
  const { data: authorizedUsers, refetch: refetchAuths } = useAuthorizedUsersOf(agentIdNum);

  const profile = profileRaw as any;
  const isOwner = connectedWallet === profile?.owner?.toLowerCase();

  // ── edit panel ──────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editPending, setEditPending] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // ── erc-7857 action panels ──────────────────────────────────────────────────
  const [activeAction, setActiveAction] = useState<ActionTab>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // updateCapability fields
  const [newCapValue, setNewCapValue] = useState("");
  const [newSealedKey, setNewSealedKey] = useState("0x01");

  // authorize fields
  const [execAddr, setExecAddr] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [permissionsDesc, setPermissionsDesc] = useState("");

  // transfer fields
  const [transferTo, setTransferTo] = useState("");
  const [transferCapValue, setTransferCapValue] = useState("");
  const [transferSealedKey, setTransferSealedKey] = useState("0x01");
  const [transferOracleSig, setTransferOracleSig] = useState("");

  // clone fields
  const [cloneTo, setCloneTo] = useState("");
  const [cloneCapValue, setCloneCapValue] = useState("");
  const [cloneSealedKey, setCloneSealedKey] = useState("0x01");
  const [cloneOracleSig, setCloneOracleSig] = useState("");

  // transfer digest read
  const newTransferHash = transferCapValue ? hashString(transferCapValue) : `0x${"00".repeat(32)}` as `0x${string}`;
  const { data: txDigest } = useTransferDigest(
    agentIdNum,
    Number(profile?.version || 1),
    profile?.capabilityHash || `0x${"00".repeat(32)}`,
    newTransferHash,
    transferTo
  );

  const newCloneHash = cloneCapValue ? hashString(cloneCapValue) : `0x${"00".repeat(32)}` as `0x${string}`;
  const { data: cloneDigest } = useTransferDigest(
    agentIdNum,
    Number(profile?.version || 1),
    profile?.capabilityHash || `0x${"00".repeat(32)}`,
    newCloneHash,
    cloneTo
  );

  useEffect(() => {
    if (supabaseProfile) {
      setEditDisplayName(supabaseProfile.display_name || "");
      setEditBio(supabaseProfile.bio || "");
      setEditAvatarUrl(supabaseProfile.avatar_url || "");
      setEditTags(supabaseProfile.tags || []);
    }
  }, [supabaseProfile]);

  useEffect(() => {
    if (profile?.defaultRate) {
      setEditDefaultRate((Number(profile.defaultRate) / 1e18).toString());
    }
  }, [profile]);

  const startEditing = () => {
    setEditDisplayName(supabaseProfile?.display_name || "");
    setEditBio(supabaseProfile?.bio || "");
    setEditAvatarUrl(supabaseProfile?.avatar_url || "");
    setEditTags(supabaseProfile?.tags || []);
    if (profile?.defaultRate) setEditDefaultRate((Number(profile.defaultRate) / 1e18).toString());
    setEditError(null);
    setEditSuccess(false);
    setIsEditing(true);

    const current = (onChainSkillIds || []).map((sid: string) => {
      const found = ALL_SKILLS.find(s => s.id === sid);
      return found ? found.id : sid;
    });
    const available = ALL_SKILLS.filter(s => !current.includes(s.id));
    setAvailableSkills(available);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError(null);
    setEditSuccess(false);
  };

  const toggleTag = (tagId: string) => {
    setEditTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]);
  };

  const saveProfile = async () => {
    setEditPending(true);
    setEditError(null);
    try {
      await upsertProfile(agentIdNum, profile?.owner || connectedWallet || "", {
        display_name: editDisplayName || undefined,
        bio: editBio || undefined,
        avatar_url: editAvatarUrl || undefined,
        tags: editTags.length > 0 ? editTags : undefined,
      });
      setEditSuccess(true);
      setTimeout(() => setIsEditing(false), 1200);
    } catch (err: any) {
      setEditError(parseContractError(err));
    } finally {
      setEditPending(false);
    }
  };

  const addOnChainSkill = async (skillId: string) => {
    setEditError(null);
    try {
      await addSkill(agentIdNum, skillId);
      refetchSkills();
    } catch (err: any) {
      setEditError(parseContractError(err));
    }
  };

  const removeOnChainSkill = async (skillId: string) => {
    setEditError(null);
    try {
      await removeSkill(agentIdNum, skillId);
      refetchSkills();
    } catch (err: any) {
      setEditError(parseContractError(err));
    }
  };

  const toggleAgentActive = async () => {
    setEditError(null);
    try {
      await toggleActive(agentIdNum);
    } catch (err: any) {
      setEditError(parseContractError(err));
    }
  };

  // ── erc-7857 action handlers ────────────────────────────────────────────────

  const toggleAction = (id: ActionTab) => {
    setActiveAction(prev => prev === id ? null : id);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleUpdateCapability = async () => {
    if (!newCapValue.trim()) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const hash = hashString(newCapValue);
      const sealedKey = (newSealedKey.startsWith("0x") ? newSealedKey : `0x${newSealedKey}`) as `0x${string}`;
      await updateCapability(agentIdNum, hash, sealedKey || "0x01");
      setActionSuccess("Capability updated! New version sealed on-chain.");
      setNewCapValue("");
    } catch (err: any) {
      setActionError(parseContractError(err));
    }
  };

  const handleAuthorize = async () => {
    if (!isValidAddress(execAddr)) { setActionError("Invalid executor address"); return; }
    const hours = parseFloat(durationHours);
    if (isNaN(hours) || hours <= 0) { setActionError("Invalid duration"); return; }
    setActionError(null);
    setActionSuccess(null);
    try {
      const permHash = hashString(permissionsDesc || "full");
      const durationSec = Math.floor(hours * 3600);
      await authorizeUsage(agentIdNum, execAddr as Address, durationSec, permHash);
      setActionSuccess(`${execAddr.slice(0, 10)}... authorized for ${hours}h.`);
      setExecAddr("");
      setPermissionsDesc("");
      refetchAuths();
    } catch (err: any) {
      setActionError(parseContractError(err));
    }
  };

  const handleRevoke = async (addr: string) => {
    setActionError(null);
    try {
      await revokeUsage(agentIdNum, addr as Address);
      refetchAuths();
    } catch (err: any) {
      setActionError(parseContractError(err));
    }
  };

  const handleTransfer = async () => {
    if (!isValidAddress(transferTo)) { setActionError("Invalid recipient address"); return; }
    if (!transferCapValue.trim()) { setActionError("New capability value is required"); return; }
    if (!transferOracleSig.startsWith("0x")) { setActionError("Oracle signature must start with 0x"); return; }
    setActionError(null);
    setActionSuccess(null);
    try {
      const capHash = hashString(transferCapValue);
      const sealed = (transferSealedKey.startsWith("0x") ? transferSealedKey : `0x${transferSealedKey}`) as `0x${string}`;
      await iTransfer(agentIdNum, transferTo as Address, capHash, sealed || "0x01", transferOracleSig as `0x${string}`);
      setActionSuccess("Transfer submitted! New owner can now read the sealed key from events.");
    } catch (err: any) {
      setActionError(parseContractError(err));
    }
  };

  const handleClone = async () => {
    if (!isValidAddress(cloneTo)) { setActionError("Invalid new owner address"); return; }
    if (!cloneCapValue.trim()) { setActionError("New capability value is required"); return; }
    if (!cloneOracleSig.startsWith("0x")) { setActionError("Oracle signature must start with 0x"); return; }
    setActionError(null);
    setActionSuccess(null);
    try {
      const capHash = hashString(cloneCapValue);
      const sealed = (cloneSealedKey.startsWith("0x") ? cloneSealedKey : `0x${cloneSealedKey}`) as `0x${string}`;
      await iClone(agentIdNum, cloneTo as Address, capHash, sealed || "0x01", cloneOracleSig as `0x${string}`);
      setActionSuccess("Clone minted! New agent created with reset reputation.");
      setCloneTo("");
      setCloneCapValue("");
    } catch (err: any) {
      setActionError(parseContractError(err));
    }
  };

  if (onChainLoading) {
    return (
      <RBACGuard>
        <div className="max-w-3xl">
          <div className="mb-6"><div className="w-32 h-4 bg-white/5 rounded animate-pulse mb-4" /></div>
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
            <div className="space-y-4">
              <div className="w-48 h-6 bg-white/5 rounded animate-pulse" />
              <div className="w-full h-20 bg-white/5 rounded animate-pulse" />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            </div>
          </div>
        </div>
      </RBACGuard>
    );
  }

  if (!profile) {
    return (
      <RBACGuard>
        <div className="max-w-3xl">
          <Link href="/dashboard?tab=agents" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] mb-6">
            ← Back to Dashboard
          </Link>
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-8 text-center">
            <p className="text-red-400/70 text-[14px]">Agent not found.</p>
          </div>
        </div>
      </RBACGuard>
    );
  }

  const score = Number(profile.overallScore || 0);
  const scoreInfo = getScoreLabel(score);
  const onChainSkills = (onChainSkillIds || []) as string[];
  const displayName = supabaseProfile?.display_name || `Agent #${agentIdNum}`;
  const bio = supabaseProfile?.bio;
  const avatarUrl = supabaseProfile?.avatar_url;

  return (
    <RBACGuard>
      <div className="max-w-3xl space-y-6">
        {/* Back navigation */}
        <Link href="/dashboard?tab=agents" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] transition-colors">
          ← Back to My Agents
        </Link>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6 overflow-hidden"
        >
          {/* Gradient aura — top-right cyan haze */}
          <div
            className="absolute -top-24 -right-24 w-80 h-80 pointer-events-none opacity-40"
            style={{
              background: "radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 60%)",
            }}
            aria-hidden
          />

          {/* Faint grid texture behind content */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden
          />

          {/* Corner brackets — absolute, but at default z so content stays above */}
          <CornerBrackets size="md" weight="hair" accent="rgba(56,189,248,0.7)" inset={14} className="absolute inset-0" />

          {/* Terminal serial — top-right monospace label */}
          <div className="absolute top-3 right-16 hidden md:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 pointer-events-none" aria-hidden>
            <span className={`w-1.5 h-1.5 rounded-full ${profile.isActive ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" : "bg-white/25"}`} />
            <span>agent-{Number(agentId)} · on-chain</span>
          </div>

          <div className="relative flex items-start gap-4 mb-6">
            {avatarUrl ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                <Image src={avatarUrl} alt={displayName} width={64} height={64} className="w-full h-full object-cover" unoptimized />
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarGradient(Number(agentId))} flex items-center justify-center text-white text-[18px] font-bold flex-shrink-0`}>
                #{Number(agentId)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-medium text-white">{displayName}</h1>
                <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${profile.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {profile.isActive ? "Active" : "Inactive"}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold ${scoreInfo.color} bg-white/5`}>
                  {scoreInfo.label}-Tier
                </span>
              </div>
              <p className="text-white/40 text-[13px] font-mono">
                Wallet: {profile.agentWallet?.slice(0, 10)}...{profile.agentWallet?.slice(-6)}
              </p>
              <p className="text-white/40 text-[12px] font-mono mt-0.5">
                Owner: {profile.owner?.slice(0, 10)}...{profile.owner?.slice(-6)}
              </p>
              {bio && <p className="text-white/50 text-[13px] mt-2 leading-relaxed">{bio}</p>}
            </div>

            {isOwner && (
              <button
                onClick={isEditing ? cancelEditing : startEditing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 text-[13px] hover:border-white/30 hover:text-white transition-all flex-shrink-0"
              >
                {isEditing ? <><X className="w-4 h-4" /> Cancel</> : <><Settings className="w-4 h-4" /> Edit Agent</>}
              </button>
            )}
          </div>

          {/* Score bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-white/40">Reputation Score</span>
              <span className="text-white font-medium text-[14px]">{(score / 100).toFixed(2)}/100</span>
            </div>
            <div className="h-2 bg-[#050810]/80 border border-white/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, score / 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] rounded-full" />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Default Rate" value={formatOG(BigInt(profile.defaultRate || 0))} />
            <StatCard label="Jobs Done" value={Number(profile.totalJobsCompleted || 0).toString()} />
            <StatCard label="Attempted" value={Number(profile.totalJobsAttempted || 0).toString()} />
            <StatCard label="Earnings" value={formatOG(BigInt(profile.totalEarningsWei || 0))} />
          </div>
        </motion.div>

        {/* Reputation radar — composite view of the 5 trust axes */}
        {(() => {
          const done = Number(profile.totalJobsCompleted || 0);
          const attempted = Number(profile.totalJobsAttempted || 0);
          const completionPct = attempted > 0 ? (done / attempted) * 100 : (done > 0 ? 100 : 0);
          const skillsCount = (onChainSkillIds as unknown as string[] | undefined)?.length ?? 0;
          const volumeScore = Math.min(100, done * 8); // 12+ jobs = full
          const skillScore = Math.min(100, skillsCount * 20); // 5+ skills = full
          const activeScore = profile.isActive ? Math.max(40, Math.min(100, score / 100)) : 25;

          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 md:p-8 mb-6"
            >
              {/* Subtle tech grid backdrop */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
                aria-hidden
              />
              <CornerBrackets
                size="sm"
                weight="hair"
                accent="rgba(56,189,248,0.35)"
                inset={12}
                className="absolute inset-0 pointer-events-none"
              />

              <div className="relative flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[14px] font-semibold text-white/70 uppercase tracking-[0.2em]">
                    Trust Composite
                  </h2>
                  <p className="text-white/40 text-[12px] mt-1">
                    Five-axis reputation read from on-chain performance
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                  on-chain · live
                </div>
              </div>

              <div className="relative">
                <ReputationRadar
                  axes={[
                    { label: "Reputation", value: score / 100 },
                    { label: "Completion", value: completionPct, sub: `${done}/${attempted || "—"}` },
                    { label: "Volume", value: volumeScore, sub: `${done} jobs` },
                    { label: "Skills", value: skillScore, sub: `${skillsCount}` },
                    { label: "Activity", value: activeScore },
                  ]}
                />
              </div>
            </motion.div>
          );
        })()}

        {/* Edit Panel */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-[#38bdf8]/20 bg-[#0d1525]/90 p-6 mb-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-white/70 uppercase tracking-wider">Edit Agent Profile</h2>
              </div>

              {/* Supabase profile fields */}
              <div className="space-y-4">
                <p className="text-[11px] text-white/30 uppercase tracking-wider">Off-Chain Profile (Supabase)</p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/40 mb-1">Display Name</label>
                    <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder="Agent display name" className="w-full bg-[#050810]/80 border border-white/10 rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#38bdf8]/30" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/40 mb-1">Bio</label>
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Short bio..." rows={2} className="w-full bg-[#050810]/80 border border-white/10 rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#38bdf8]/30 resize-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/40 mb-1">Avatar URL</label>
                    <input value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)} placeholder="https://..." className="w-full bg-[#050810]/80 border border-white/10 rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#38bdf8]/30" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/40 mb-2">Tags / Capabilities</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editTags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[12px] text-[#38bdf8]">
                          {tag.replace(/_/g, " ")}
                          <button onClick={() => toggleTag(tag)} className="hover:text-white/60 ml-1"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SKILLS.filter(s => !editTags.includes(s.id)).map(skill => (
                        <button key={skill.id} onClick={() => toggleTag(skill.id)} className="px-2.5 py-1 rounded-full border border-white/10 text-[11px] text-white/40 hover:border-white/30 hover:text-white/60 transition-all">
                          + {skill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* On-chain section */}
              <div className="space-y-4 pt-2 border-t border-white/5">
                <p className="text-[11px] text-white/30 uppercase tracking-wider">On-Chain Skills</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {onChainSkills.length === 0 && <span className="text-white/25 text-[12px]">No on-chain skills registered.</span>}
                  {onChainSkills.map(sid => {
                    const skillLabel = SKILL_LABELS[sid] || sid.slice(0, 8) + "...";
                    return (
                      <span key={sid} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[12px] text-white/60">
                        {skillLabel}
                        <button onClick={() => removeOnChainSkill(sid)} className="hover:text-red-400 ml-1"><X className="w-3 h-3" /></button>
                      </span>
                    );
                  })}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#38bdf8]/30 bg-[#38bdf8]/5 text-[#38bdf8] text-[12px] hover:bg-[#38bdf8]/10 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add On-Chain Skill
                  </button>
                  {showSkillDropdown && (
                    <div className="absolute z-10 mt-2 w-56 bg-[#0a0f1a] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                      {availableSkills.length === 0 ? (
                        <p className="px-4 py-3 text-white/30 text-[12px]">All skills added</p>
                      ) : (
                        availableSkills.map(skill => (
                          <button
                            key={skill.id}
                            onClick={() => { addOnChainSkill(skill.id); setShowSkillDropdown(false); }}
                            className="w-full px-4 py-2.5 text-left text-[13px] text-white/60 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2"
                          >
                            <span className="text-[10px] text-white/30">{skill.category}</span>
                            {skill.label}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle active status */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div>
                  <p className="text-white/60 text-[13px]">Agent Status</p>
                  <p className="text-white/30 text-[11px]">{profile.isActive ? "Agent is accepting jobs" : "Agent is paused"}</p>
                </div>
                <button
                  onClick={toggleAgentActive}
                  className={`px-4 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                    profile.isActive
                      ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                      : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  }`}
                >
                  {profile.isActive ? "Pause Agent" : "Activate Agent"}
                </button>
              </div>

              {/* Error / success */}
              <AnimatePresence>
                {editError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                    <p className="text-red-400 text-[12px]">{editError}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {editSuccess && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
                    <p className="text-emerald-400 text-[12px]">Profile updated successfully!</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save button */}
              <button
                onClick={saveProfile}
                disabled={editPending}
                className="w-full px-6 py-3 bg-white text-black text-[14px] font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
              >
                {editPending ? "Saving..." : "Save Profile Changes"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* On-chain data section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 mb-6"
        >
          <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-4">On-Chain Data</h2>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-white/40">Capability CID</span>
              <span className="text-white/60 font-mono text-[11px] max-w-[200px] truncate">{profile.capabilityCID || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Profile CID</span>
              <span className="text-white/60 font-mono text-[11px]">{profile.profileCID || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Created</span>
              <span className="text-white/60">
                {profile.createdAt ? new Date(Number(profile.createdAt) * 1000).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Telegram notifications */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5 mb-6"
          >
            <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">Notifications</h2>
            <ConnectTelegramButton />
          </motion.div>
        )}

        {/* Job history */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6"
        >
          <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">Job History</h2>
          {Number(profile.totalJobsCompleted || 0) === 0 ? (
            <div className="text-center py-6">
              <p className="text-white/30 text-[13px] mb-1">No jobs completed yet</p>
              <p className="text-white/20 text-[12px]">When your agent accepts jobs, they will appear here.</p>
            </div>
          ) : (
            <p className="text-white/40 text-[13px]">
              {Number(profile.totalJobsCompleted)} job(s) completed.
              <Link href="/dashboard/my-proposals" className="text-[#38bdf8] ml-1 hover:underline">View all →</Link>
            </p>
          )}
        </motion.div>
      </div>
    </RBACGuard>
  );
}