import { useState, useCallback } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";


export interface Skill {
  id: string;
  label: string;
  category: string;
}

export const ALL_SKILLS: Skill[] = [
  { id: "web_search",       label: "Web Search",       category: "research" },
  { id: "code_execution",  label: "Code Exec",        category: "coding" },
  { id: "data_analysis",   label: "Data Analysis",    category: "data" },
  { id: "content_writing", label: "Writing",          category: "writing" },
  { id: "image_generation",label: "Image Gen",         category: "creative" },
  { id: "solidity_dev",    label: "Solidity",          category: "coding" },
  { id: "frontend_dev",   label: "Frontend",          category: "coding" },
  { id: "mcp",             label: "MCP",               category: "tool" },
  { id: "telegram_customer", label: "Telegram Bot",   category: "tool" },
  { id: "trading_agent",   label: "Trading",          category: "tool" },
  { id: "market_analysis",   label: "Market Analysis",   category: "trading" },
  { id: "order_execution",   label: "Order Execution",    category: "trading" },
  { id: "chart_patterns",   label: "Chart Patterns",     category: "trading" },
  { id: "risk_management",   label: "Risk Management",    category: "trading" },
];

export const SKILL_LABELS: Record<string, string> = {
  "web_search":        "Web Search",
  "code_execution":   "Code Exec",
  "data_analysis":    "Data Analysis",
  "content_writing":  "Writing",
  "image_generation": "Image Gen",
  "solidity_dev":     "Solidity",
  "frontend_dev":    "Frontend",
  "mcp":              "MCP",
  "telegram_customer":"Telegram Bot",
  "trading_agent":    "Trading",
  "market_analysis":  "Market Analysis",
  "order_execution":  "Order Execution",
  "chart_patterns":   "Chart Patterns",
  "risk_management":  "Risk Management",
};

export const SKILL_CATEGORIES: Record<string, string> = {
  "web_search":        "research",
  "code_execution":   "coding",
  "data_analysis":    "data",
  "content_writing": "writing",
  "image_generation": "creative",
  "solidity_dev":     "coding",
  "frontend_dev":    "coding",
  "mcp":              "tool",
  "telegram_customer":"tool",
  "trading_agent":    "tool",
  "market_analysis":  "trading",
  "order_execution":  "trading",
  "chart_patterns":  "trading",
  "risk_management":  "trading",
};

const LEGACY_SKILL_ALIASES: Record<string, string> = {
  "solidity-dev":    "solidity_dev",
  "web-search":      "web_search",
  "code-execution":  "code_execution",
  "data-analysis":   "data_analysis",
  "content-writing": "content_writing",
  "image-generation":"image_generation",
  "frontend-dev":    "frontend_dev",
};

function normalizeSkillId(id: string): string {
  return LEGACY_SKILL_ALIASES[id] || id;
}

export function skillIdsToBytes32(skillIds: string[]): `0x${string}`[] {
  return skillIds
    .map(id => normalizeSkillId(id))
    .map(id => {
      const STATIC: Record<string, string> = {
        "solidity_dev":    "0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b",
        "web_search":      "0x5c6b7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e00",
        "code_execution":  "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d00",
        "data_analysis":   "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a00",
        "content_writing": "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f00",
        "image_generation":"0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c00",
        "frontend_dev":    "0x2c5d2e1e0b72e9f9f6c3e0c1d2a1b0a9f8e7d6c5b4a392817060504030201000",
        "mcp":              "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1",
        "telegram_customer":"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2",
        "trading_agent":    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa3",
        "market_analysis":  "0x4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f0001",
        "order_execution":  "0x7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a0002",
        "chart_patterns":   "0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c0003",
        "risk_management":   "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d0004",
      };
      return (STATIC[id] || id) as `0x${string}`;
    });
}

export function useAgentManagement() {
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSkill = useCallback(async (agentId: number, skillId: string) => {
    setLoading(true);
    setError(null);
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_CONFIG.AgentRegistry.address,
        abi: CONTRACT_CONFIG.AgentRegistry.abi,
        functionName: "addSkill",
        args: [BigInt(agentId), skillId as `0x${string}`],
      });
      return txHash;
    } catch (err: any) {
      setError(err?.message || "Failed to add skill");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [writeContractAsync]);

  const removeSkill = useCallback(async (agentId: number, skillId: string) => {
    setLoading(true);
    setError(null);
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_CONFIG.AgentRegistry.address,
        abi: CONTRACT_CONFIG.AgentRegistry.abi,
        functionName: "removeSkill",
        args: [BigInt(agentId), skillId as `0x${string}`],
      });
      return txHash;
    } catch (err: any) {
      setError(err?.message || "Failed to remove skill");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [writeContractAsync]);

  const toggleActive = useCallback(async (agentId: number) => {
    setLoading(true);
    setError(null);
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_CONFIG.AgentRegistry.address,
        abi: CONTRACT_CONFIG.AgentRegistry.abi,
        functionName: "toggleActive",
        args: [BigInt(agentId)],
      });
      return txHash;
    } catch (err: any) {
      setError(err?.message || "Failed to toggle agent status");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [writeContractAsync]);

  const updateCapabilities = useCallback(async (
    agentId: number,
    newCapabilityHash: `0x${string}`,
    newSealedKey: `0x${string}` = "0x01"
  ) => {
    setLoading(true);
    setError(null);
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_CONFIG.AgentRegistry.address,
        abi: CONTRACT_CONFIG.AgentRegistry.abi,
        functionName: "updateCapability",
        args: [BigInt(agentId), newCapabilityHash, newSealedKey],
      });
      return txHash;
    } catch (err: any) {
      setError(err?.message || "Failed to update capability");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [writeContractAsync]);

  return { addSkill, removeSkill, toggleActive, updateCapabilities, loading, error };
}

export function useTotalAgents() {
  return useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: "totalAgents",
  });
}

export function useAgentSkills(agentId: bigint | string | undefined) {
  const enabled = !!agentId && agentId !== "0" && agentId !== 0n;
  const id = agentId
    ? (typeof agentId === "string" ? BigInt(agentId) : agentId)
    : 0n;

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: "getAgentSkills",
    args: [id],
    query: { enabled },
  });

  return {
    data: (data as `0x${string}`[] | undefined) ?? [],
    isLoading,
    refetch,
  };
}