"use client";

import { useState, useEffect, useCallback } from "react";

export interface AgentListing {
  agentId: number;
  capabilityHash: string;
  name: string;
  skills: string[];
  skillIds: string[];
  tags: string[];
  rate: string;
  rateDisplay: string;
  scoreDisplay: string;
  rating: number;
  totalJobs: number;
  totalJobsCompleted: number;
  totalJobsAttempted: number;
  overallScore: number;  // 0-10000 bps (winRate from contract)
  isActive: boolean;
  agentWallet: string;
  defaultRate: bigint;
  createdAt: number;
  totalEarningsWei: bigint;
}

interface OnChainAgent {
  agentId: number;
  owner: string;
  agentWallet: string;
  capabilityHash: string;
  profileHash: string;
  winRate: number;       // 0-10000 bps (replaces overallScore)
  overallScore: number;  // legacy alias = winRate, set by API route
  totalJobsCompleted: number;
  totalJobsAttempted: number;
  totalEarningsWei: string;
  defaultRate: string;  // wei string (API already multiplied by 1e10)
  createdAt: number;
  isActive: boolean;
  displayName: string | null;
  tags: string[] | null;
}

interface ApiResponse {
  agents: OnChainAgent[];
  total: number;
}

function decodeSkillsFromCID(capabilityHash: string): string[] {
  // capabilityHash is now a bytes32 hex — skills are stored in Supabase tags, not encoded here
  if (!capabilityHash || capabilityHash.startsWith("0x")) return [];
  try {
    let base64 = capabilityHash;
    if (capabilityHash.includes(":")) base64 = capabilityHash.split(":")[1];
    const decoded = JSON.parse(atob(base64));
    return decoded.skills || [];
  } catch {
    return [];
  }
}

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().replace(/[\s_-]+/g, "");
}

export function skillMatchesFilter(skillId: string, filterId: string): boolean {
  const normalizedSkill = normalizeSkill(skillId);
  const normalizedFilter = normalizeSkill(filterId);
  return normalizedSkill.includes(normalizedFilter) || normalizedFilter.includes(normalizedSkill);
}

function mapOnChainToAgentListing(agent: OnChainAgent): AgentListing {
  const defaultRateBig = BigInt(agent.defaultRate);
  const ogRate = Number(defaultRateBig) / 1e18;

  // Skills come from Supabase tags (stored at registration); capabilityHash is bytes32
  const agentTags: string[] = agent.tags || [];
  const tagLabels = agentTags.map((t: string) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
  ).filter(Boolean);

  // winRate is 0-10000 bps — keep at that scale for consistent percentage math
  const score = agent.overallScore ?? agent.winRate ?? 0;

  return {
    agentId: agent.agentId,
    capabilityHash: agent.capabilityHash || "",
    name: agent.displayName || `Agent #${agent.agentId}`,
    skills: tagLabels,
    skillIds: agentTags,
    tags: agentTags,
    rate: agent.defaultRate,
    rateDisplay: ogRate.toFixed(3),
    scoreDisplay: (score / 100).toFixed(1),   // "85.0" for 8500 bps
    rating: score / 1000,                      // 0-10 scale
    totalJobs: agent.totalJobsCompleted,
    totalJobsCompleted: agent.totalJobsCompleted,
    totalJobsAttempted: agent.totalJobsAttempted,
    overallScore: score,                        // 0-10000 — divide by 100 for % in templates
    isActive: agent.isActive,
    agentWallet: agent.agentWallet,
    defaultRate: defaultRateBig,
    createdAt: agent.createdAt,
    totalEarningsWei: BigInt(agent.totalEarningsWei),
  };
}

export function useAllAgents(enabled = true) {
  const [agents, setAgents] = useState<AgentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      const mapped = data.agents.map(mapOnChainToAgentListing);
      setAgents(mapped);
    } catch (err) {
      console.error("[useAllAgents] Failed to fetch agents:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchAgents();
  }, [enabled, fetchAgents]);

  return {
    agents,
    totalCount: agents.length,
    isLoading: loading,
    isError: !!error,
    refetch: fetchAgents,
    skillMatchesFilter,
  };
}