"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useReleaseMilestone } from "@/hooks/useProgressiveEscrow";
import { parseContractError } from "@/lib/utils";
import { keccak256, toBytes } from "viem";
import { type Address } from "viem";

interface MilestoneSubmitPanelProps {
  jobId: number;
  agentWallet?: Address;
  milestoneIndex: number;
  milestoneDescription: string;
  onSubmitted?: () => void;
}

const ALIGNMENT_SCORE = 8500;

export default function MilestoneSubmitPanel({
  jobId,
  agentWallet,
  milestoneIndex,
  milestoneDescription,
  onSubmitted,
}: MilestoneSubmitPanelProps) {
  const { address } = useAccount();
  const { releaseMilestone, isPending, isConfirming, isConfirmed, error } = useReleaseMilestone();

  const [outputContent, setOutputContent] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  const isAgent = address?.toLowerCase() === agentWallet?.toLowerCase();

  if (!isAgent) return null;

  if (isConfirmed) {
    return (
      <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-emerald-400 text-[13px] font-medium">Milestone Submitted!</p>
            <p className="text-white/40 text-[12px]">Payment released to agent wallet.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!outputContent.trim()) return;
    setSignError(null);
    setIsSigning(true);

    try {
      // 1. Hash the output content → bytes32 outputHash for the contract
      const outputHash = keccak256(toBytes(outputContent.trim()));

      // 2. Fetch oracle signature from platform alignment verifier
      const res = await fetch("/api/oracle/sign-alignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: String(jobId),
          milestoneIndex,
          alignmentScore: ALIGNMENT_SCORE,
          outputHash,
        }),
      });

      if (!res.ok) {
        const { error: apiErr } = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(apiErr || "Oracle signing failed");
      }

      const { signature } = await res.json() as { signature: `0x${string}` };

      // 3. Submit on-chain — msg.sender must be job.agentWallet
      await releaseMilestone({
        jobId: BigInt(jobId),
        milestoneIndex,
        outputHash,
        alignmentScore: BigInt(ALIGNMENT_SCORE),
        signature,
      });

      if (onSubmitted) setTimeout(onSubmitted, 2000);
    } catch (err) {
      setSignError(err instanceof Error ? err.message : "Signing failed");
    } finally {
      setIsSigning(false);
    }
  };

  const isLoading = isSigning || isPending || isConfirming;

  return (
    <div className="mt-4 p-4 bg-[#050810]/60 border border-white/10 rounded-xl">
      <h4 className="text-[13px] font-medium text-white/60 uppercase tracking-wider mb-1">
        Submit Milestone Work
      </h4>
      <p className="text-white/30 text-[11px] mb-3">
        {milestoneDescription} · Alignment score {(ALIGNMENT_SCORE / 100).toFixed(0)}% required for payment release.
      </p>

      <div className="mb-3">
        <label className="block text-white/40 text-[12px] mb-2">
          Output / Deliverable
        </label>
        <textarea
          rows={5}
          value={outputContent}
          onChange={(e) => setOutputContent(e.target.value)}
          placeholder="Paste your work output, CID, URL, or deliverable description here..."
          className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none font-mono"
        />
        <p className="text-white/30 text-[11px] mt-1.5">
          The output will be hashed (keccak256) and an oracle signature obtained before the on-chain call.
        </p>
      </div>

      {(signError || error) && (
        <p className="text-red-400 text-[12px] mb-3">
          {signError ?? parseContractError(error)}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading || !outputContent.trim()}
        className="w-full px-4 py-2.5 bg-white text-black text-[13px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSigning
          ? "Signing with oracle..."
          : isPending
          ? "Confirm in wallet..."
          : isConfirming
          ? "Submitting..."
          : "Submit Milestone Work"}
      </button>
    </div>
  );
}
