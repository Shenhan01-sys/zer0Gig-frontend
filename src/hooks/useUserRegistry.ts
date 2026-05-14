"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { Address } from "viem";

export const USER_ROLES = {
  Client: "Client",
  FreelancerOwner: "FreelancerOwner",
  Agent: "Agent",
  Both: "Both",
  Unregistered: "Unregistered",
} as const;

export type UserRole = "Client" | "FreelancerOwner" | "Agent" | "Both" | "Unregistered";

export const UserRole = {
  Client: "Client",
  FreelancerOwner: "FreelancerOwner",
  Agent: "Agent",
  Both: "Both",
  Unregistered: "Unregistered",
} as const;

export function useUserRegistry() {
  const { writeContractAsync } = useWriteContract();

  const registerUser = async (params: {
    role: "client" | "agent";
    metadata: string;
  }) => {
    console.log("Registering user:", params);
  };

  const updateProfile = async (data: { metadata: string }) => {
    console.log("Updating profile:", data);
  };

  return { registerUser, updateProfile };
}

export function useRegisterUser() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<any>(null);

  const register = async (role: 1 | 2) => {
    setIsPending(true);
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.UserRegistry.address as `0x${string}`,
        abi: CONTRACT_CONFIG.UserRegistry.abi,
        functionName: "registerUser",
        args: [role],
      });
      setIsPending(false);
      setIsConfirming(true);
      await publicClient?.waitForTransactionReceipt({ hash });
      setIsConfirmed(true);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("[useRegisterUser] Registration failed:", {
        message: err?.message,
        code: err?.code,
        cause: err?.cause,
        details: err?.details,
        shortMessage: err?.shortMessage,
        wallet: (typeof window !== "undefined" && (window as any).ethereum) ? "connected" : "not connected",
      });
      setError(err);
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  return { register, isPending, isConfirming, isConfirmed, isSuccess, error };
}

const ROLE_MAP: Record<number, UserRole> = {
  0: "Unregistered",
  1: "Client",
  2: "FreelancerOwner",
};

export function useUserRole(address?: string | null) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_CONFIG.UserRegistry.address,
    abi: CONTRACT_CONFIG.UserRegistry.abi,
    functionName: "getUserRole",
    args: address ? [address as Address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const role = data !== undefined ? (ROLE_MAP[data as number] ?? "Unregistered") : null;

  return { role, isLoading, isError, refetch };
}
