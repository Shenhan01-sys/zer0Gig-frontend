"use client";

import { useReadContract, useWriteContract } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import type { Address, Hex } from "viem";
import { parseContractError } from "@/lib/utils";

export type MarketplaceMode = 0 | 1; // 0 = TRANSFER, 1 = CLONE
export type OrderStatus    = 0 | 1 | 2; // PENDING | SETTLED | REFUNDED

export interface MarketplaceOrder {
  buyer:        Address;
  seller:       Address;
  agentId:      bigint;
  finalAgentId: bigint;
  amountWei:    bigint;
  createdAt:    bigint;
  expiresAt:    bigint;
  mode:         MarketplaceMode;
  status:       OrderStatus;
}

// ── Buy ──────────────────────────────────────────────────────────────────────

export function useBuyAgent() {
  const { writeContractAsync, isPending, isSuccess, isError, error, data } = useWriteContract();

  const buyAgent = async (
    agentId: bigint,
    seller: Address,
    mode: MarketplaceMode,
    newCapabilityHash: Hex,
    newSealedKey: Hex,
    oracleProof: Hex,
    value: bigint
  ): Promise<Hex | undefined> => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.AgentMarketplace.address as Address,
        abi:     CONTRACT_CONFIG.AgentMarketplace.abi,
        functionName: "buyAgent",
        args: [agentId, seller, mode, newCapabilityHash, newSealedKey, oracleProof],
        value,
      });
      return hash;
    } catch (err) {
      throw new Error(parseContractError(err));
    }
  };

  return { buyAgent, isPending, isSuccess, isError, error, txHash: data };
}

// ── Complete / Refund ────────────────────────────────────────────────────────

export function useCompleteTransfer() {
  const { writeContractAsync, isPending, isSuccess, isError, error, data } = useWriteContract();
  const completeTransfer = async (orderId: bigint) => {
    return writeContractAsync({
      address: CONTRACT_CONFIG.AgentMarketplace.address as Address,
      abi:     CONTRACT_CONFIG.AgentMarketplace.abi,
      functionName: "completeTransfer",
      args: [orderId],
    });
  };
  return { completeTransfer, isPending, isSuccess, isError, error, txHash: data };
}

export function useCompleteClone() {
  const { writeContractAsync, isPending, isSuccess, isError, error, data } = useWriteContract();
  const completeClone = async (orderId: bigint, newAgentId: bigint) => {
    return writeContractAsync({
      address: CONTRACT_CONFIG.AgentMarketplace.address as Address,
      abi:     CONTRACT_CONFIG.AgentMarketplace.abi,
      functionName: "completeClone",
      args: [orderId, newAgentId],
    });
  };
  return { completeClone, isPending, isSuccess, isError, error, txHash: data };
}

export function useRefundExpired() {
  const { writeContractAsync, isPending, isSuccess, isError, error, data } = useWriteContract();
  const refundExpired = async (orderId: bigint) => {
    return writeContractAsync({
      address: CONTRACT_CONFIG.AgentMarketplace.address as Address,
      abi:     CONTRACT_CONFIG.AgentMarketplace.abi,
      functionName: "refundExpired",
      args: [orderId],
    });
  };
  return { refundExpired, isPending, isSuccess, isError, error, txHash: data };
}

// ── Reads ────────────────────────────────────────────────────────────────────

export function useOrder(orderId: bigint | undefined) {
  const enabled = orderId !== undefined;
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.AgentMarketplace.address as Address,
    abi:     CONTRACT_CONFIG.AgentMarketplace.abi,
    functionName: "getOrder",
    args: enabled ? [orderId] : undefined,
    query: { enabled },
  });
  return { order: data as MarketplaceOrder | undefined, isLoading, refetch };
}
