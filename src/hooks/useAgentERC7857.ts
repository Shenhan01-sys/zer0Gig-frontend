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
}

// ── revokeUsage ───────────────────────────────────────────────────────────────

export function useRevokeUsage() {
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);

  const revokeUsage = useCallback(async (agentId: number, executor: Address) => {
    setLoading(true);
    try {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.AgentRegistry.address,
        abi: CONTRACT_CONFIG.AgentRegistry.abi,
        functionName: "revokeUsage",
        args: [BigInt(agentId), executor],
      });
    } finally {
      setLoading(false);
    }
  }, [writeContractAsync]);

  return { revokeUsage, loading };
}

// ── iTransfer ─────────────────────────────────────────────────────────────────

export function useITransfer() {
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);

  const iTransfer = useCallback(async (
    agentId: number,
    to: Address,
    newCapabilityHash: `0x${string}`,
    newSealedKey: `0x${string}`,
    oracleProof: `0x${string}`
  ) => {
    setLoading(true);
    try {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.AgentRegistry.address,
        abi: CONTRACT_CONFIG.AgentRegistry.abi,
        functionName: "iTransfer",
        args: [BigInt(agentId), to, newCapabilityHash, newSealedKey, oracleProof],
      });
    } finally {
      setLoading(false);
    }
  }, [writeContractAsync]);

  return { iTransfer, loading };
}

// ── iClone ────────────────────────────────────────────────────────────────────

export function useIClone() {
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);

  const iClone = useCallback(async (
    agentId: number,
    newOwner: Address,
    newCapabilityHash: `0x${string}`,
    newSealedKey: `0x${string}`,
    oracleProof: `0x${string}`
  ) => {
    setLoading(true);
    try {
      return await writeContractAsync({
        address: CONTRACT_CONFIG.AgentRegistry.address,
        abi: CONTRACT_CONFIG.AgentRegistry.abi,
        functionName: "iClone",
        args: [BigInt(agentId), newOwner, newCapabilityHash, newSealedKey, oracleProof],
      });
    } finally {
      setLoading(false);
    }
  }, [writeContractAsync]);

  return { iClone, loading };
}

// ── transferDigest (view) ─────────────────────────────────────────────────────

export function useTransferDigest(
  agentId: number,
  version: number,
  oldHash: `0x${string}`,
  newHash: `0x${string}`,
  to: string
) {
  const valid = isValidAddress(to);
  return useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: "transferDigest",
    args: valid ? [BigInt(agentId), version, oldHash, newHash, to as Address] : undefined,
    query: {
      enabled: valid && newHash !== `0x${"00".repeat(32)}`,
    },
  });
}

// ── authorizedUsersOf (view) ──────────────────────────────────────────────────

export function useAuthorizedUsersOf(agentId: number) {
  return useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: "authorizedUsersOf",
    args: [BigInt(agentId)],
    query: { enabled: agentId > 0 },
  });
}
