"use client";

import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { supabase } from "@/lib/supabase";
import DeliverableViewer from "./DeliverableViewer";
import { type JobData } from "@/hooks/useProgressiveEscrow";
import { type Address } from "viem";

interface MilestoneOnChain {
  percentage: bigint;
  amountWei: bigint;
  status: number;
  outputCID: string;
  alignmentScore: bigint;
  retryCount: bigint;
  submittedAt: bigint;
  completedAt: bigint;
}

interface JobBrief {
  title: string | null;
  description: string;
  skill_id: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface AgentActivity {
  phase: string;
  message: string;
  milestone_index: number | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

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
  const [jobBrief, setJobBrief] = useState<JobBrief | null>(null);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all milestones on-chain
  const milestoneCount = Number(job.milestoneCount || 0);
  const contracts = milestoneCount > 0
    ? Array.from({ length: milestoneCount }, (_, i) => ({
        address: CONTRACT_CONFIG.ProgressiveEscrow.address as Address,
        abi: CONTRACT_CONFIG.ProgressiveEscrow.abi,
        functionName: "getMilestone" as const,
        args: [BigInt(jobId), i] as const,
      }))
    : [];

  const { data: milestonesData } = useReadContracts({
    contracts,
    allowFailure: true,
  });

  // Fetch job brief + activity log from Supabase
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [jobRes, activityRes] = await Promise.all([
          supabase.from("jobs").select("title,description,skill_id,created_at,metadata").eq("job_id", jobId).maybeSingle(),
          supabase.from("agent_activity").select("phase,message,milestone_index,created_at,metadata").eq("job_id", jobId).order("created_at", { ascending: true }),
        ]);
        if (!cancelled) {
          setJobBrief(jobRes.data as JobBrief | null);
          setActivities((activityRes.data as AgentActivity[] | null) ?? []);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jobId]);

  if (loading) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-white/40 text-[13px] text-center">
        Loading deliverable…
      </div>
    );
  }

  const milestones = (milestonesData ?? []).map((res, i) => {
    if (!res.result) return null;
    const r = res.result as MilestoneOnChain;
    return {
      index: i,
      percentage: Number(r.percentage),
      amountWei: r.amountWei,
      status: r.status,
      outputCID: r.outputCID,
      alignmentScore: Number(r.alignmentScore),
      retryCount: Number(r.retryCount),
      submittedAt: Number(r.submittedAt) > 0 ? new Date(Number(r.submittedAt) * 1000).toLocaleString() : null,
      completedAt: Number(r.completedAt) > 0 ? new Date(Number(r.completedAt) * 1000).toLocaleString() : null,
    };
  }).filter(Boolean) as {
    index: number;
    percentage: number;
    amountWei: bigint;
    status: number;
    outputCID: string;
    alignmentScore: number;
    retryCount: number;
    submittedAt: string | null;
    completedAt: string | null;
  }[];

  const currentMilestone = milestones.find(m => m.index === milestoneIndex);

  return (
    <div className="mt-4">
      <DeliverableViewer
        data={{
          jobId,
          jobTitle: jobBrief?.title || `Job #${jobId}`,
          jobDescription: jobBrief?.description || "",
          jobSkill: jobBrief?.skill_id || undefined,
          jobCreatedAt: jobBrief?.created_at || undefined,
          clientAddress: job.client || "0x0000000000000000000000000000000000000000",
          agentName,
          agentId: Number(job.agentId),
          milestoneIndex,
          milestoneDescription: currentMilestone
            ? `Milestone ${milestoneIndex + 1} (${currentMilestone.percentage}%) — ${formatOG(currentMilestone.amountWei)}`
            : `Milestone ${milestoneIndex + 1}`,
          outputCID: currentMilestone?.outputCID || undefined,
          outputSummary: buildOutputSummary(currentMilestone, milestoneIndex, activities),
          alignmentScore: currentMilestone?.alignmentScore,
          milestones,
          activities,
        }}
        onClose={onClose}
      />
    </div>
  );
}

function formatOG(wei: bigint) {
  try {
    const og = Number(wei) / 1e18;
    return `${og.toFixed(4)} OG`;
  } catch {
    return "—";
  }
}

function buildOutputSummary(
  milestone: { status: number; alignmentScore: number; retryCount: number; outputCID: string } | undefined,
  milestoneIndex: number,
  activities: AgentActivity[]
): string {
  if (!milestone) return `Milestone ${milestoneIndex + 1} data unavailable.`;

  const statusLabels: Record<number, string> = {
    0: "Pending", 1: "Submitted", 2: "Approved", 3: "Rejected", 4: "Retrying",
  };

  const relevantActivities = activities.filter(
    a => a.milestone_index === milestoneIndex || a.milestone_index === null
  );

  const processSteps = relevantActivities.map(a => {
    const time = new Date(a.created_at).toLocaleTimeString();
    return `[${time}] ${a.phase}: ${a.message}`;
  }).join("\n");

  return `Milestone ${milestoneIndex + 1} Status: ${statusLabels[milestone.status] || "Unknown"}
Alignment Score: ${(milestone.alignmentScore / 100).toFixed(2)}/100
Retry Count: ${milestone.retryCount}/5
Output CID: ${milestone.outputCID || "N/A"}

PROCESS LOG:
${processSteps || "No detailed process log available for this milestone."}`;
}
