"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAgentProfile as useOnChainAgentProfile } from "@/hooks/useAgentRegistry";
import { useAgentProfile as useSupabaseAgentProfile } from "@/hooks/useAgentProfile";
import { useAgentSkills, ALL_SKILLS, SKILL_LABELS } from "@/hooks/useAgentManagement";
import { useAgentManagement } from "@/hooks/useAgentManagement";
import { useUpsertAgentProfile } from "@/hooks/useAgentProfile";
import { useWalletClient, useAccount } from "wagmi";
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
import CustomToolModal, { type ToolConfig } from "@/components/CustomToolModal";
import PreBuiltToolsGrid from "@/components/PreBuiltToolsGrid";
import AgentStoragePanel from "@/components/AgentStoragePanel";
import NeuralNetwork3D, { type ActivityEntry } from "@/components/agents/NeuralNetwork3D";
import AgentPortfolio from "@/components/agents/AgentPortfolio";
import CornerBrackets from "@/components/ui/CornerBrackets";
import ReputationRadar from "@/components/agents/ReputationRadar";
import JobOrbitCarousel from "@/components/agents/JobOrbitCarousel";
import { useAgentJobs } from "@/hooks/useProgressiveEscrow";
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

function InputField({
  label, value, onChange, placeholder, type = "text", mono = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] text-white/40 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[#050810]/80 border border-white/10 rounded-lg px-3 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#38bdf8]/40 transition-colors ${mono ? "font-mono" : ""}`}
      />
    </div>
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
  const { address: accountAddress } = useAccount();
  const connectedWallet = accountAddress?.toLowerCase();

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

  // Job history for this agent's wallet
  const { jobs: agentJobs, isLoading: jobsLoading } = useAgentJobs(profile?.agentWallet as Address | undefined);

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

  // ── custom tools edit ──────────────────────────────────────────────────────
  const [editTools, setEditTools] = useState<ToolConfig[]>([]);
  const [toolModal, setToolModal] = useState<{ mode: "add" | "edit"; tool?: ToolConfig } | null>(null);
  const [toolsSaving, setToolsSaving] = useState(false);

  // ── platform skills edit ────────────────────────────────────────────────────
  const [editPlatformSkills, setEditPlatformSkills] = useState<string[]>([]);
  const [editSkillConfigs, setEditSkillConfigs] = useState<Record<string, Record<string, string>>>({});
  const [skillsSaving, setSkillsSaving] = useState(false);

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

  const [oracleSigLoading, setOracleSigLoading] = useState(false);

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

      // Seed tools from metadata.tools (runtime format → ToolConfig)
      const runtimeTools: unknown[] = (supabaseProfile.metadata as Record<string, unknown>)?.tools as unknown[] || [];
      setEditTools(runtimeTools.map((t: any, i) => ({
        id: `existing-${i}`,
        type: (t.type === "mcp" ? "mcp" : "http") as "http" | "mcp",
        name: t.name || "",
        description: t.description || "",
        endpoint: t.config?.endpoint || t.config?.url || "",
        apiKey: t.config?.apiKey || "",
        ...(t.type === "mcp" ? {
          mcpTransport: (t.config?.command ? "package" : "url") as "url" | "package",
          ...(t.config?.command === "npx" && t.config?.args?.[1]
            ? { npmPackage: t.config.args[1] }
            : {}),
        } : {}),
      })));

      // Load current agent_skills (platform skill configs)
      supabase
        .from("agent_skills")
        .select("skill_id, config, is_active")
        .eq("agent_id", agentIdNum)
        .then(({ data }) => {
          if (data) {
            setEditPlatformSkills(data.filter(s => s.is_active).map(s => s.skill_id));
            const configs: Record<string, Record<string, string>> = {};
            data.forEach((s: any) => { if (s.config) configs[s.skill_id] = s.config; });
            setEditSkillConfigs(configs);
          }
        });
    }
  }, [supabaseProfile, agentIdNum]);

  // Tools extracted from supabase metadata for the neural map
  const displayTools = useMemo(() => {
    const runtimeTools = ((supabaseProfile?.metadata as any)?.tools as any[]) ?? [];
    return runtimeTools.map((t: any) => ({ name: t.name || "unnamed", type: t.type || "http" }));
  }, [supabaseProfile]);

  // Activity log for the neural map sidebar
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  useEffect(() => {
    if (!agentIdNum) return;
    const load = () =>
      fetch(`/api/agent-activity?agentId=${agentIdNum}&limit=30`)
        .then(r => r.ok ? r.json() : [])
        .then(d => Array.isArray(d) ? setActivityLog(d) : null)
        .catch(() => null);
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [agentIdNum]);

  const startEditing = () => {
    setEditDisplayName(supabaseProfile?.display_name || "");
    setEditBio(supabaseProfile?.bio || "");
    setEditAvatarUrl(supabaseProfile?.avatar_url || "");
    setEditTags(supabaseProfile?.tags || []);
    setEditError(null);
    setEditSuccess(false);
    setIsEditing(true);
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

  const saveTools = async () => {
    setToolsSaving(true);
    setEditError(null);
    try {
      // Convert ToolConfig[] → runtime format for Supabase metadata.tools
      const runtimeTools = editTools.map(t => ({
        type: t.type,
        name: t.name,
        description: t.description,
        config: {
          ...(t.type === "http"
            ? { endpoint: t.endpoint, method: "POST" }
            : t.mcpTransport === "package" && t.npmPackage
              ? { command: "npx", args: ["-y", t.npmPackage] }
              : { url: t.endpoint }),
          ...(t.apiKey ? { apiKey: t.apiKey } : {}),
        },
      }));

      const res = await fetch("/api/agent-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentIdNum, tools: runtimeTools }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save tools");
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 2000);
    } catch (err: any) {
      setEditError(err.message || "Failed to save tools");
    } finally {
      setToolsSaving(false);
    }
  };

  const saveSkillConfigs = async () => {
    setSkillsSaving(true);
    setEditError(null);
    try {
      await upsertProfile(agentIdNum, profile?.owner || connectedWallet || "", {}, editPlatformSkills, editSkillConfigs);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 2000);
    } catch (err: any) {
      setEditError(err.message || "Failed to save skill configs");
    } finally {
      setSkillsSaving(false);
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

  const fetchOracleSig = async (digest: string, setter: (s: string) => void) => {
    setOracleSigLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/oracle/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digest }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Oracle signing failed");
      setter(data.signature);
    } catch (err: any) {
      setActionError(err.message || "Failed to get oracle signature");
    } finally {
      setOracleSigLoading(false);
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

  // ── render ──────────────────────────────────────────────────────────────────

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

  // winRate is 0-10000 bps from new contract (replaces overallScore)
  const score = Number(profile.winRate || 0);
  const scoreInfo = getScoreLabel(score);
  const onChainSkills = (onChainSkillIds || []) as string[];
  const displayName = supabaseProfile?.display_name || `Agent #${agentIdNum}`;
  const bio = supabaseProfile?.bio;
  const avatarUrl = supabaseProfile?.avatar_url;
  const defaultRateWei = BigInt(profile.defaultRate || 0) * 10_000_000_000n;

  const availableSkills = ALL_SKILLS.filter(s => !onChainSkills.includes(s.id));

  return (
    <RBACGuard>
      {/* overflow-x:clip prevents horizontal scroll without breaking sticky */}
      <div className="flex flex-col xl:flex-row gap-6 items-start" style={{ overflowX: "clip" }}>

      {/* ── Left column: fixed 768px, never compressed by sidebar ───────────── */}
      <div className="w-full xl:w-[768px] xl:flex-shrink-0 space-y-6">
        {/* Back navigation */}
        <Link href="/dashboard?tab=agents" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[13px] transition-colors">
          ← Back to My Agents
        </Link>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 overflow-hidden"
        >
          <div
            className="absolute -top-24 -right-24 w-80 h-80 pointer-events-none opacity-40"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 60%)" }}
            aria-hidden
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage: "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden
          />
          <CornerBrackets size="md" weight="hair" accent="rgba(56,189,248,0.7)" inset={14} className="absolute inset-0" />

          <div className="absolute top-3 right-16 hidden md:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 pointer-events-none" aria-hidden>
            <span className={`w-1.5 h-1.5 rounded-full ${profile.isActive ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" : "bg-white/25"}`} />
            <span>agent-{agentIdNum} · erc-7857 · v{Number(profile.version || 1)}</span>
          </div>

          <div className="relative flex items-start gap-4 mb-6">
            {avatarUrl ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                <Image src={avatarUrl} alt={displayName} width={64} height={64} className="w-full h-full object-cover" unoptimized />
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${avatarGradient(agentIdNum)} flex items-center justify-center text-white text-[18px] font-bold flex-shrink-0`}>
                #{agentIdNum}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-medium text-white">{displayName}</h1>
                <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${profile.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {profile.isActive ? "Active" : "Inactive"}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold ${scoreInfo.color} bg-white/5`}>
                  {scoreInfo.label}-Tier
                </span>
              </div>
              <p className="text-white/40 text-[13px] font-mono truncate">
                Wallet: {profile.agentWallet?.slice(0, 10)}...{profile.agentWallet?.slice(-6)}
              </p>
              <p className="text-white/40 text-[12px] font-mono mt-0.5 truncate">
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
              <span className="text-[12px] text-white/40">Win Rate</span>
              <span className="text-white font-medium text-[14px]">{(score / 100).toFixed(2)}%</span>
            </div>
            <div className="h-2 bg-[#050810]/80 border border-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, score / 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#38bdf8] to-[#22d3ee] rounded-full"
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Default Rate" value={formatOG(defaultRateWei)} />
            <StatCard label="Jobs Done" value={Number(profile.totalJobsCompleted || 0).toString()} />
            <StatCard label="Attempted" value={Number(profile.totalJobsAttempted || 0).toString()} />
            <StatCard label="Earnings" value={formatOG(BigInt(profile.totalEarningsWei || 0))} />
          </div>
        </motion.div>

        {/* Reputation radar */}
        {(() => {
          const done = Number(profile.totalJobsCompleted || 0);
          const attempted = Number(profile.totalJobsAttempted || 0);
          const completionPct = attempted > 0 ? (done / attempted) * 100 : (done > 0 ? 100 : 0);
          const skillsCount = (onChainSkillIds as unknown as string[] | undefined)?.length ?? 0;
          const volumeScore = Math.min(100, done * 8);
          const skillScore = Math.min(100, skillsCount * 20);
          const activeScore = profile.isActive ? Math.max(40, Math.min(100, score / 100)) : 25;

          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 md:p-8"
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                  backgroundImage: "linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
                aria-hidden
              />
              <CornerBrackets size="sm" weight="hair" accent="rgba(56,189,248,0.35)" inset={12} className="absolute inset-0 pointer-events-none" />

              <div className="relative flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[14px] font-semibold text-white/70 uppercase tracking-[0.2em]">Trust Composite</h2>
                  <p className="text-white/40 text-[12px] mt-1">Five-axis reputation read from on-chain performance</p>
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

        {/* Edit Profile Panel */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
              className="rounded-2xl border border-[#38bdf8]/20 bg-[#0d1525]/90 p-6 space-y-5 overflow-hidden"
            >
              <motion.h2
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08, duration: 0.25 }}
                className="text-[14px] font-semibold text-white/70 uppercase tracking-wider"
              >
                Edit Agent Profile
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.28 }}
                className="space-y-4"
              >
                <p className="text-[11px] text-white/30 uppercase tracking-wider">Off-Chain Profile (Supabase)</p>
                <div className="grid grid-cols-1 gap-3">
                  <InputField label="Display Name" value={editDisplayName} onChange={setEditDisplayName} placeholder="Agent display name" />
                  <div>
                    <label className="block text-[11px] text-white/40 mb-1.5">Bio</label>
                    <textarea
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      placeholder="Short bio..."
                      rows={2}
                      className="w-full bg-[#050810]/80 border border-white/10 rounded-lg px-3 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-[#38bdf8]/40 transition-colors resize-none"
                    />
                  </div>
                  <InputField label="Avatar URL" value={editAvatarUrl} onChange={setEditAvatarUrl} placeholder="https://..." />

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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.19, duration: 0.28 }}
                className="space-y-4 pt-2 border-t border-white/5"
              >
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
                  <AnimatePresence>
                    {showSkillDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-10 mt-2 w-56 bg-[#0a0f1a] border border-white/10 rounded-xl shadow-xl overflow-hidden"
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Custom Tools section */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.28 }}
                className="space-y-3 pt-2 border-t border-white/5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider">Custom Tools (MCP / HTTP)</p>
                  <button
                    onClick={() => setToolModal({ mode: "add" })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/5 text-[#a855f7] text-[11px] hover:bg-[#a855f7]/10 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Add Tool
                  </button>
                </div>

                {editTools.length === 0 && (
                  <p className="text-[12px] text-white/20 italic">No custom tools configured.</p>
                )}

                {editTools.map(t => (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#050810]/60 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-white/70 font-medium truncate">{t.name || "(unnamed)"}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {t.type === "mcp"
                          ? (t.mcpTransport === "package" ? `npm: ${t.npmPackage}` : `MCP: ${t.endpoint}`)
                          : `HTTP: ${t.endpoint}`}
                      </p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${
                      t.type === "mcp" ? "text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10" : "text-[#38bdf8] border-[#38bdf8]/30 bg-[#38bdf8]/10"
                    }`}>{t.type}</span>
                    <button onClick={() => setToolModal({ mode: "edit", tool: t })} className="text-white/30 hover:text-white/60 transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditTools(prev => prev.filter(x => x.id !== t.id))} className="text-white/30 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {editTools.length > 0 && (
                  <button
                    onClick={saveTools}
                    disabled={toolsSaving}
                    className="w-full py-2 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/25 text-[#a855f7] text-[12px] font-medium hover:bg-[#a855f7]/15 disabled:opacity-40 transition-all"
                  >
                    {toolsSaving ? "Saving…" : "Save Tools"}
                  </button>
                )}
              </motion.div>

              {/* Platform Skills (n8n, web search, etc.) */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33, duration: 0.28 }}
                className="space-y-3 pt-2 border-t border-white/5"
              >
                <p className="text-[11px] text-white/30 uppercase tracking-wider">Platform Skills</p>
                <PreBuiltToolsGrid
                  selectedSkills={editPlatformSkills}
                  skillConfigs={editSkillConfigs}
                  onToggle={skillId =>
                    setEditPlatformSkills(prev =>
                      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
                    )
                  }
                  onConfigSave={(skillId, config) =>
                    setEditSkillConfigs(prev => ({ ...prev, [skillId]: config }))
                  }
                />
                <button
                  onClick={saveSkillConfigs}
                  disabled={skillsSaving}
                  className="w-full py-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/25 text-[#38bdf8] text-[12px] font-medium hover:bg-[#38bdf8]/15 disabled:opacity-40 transition-all"
                >
                  {skillsSaving ? "Saving…" : "Save Skills"}
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.40, duration: 0.28 }}
                className="flex items-center justify-between pt-2 border-t border-white/5"
              >
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
              </motion.div>

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

        {/* ERC-7857 Agent Actions — owner only */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-[#0d1525]/90 overflow-hidden"
          >
            {/* Section header */}
            <div className="px-6 pt-5 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                <h2 className="text-[13px] font-medium text-white/70 uppercase tracking-wider">ERC-7857 Agent Actions</h2>
              </div>
              <p className="text-[11px] text-white/30 pl-3.5">Encrypted intelligence control — capability, access, ownership</p>
            </div>

            {/* Action buttons grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
              {ACTION_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => toggleAction(tab.id)}
                  className={`flex flex-col items-start gap-1.5 px-4 py-3.5 text-left transition-all ${
                    activeAction === tab.id
                      ? "bg-[#38bdf8]/8 text-[#38bdf8]"
                      : "bg-[#0d1525]/90 text-white/50 hover:bg-white/[0.03] hover:text-white/70"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tab.icon}
                    <span className="text-[12px] font-medium">{tab.label}</span>
                    {activeAction === tab.id
                      ? <ChevronUp className="w-3 h-3 ml-auto opacity-60" />
                      : <ChevronDown className="w-3 h-3 ml-auto opacity-30" />}
                  </div>
                  <span className="text-[11px] opacity-50 leading-snug pl-5">{tab.desc}</span>
                </button>
              ))}
            </div>

            {/* Expanded action panels */}
            <AnimatePresence>
              {activeAction && (
                <motion.div
                  key={activeAction}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 py-5 space-y-4 border-t border-white/5">

                    {/* ── Update Capability ── */}
                    {activeAction === "updateCapability" && (
                      <>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[13px] text-white/70 font-medium">Rotate encrypted capability</p>
                            <p className="text-[11px] text-white/30 mt-0.5">No oracle needed — you re-seal to yourself. Bumps version.</p>
                          </div>
                          <span className="font-mono text-[10px] text-white/25 text-right">
                            Current v{Number(profile.version || 1)}<br />
                            {String(profile.capabilityHash || "").slice(0, 12)}…
                          </span>
                        </div>
                        <InputField
                          label="New Capability Identifier (IPFS CID or descriptor)"
                          value={newCapValue}
                          onChange={setNewCapValue}
                          placeholder="Qm... or any identifier — will be keccak256 hashed"
                        />
                        <InputField
                          label="New Sealed AES Key (hex bytes for new owner)"
                          value={newSealedKey}
                          onChange={setNewSealedKey}
                          placeholder="0x01 (placeholder — use actual ECIES-sealed key in production)"
                          mono
                        />
                        {newCapValue && (
                          <div className="rounded-lg bg-white/[0.03] border border-white/8 px-3 py-2 flex items-center gap-2">
                            <span className="text-[10px] text-white/30">Computed hash:</span>
                            <span className="font-mono text-[11px] text-white/50 truncate">{hashString(newCapValue)}</span>
                            <button onClick={() => navigator.clipboard.writeText(hashString(newCapValue))} className="ml-auto flex-shrink-0 hover:text-[#38bdf8] text-white/30 transition-colors">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={handleUpdateCapability}
                          disabled={updCapLoading || !newCapValue.trim()}
                          className="w-full py-2.5 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8] text-[13px] font-medium hover:bg-[#38bdf8]/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {updCapLoading ? "Broadcasting…" : "Update Capability"}
                        </button>
                      </>
                    )}

                    {/* ── Authorize Usage ── */}
                    {activeAction === "authorize" && (
                      <>
                        <div>
                          <p className="text-[13px] text-white/70 font-medium">Grant time-bounded access</p>
                          <p className="text-[11px] text-white/30 mt-0.5">Executor can use the agent&apos;s capabilities without owning it.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <InputField label="Executor Address" value={execAddr} onChange={setExecAddr} placeholder="0x..." mono />
                          <InputField label="Duration (hours)" value={durationHours} onChange={setDurationHours} placeholder="24" type="number" />
                        </div>
                        <InputField label="Permissions Description (hashed on-chain)" value={permissionsDesc} onChange={setPermissionsDesc} placeholder="e.g. read-only job execution" />

                        {/* Active authorizations */}
                        {(authorizedUsers as string[] | undefined)?.length ? (
                          <div className="space-y-2">
                            <p className="text-[11px] text-white/30 uppercase tracking-wider">Current Authorizations</p>
                            {(authorizedUsers as string[]).map(addr => (
                              <div key={addr} className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/8 px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-[#38bdf8]/60" />
                                  <span className="font-mono text-[11px] text-white/50">{addr.slice(0, 12)}…{addr.slice(-6)}</span>
                                </div>
                                <button
                                  onClick={() => handleRevoke(addr)}
                                  disabled={revokeLoading}
                                  className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                                >
                                  Revoke
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] text-white/25">No active authorizations.</p>
                        )}

                        <button
                          onClick={handleAuthorize}
                          disabled={authLoading || !isValidAddress(execAddr)}
                          className="w-full py-2.5 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8] text-[13px] font-medium hover:bg-[#38bdf8]/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {authLoading ? "Broadcasting…" : "Authorize Executor"}
                        </button>
                      </>
                    )}

                    {/* ── Transfer Agent ── */}
                    {activeAction === "transfer" && (
                      <>
                        <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[12px] text-amber-400 font-medium">Irreversible ownership transfer</p>
                            <p className="text-[11px] text-white/40 mt-0.5">Requires oracle signature over the transfer digest. New owner reads sealed key from event logs.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <InputField label="Recipient Address" value={transferTo} onChange={setTransferTo} placeholder="0x..." mono />
                          <InputField label="New Capability Identifier" value={transferCapValue} onChange={setTransferCapValue} placeholder="New IPFS CID or descriptor for the new owner" />
                          <InputField label="New Sealed AES Key (hex)" value={transferSealedKey} onChange={setTransferSealedKey} placeholder="0x01" mono />
                        </div>

                        {txDigest && (
                          <div className="rounded-lg bg-white/[0.03] border border-white/8 px-3 py-2.5 space-y-1.5">
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">Transfer Digest (oracle must sign this)</p>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-white/50 break-all">{txDigest as string}</span>
                              <button onClick={() => navigator.clipboard.writeText(txDigest as string)} className="ml-auto flex-shrink-0 hover:text-[#38bdf8] text-white/30 transition-colors">
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => txDigest && fetchOracleSig(txDigest as string, setTransferOracleSig)}
                              disabled={!txDigest || oracleSigLoading}
                              className="mt-1 text-[10px] px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                              {oracleSigLoading ? "Signing…" : "Get Oracle Signature"}
                            </button>
                          </div>
                        )}

                        <InputField label="Oracle Signature (0x...)" value={transferOracleSig} onChange={setTransferOracleSig} placeholder="0x..." mono />

                        <button
                          onClick={handleTransfer}
                          disabled={transferLoading || !isValidAddress(transferTo) || !transferCapValue || !transferOracleSig.startsWith("0x")}
                          className="w-full py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[13px] font-medium hover:bg-amber-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {transferLoading ? "Broadcasting…" : "Transfer Agent (iTransfer)"}
                        </button>
                      </>
                    )}

                    {/* ── Clone Agent ── */}
                    {activeAction === "clone" && (
                      <>
                        <div className="flex items-start gap-2 rounded-lg bg-purple-500/5 border border-purple-500/20 px-3 py-2.5">
                          <Layers className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[12px] text-purple-400 font-medium">Mints a new agent for a new owner</p>
                            <p className="text-[11px] text-white/40 mt-0.5">Skills and capabilities are copied. Reputation resets to 80% win rate. Requires oracle signature.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <InputField label="New Owner Address" value={cloneTo} onChange={setCloneTo} placeholder="0x..." mono />
                          <InputField label="New Capability Identifier" value={cloneCapValue} onChange={setCloneCapValue} placeholder="New IPFS CID or descriptor for the clone" />
                          <InputField label="New Sealed AES Key (hex)" value={cloneSealedKey} onChange={setCloneSealedKey} placeholder="0x01" mono />
                        </div>

                        {cloneDigest && (
                          <div className="rounded-lg bg-white/[0.03] border border-white/8 px-3 py-2.5 space-y-1.5">
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">Clone Digest (oracle must sign this)</p>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-white/50 break-all">{cloneDigest as string}</span>
                              <button onClick={() => navigator.clipboard.writeText(cloneDigest as string)} className="ml-auto flex-shrink-0 hover:text-[#38bdf8] text-white/30 transition-colors">
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => cloneDigest && fetchOracleSig(cloneDigest as string, setCloneOracleSig)}
                              disabled={!cloneDigest || oracleSigLoading}
                              className="text-[10px] px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                              {oracleSigLoading ? "Signing…" : "Get Oracle Signature"}
                            </button>
                          </div>
                        )}

                        <InputField label="Oracle Signature (0x...)" value={cloneOracleSig} onChange={setCloneOracleSig} placeholder="0x..." mono />

                        <button
                          onClick={handleClone}
                          disabled={cloneLoading || !isValidAddress(cloneTo) || !cloneCapValue || !cloneOracleSig.startsWith("0x")}
                          className="w-full py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-400 text-[13px] font-medium hover:bg-purple-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {cloneLoading ? "Broadcasting…" : "Clone Agent (iClone)"}
                        </button>
                      </>
                    )}

                    {/* Shared error / success feedback */}
                    <AnimatePresence>
                      {actionError && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                          <p className="text-red-400 text-[12px]">{actionError}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {actionSuccess && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <p className="text-emerald-400 text-[12px]">{actionSuccess}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* On-chain data */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6"
        >
          <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-4">On-Chain Data (ERC-7857)</h2>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between items-center gap-4">
              <span className="text-white/40 shrink-0">Capability Hash</span>
              <span className="text-white/60 font-mono text-[11px] truncate">{profile.capabilityHash || "—"}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-white/40 shrink-0">Profile Hash</span>
              <span className="text-white/60 font-mono text-[11px] truncate">{profile.profileHash || "—"}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-white/40 shrink-0">Version</span>
              <span className="text-white/60">v{Number(profile.version || 1)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-white/40 shrink-0">Created</span>
              <span className="text-white/60">
                {profile.createdAt ? new Date(Number(profile.createdAt) * 1000).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-white/40 shrink-0">Last Updated</span>
              <span className="text-white/60">
                {profile.updatedAt ? new Date(Number(profile.updatedAt) * 1000).toLocaleDateString() : "—"}
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
            className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5"
          >
            <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider mb-3">Notifications</h2>
            <ConnectTelegramButton />
          </motion.div>
        )}

        {/* Job history — interactive coverflow carousel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider">Job History</h2>
            <span className="text-[11px] font-mono text-white/35 tabular-nums">
              {agentJobs.length} job{agentJobs.length === 1 ? "" : "s"} on-chain
              {Number(profile.totalJobsCompleted || 0) > 0 && (
                <> · <span className="text-emerald-400/80">{Number(profile.totalJobsCompleted)}</span> completed</>
              )}
            </span>
          </div>
          <JobOrbitCarousel jobs={agentJobs} isLoading={jobsLoading} />
        </motion.div>

        {/* Storage Panel — owner sees all clients, client sees their own data */}
        <AgentStoragePanel agentId={agentIdNum} viewerAddress={connectedWallet} />

      </div>{/* end left column */}

      {/* ── Right column: neural map sticky sidebar ──────────────────────────── */}
      <div className="w-full xl:w-[1000px] xl:flex-shrink-0 xl:sticky xl:top-28">
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="rounded-2xl border border-white/10 bg-[#060913] overflow-hidden"
        >
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
              <h2 className="text-[12px] font-medium text-white/70 uppercase tracking-[0.2em]">Neural Capability Map</h2>
            </div>
            <p className="text-[10px] text-white/30 pl-3.5 leading-relaxed">
              {[
                onChainSkills.length > 0 && `${onChainSkills.length} skill${onChainSkills.length > 1 ? "s" : ""}`,
                displayTools.length > 0 && `${displayTools.length} tool${displayTools.length > 1 ? "s" : ""}`,
                activityLog.length > 0 && `${activityLog.length} events`,
              ].filter(Boolean).join(" · ") || "live runtime topology"}
            </p>
          </div>
          <NeuralNetwork3D
            agentName={displayName}
            tools={displayTools}
            skills={onChainSkills}
            activityLog={activityLog}
          />
        </motion.div>

        {/* ── Portfolio section ──────────────────────────────────────────── */}
        {agentIdNum && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 rounded-2xl border border-white/[0.08] bg-[#060913] overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-[12px] font-mono font-bold text-white/70 uppercase tracking-widest">
                  Activity
                </h3>
                <p className="text-[10px] text-white/25 mt-0.5">
                  Autonomous cycles · all time
                </p>
              </div>
              <div
                className="px-2 py-0.5 rounded text-[9px] font-mono"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}
              >
                ON-CHAIN PROOF
              </div>
            </div>
            <AgentPortfolio agentId={agentIdNum} hideEarnings />
          </motion.div>
        )}
      </div>{/* end right column */}

      </div>{/* end two-column wrapper */}

      {/* Custom Tool Modal */}
      {toolModal && (
        <CustomToolModal
          mode={toolModal.mode}
          initialTool={toolModal.tool}
          onSave={tool => {
            if (toolModal.mode === "add") {
              setEditTools(prev => [...prev, tool]);
            } else {
              setEditTools(prev => prev.map(t => t.id === tool.id ? tool : t));
            }
            setToolModal(null);
          }}
          onClose={() => setToolModal(null)}
        />
      )}
    </RBACGuard>
  );
}
