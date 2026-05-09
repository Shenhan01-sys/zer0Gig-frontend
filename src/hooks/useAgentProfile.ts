"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type AgentProfile } from "@/lib/supabase";
import { encryptSkillConfig } from "@/lib/cryptoSecret";

// ── Read a single agent profile ───────────────────────────────────────────────

export function useAgentProfile(agentId: number | bigint | undefined) {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (agentId === undefined) return;
    setIsLoading(true);
    // Use API route (admin client) to bypass RLS on agent_profiles
    fetch(`/api/agent-profile?agent_id=${Number(agentId)}`)
      .then(r => r.json())
      .then(({ data }) => {
        setProfile(data ?? null);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [agentId]);

  return { profile, isLoading };
}

// ── Read multiple profiles (for marketplace) ──────────────────────────────────

export function useAgentProfiles(agentIds: number[]) {
  const [profiles, setProfiles] = useState<Record<number, AgentProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (agentIds.length === 0) return;
    setIsLoading(true);

    // Fetch all profiles in parallel via API route (admin key bypasses RLS)
    Promise.all(
      agentIds.map(id =>
        fetch(`/api/agent-profile?agent_id=${id}`)
          .then(r => r.json())
          .then(({ data }) => data)
          .catch(() => null)
      )
    ).then(results => {
      const map: Record<number, AgentProfile> = {};
      results.forEach(p => { if (p) map[p.agent_id] = p; });
      setProfiles(map);
      setIsLoading(false);
    });
  }, [agentIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { profiles, isLoading };
}

// ── Upsert profile (called after agent registration) ─────────────────────────
// Uses the /api/agent-profile route (service role key) to bypass RLS.

export function useUpsertAgentProfile() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const upsert = useCallback(async (
    agentId: number,
    ownerAddress: string,
    fields: {
      display_name?: string;
      avatar_url?:   string;
      bio?:          string;
      tags?:         string[];
    },
    prebuiltSkills?:      string[],
    skillConfigs?:        Record<string, Record<string, string>>,
    customTools?:         Array<Record<string, unknown>>,
    telegramChatId?:      string | null,
  ) => {
    setIsPending(true);
    setError(null);

    // Encrypt sensitive fields (apiKey/secretKey/botToken/...) before persisting.
    // The platform private key in the runtime decrypts at execution time.
    const encryptedConfigs: Record<string, Record<string, string>> | undefined = skillConfigs
      ? Object.fromEntries(
          Object.entries(skillConfigs).map(([skillId, cfg]) => [skillId, encryptSkillConfig(cfg)])
        )
      : undefined;

    try {
      const res = await fetch("/api/agent-profile", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          agent_id:       agentId,
          owner_address:  ownerAddress,
          ...fields,
          prebuilt_skills: prebuiltSkills,
          skill_configs:   encryptedConfigs,
          custom_tools:    customTools,
          telegram_chat_id: telegramChatId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Profile upsert failed");
        setIsPending(false);
        return false;
      }
      setIsPending(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile upsert failed");
      setIsPending(false);
      return false;
    }
  }, []);

  return { upsert, isPending, error };
}
