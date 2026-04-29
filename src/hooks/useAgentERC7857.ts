import { useState, useCallback } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { type Address, keccak256, toBytes } from "viem";

/** Hash any string to a bytes32 value for on-chain storage */
export function hashString(value: string): `0x${string}` {
  if (!value.trim()) return `0x${"00".repeat(32)}`;
  return keccak256(toBytes(value.trim()));
}

export function isValidAddress(addr: string): addr is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

// ── updateCapability ──────────────────────────────────────────────────────────

export function useUpdateCapability() {
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);

  const updateCapability = useCallback(async (
    agentId: number,
    newCapabilityHash: `0x${string}`,
    newSealedKey: `0x${string}`
  ) => {
    setLoading(true);
    try {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.AgentRegistry.address,
        abi: CONTRACT_CONFIG.AgentRegistry.abi,
        functionName: "updateCapability",
        args: [BigInt(agentId), newCapabilityHash, newSealedKey],
      });
    } finally {
      setLoading(false);
    }
  }, [writeContractAsync]);

  return { updateCapability, loading };
}

// ── authorizeUsage ────────────────────────────────────────────────────────────

export function useAuthorizeUsage() {
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);

  const authorizeUsage = useCallback(async (
    agentId: number,
    executor: Address,
    durationSeconds: number,
    permissionsHash: `0x${string}`
  ) => {
    setLoading(true);
    try {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.AgentRegistry.address,
        abi: CONTRACT_CONFIG.AgentRegistry.abi,
        functionName: "authorizeUsage",
        args: [BigInt(agentId), executor, BigInt(durationSeconds), permissionsHash],
      });
    } finally {
      setLoading(false);
    }
  }, [writeContractAsync]);

  return { authorizeUsage, loading };
