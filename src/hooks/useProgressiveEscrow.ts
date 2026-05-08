"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { useState, useMemo } from "react";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { Address } from "viem";
import { useTx } from "@/components/ui/TxToast";
import { parseContractError } from "@/lib/utils";

export interface JobData {
  jobId: bigint;
  client: Address;
  agentId: bigint;
  status: number;
  totalBudgetWei: bigint;
  releasedWei: bigint;
  milestoneCount: number;
  agentWallet?: Address;
  jobDataCID?: string;
  skillId?: string;
  createdAt?: bigint;
}

export interface ProposalData {
  id: number;
  agentId: bigint;
  jobId: bigint;
  status: number;
  message: string;
  accepted: boolean;
  agentOwner: Address;
  proposedRateWei: bigint;
  descriptionCID: string;
  submittedAt: bigint;
}

export function useJobDetails(jobId: number) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "getJob",
    args: [BigInt(jobId)],
    query: {
      enabled: jobId > 0,
    },
  });

  const jobData = useMemo<JobData | null>(() => {
    if (!data) return null;
    return {
      jobId: (data as any).jobId,
      client: (data as any).client,
      agentId: (data as any).agentId,
      status: (data as any).status,
      totalBudgetWei: (data as any).totalBudgetWei,
      releasedWei: (data as any).releasedWei,
      milestoneCount: (data as any).milestones?.length ?? (data as any).milestoneCount ?? 0,
      agentWallet: (data as any).agentWallet,
      jobDataCID: (data as any).jobDataCID,
      skillId: (data as any).skillId,
      createdAt: (data as any).createdAt,
    };
  }, [data]);

  return {
    data: jobData,
    isLoading,
    isError: isError || false,
    refetch,
  };
}

export function useJobProposals(jobId: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "getProposals",
    args: [BigInt(jobId)],
    query: {
      enabled: jobId > 0,
    },
  });

  const proposals = useMemo<ProposalData[]>(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((p: any, index: number) => ({
      id: index,
      agentId: p.agentId,
      jobId: BigInt(jobId),
      status: 0,
      message: "",
      accepted: p.accepted,
      agentOwner: p.agentOwner,
      proposedRateWei: p.proposedRateWei,
      descriptionCID: p.descriptionCID,
      submittedAt: p.submittedAt,
    }));
  }, [data, jobId]);

  return {
    proposals,
    isLoading,
    refetch,
  };
}

export function useSubmitProposal() {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const tx = useTx();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { data: txHash, isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: undefined as any,
  });

  const submitProposal = async (params: {
    jobId: bigint;
    agentId: bigint;
    proposedRateWei: bigint;
    descriptionCID: string;
  }) => {
    setIsPending(true);
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);

    const toastId = tx.start(`Submit proposal · Job #${params.jobId}`);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "submitProposal",
        args: [params.jobId, params.agentId, params.proposedRateWei, params.descriptionCID],
      });
      tx.broadcast(toastId, hash);
      setIsConfirming(true);
      setIsPending(false);
      return hash;
    } catch (err) {
      tx.fail(toastId, parseContractError(err));
      setError(err as Error);
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  return {
    submitProposal,
    isPending: isPending || isWritePending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useAcceptProposal() {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const tx = useTx();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const acceptProposal = async (params: { jobId: bigint; proposalIndex: bigint; value?: bigint }) => {
    setIsPending(true);
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);

    const toastId = tx.start(`Accept proposal · Job #${params.jobId}`);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "acceptProposal",
        args: [params.jobId, params.proposalIndex],
        value: params.value,
      });
      tx.broadcast(toastId, hash);
      setIsConfirming(true);
      setIsPending(false);
      return hash;
    } catch (err) {
      tx.fail(toastId, parseContractError(err));
      setError(err as Error);
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  return {
    acceptProposal,
    isPending: isPending || isWritePending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useDefineMilestones() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [isSuccess, setIsSuccess] = useState(false);

  const defineMilestones = async (params: {
    jobId: bigint;
    percentages: number[];
    criteriaHashes: `0x${string}`[];
  }) => {
    setIsSuccess(false);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "defineMilestones",
        args: [params.jobId, params.percentages, params.criteriaHashes],
      });
      setIsSuccess(true);
      return hash;
    } catch (err) {
      setIsSuccess(false);
      throw err;
    }
  };

  return {
    defineMilestones,
    isPending,
    isSuccess,
  };
}

export function useReleaseMilestone() {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const tx = useTx();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const releaseMilestone = async (params: {
    jobId: bigint;
    milestoneIndex: number;
    outputHash: `0x${string}`;   // keccak256 of output content — bytes32 on-chain
    alignmentScore: bigint;
    signature: `0x${string}`;
  }) => {
    setIsPending(true);
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);

    const toastId = tx.start(`Release milestone ${params.milestoneIndex + 1} · Job #${params.jobId}`);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "releaseMilestone",
        args: [
          params.jobId,
          BigInt(params.milestoneIndex),
          params.outputHash,
          params.alignmentScore,
          params.signature,
        ],
      });
      tx.broadcast(toastId, hash);
      setIsConfirming(true);
      setIsPending(false);
      return hash;
    } catch (err) {
      tx.fail(toastId, parseContractError(err));
      setError(err as Error);
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  return {
    releaseMilestone,
    isPending: isPending || isWritePending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Cancel a stale IN_PROGRESS job. Reverts unless STALE_JOB_TIMEOUT (7 days)
 * has elapsed since the agent's last on-chain activity. Refunds the
 * unreleased portion of the budget to the client.
 */
export function useCancelStaleJob() {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  const tx = useTx();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancelStaleJob = async (jobId: bigint) => {
    setIsPending(true);
    setError(null);

    const toastId = tx.start(`Reclaim stale Job #${jobId}`);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "cancelStaleJob",
        args: [jobId],
      });
      tx.broadcast(toastId, hash);
      setIsPending(false);
      return hash;
    } catch (err) {
      tx.fail(toastId, parseContractError(err));
      setError(err as Error);
      setIsPending(false);
      throw err;
    }
  };

  return { cancelStaleJob, isPending: isPending || isWritePending, error };
}

/**
 * Read the lastActivityAt timestamp for a job. Used by the UI to show how
 * long until cancelStaleJob becomes callable.
 */
export function useJobLastActivity(jobId: bigint | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "jobLastActivityAt",
    args: jobId !== undefined ? [jobId] : undefined,
    query: { enabled: jobId !== undefined },
  });

  return {
    lastActivityAt: data ? Number(data) : 0,
    isLoading,
    refetch,
  };
}

export const STALE_JOB_TIMEOUT_SECONDS = 7 * 24 * 60 * 60;

export function useOpenJobs() {
  const { data: openJobIds, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "getOpenJobs",
    query: {},
  });

  const jobs = useMemo(() => {
    if (!openJobIds || !Array.isArray(openJobIds)) return [];
    return openJobIds.map((id: bigint) => ({ jobId: id }));
  }, [openJobIds]);

  return {
    openJobIds: (openJobIds as bigint[] | undefined)?.map(Number) ?? [],
    jobs,
    isLoading,
    refetch,
  };
}

export function useClientJobs(address?: Address | null) {
  const { address: accountAddress } = useAccount();
  const effectiveAddress = address ?? accountAddress;

  const { data: clientJobIds, isLoading, refetch } = useReadContract({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "getClientJobs",
    args: effectiveAddress ? [effectiveAddress] : undefined,
    query: {
      enabled: !!effectiveAddress,
    },
  });

  return {
    data: clientJobIds as bigint[] | undefined,
    isLoading,
    refetch,
  };
}

export function useProgressiveEscrow() {
  const { writeContractAsync } = useWriteContract();

  const createJob = async (params: {
    client: Address;
    agentId: bigint;
    budget: bigint;
    milestones: Array<{ description: string; percentage: number; amount: bigint }>;
  }) => {
    console.log("Creating job:", params);
  };

  const submitMilestone = async (params: {
    jobId: bigint;
    milestoneIndex: number;
    output: string;
    alignmentSignature: string;
  }) => {
    console.log("Submitting milestone:", params);
  };

  const releaseMilestone = async (params: {
    jobId: bigint;
    milestoneIndex: number;
  }) => {
    console.log("Releasing milestone:", params);
  };

  return { createJob, submitMilestone, releaseMilestone };
}

export function usePostJob() {
  const { writeContractAsync, isPending } = useWriteContract();
  const tx = useTx();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const postJob = async (cid: string, skillBytes32: `0x${string}`) => {
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);

    // Contract takes bytes32 jobDataHash, but the brief content is stored off-chain in Supabase.
    // We POST the brief to /api/job-brief which inserts into public.jobs keyed by keccak256(brief),
    // then we send that hash on-chain.
    const toastId = tx.start("Post new job");
    try {
      const briefRes = await fetch("/api/job-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid, skillId: skillBytes32 }),
      });
      if (!briefRes.ok) {
        const errText = await briefRes.text();
        throw new Error(`Failed to store brief: ${errText}`);
      }
      const { jobDataHash } = await briefRes.json();

      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "postJob",
        args: [jobDataHash as `0x${string}`, skillBytes32],
      });
      tx.broadcast(toastId, hash);
      setTxHash(hash);
      setIsConfirming(true);
      return hash;
    } catch (err) {
      tx.fail(toastId, parseContractError(err));
      setError(err as Error);
      throw err;
    }
  };

  return { postJob, isPending, isConfirming, isConfirmed, txHash, error };
}