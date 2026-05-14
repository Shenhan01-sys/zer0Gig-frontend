"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import DeliverableViewer from "./DeliverableViewer";
import { type JobData } from "@/hooks/useProgressiveEscrow";
import { type Address } from "viem";

export default function DeliverablePanel({
  jobId,
  milestoneIndex,
  job,
  agentName,
  onClose,
}: {
  jobId: number;
  milestoneIndex: number;
  job: JobData;
  agentName: string;
  onClose: () => void;
}) {
  const { data: milestone } = useReadContract({
    address: CONTRACT_CONFIG.ProgressiveEscrow.address as Address,
    abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
    functionName: "getMilestone",
    args: [BigInt(jobId), milestoneIndex],
  });

  if (!milestone) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-white/40 text-[13px] text-center">
        Loading deliverable…
      </div>
    );
  }

  const m = milestone as {
    percentage: bigint;
    amountWei: bigint;
    status: number;
    outputCID: string;
    alignmentScore: bigint;
    retryCount: bigint;
  };

  return (
    <div className="mt-4">
      <DeliverableViewer
        data={{
          jobId,
          jobTitle: `Job #${jobId}`,
          clientAddress: job.client || "0x0000000000000000000000000000000000000000",
          agentName,
          agentId: Number(job.agentId),
          milestoneIndex,
          milestoneDescription: `Milestone ${milestoneIndex + 1} (${Number(m.percentage)}%)`,
          outputCID: m.outputCID || undefined,
          outputSummary: m.outputCID
            ? `Deliverable submitted and stored on-chain. Output CID: ${m.outputCID}`
            : `Milestone ${milestoneIndex + 1} completed. Alignment score: ${(Number(m.alignmentScore) / 100).toFixed(2)}/100.`,
          alignmentScore: Number(m.alignmentScore),
        }}
        onClose={onClose}
      />
    </div>
  );
}
