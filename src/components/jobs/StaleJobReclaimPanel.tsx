"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  useCancelStaleJob,
  useJobLastActivity,
  STALE_JOB_TIMEOUT_SECONDS,
} from "@/hooks/useProgressiveEscrow";

interface Props {
  jobId: bigint;
  jobStatus: number;          // JobStatus enum (2 = IN_PROGRESS)
  client: `0x${string}`;
  jobCreatedAt: number;
}

function formatDuration(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs < 60)        return `${abs}s`;
  if (abs < 3600)      return `${Math.floor(abs / 60)}m`;
  if (abs < 86400)     return `${Math.floor(abs / 3600)}h`;
  return `${Math.floor(abs / 86400)}d ${Math.floor((abs % 86400) / 3600)}h`;
}

/**
 * Shown to the client only when their job is IN_PROGRESS and the agent has
 * gone silent past STALE_JOB_TIMEOUT. Lets the client reclaim the unreleased
 * budget.
 */
export default function StaleJobReclaimPanel({ jobId, jobStatus, client, jobCreatedAt }: Props) {
  const { address } = useAccount();
  const { lastActivityAt, refetch } = useJobLastActivity(jobId);
  const { cancelStaleJob, isPending, error } = useCancelStaleJob();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // Tick every second so the countdown stays accurate
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // Only render when the connected wallet is the client AND the job is IN_PROGRESS
  if (jobStatus !== 2) return null;
  if (address?.toLowerCase() !== client.toLowerCase()) return null;

  const baseTimestamp = lastActivityAt > 0 ? lastActivityAt : jobCreatedAt;
  const elapsedSeconds = now - baseTimestamp;
  const remainingSeconds = STALE_JOB_TIMEOUT_SECONDS - elapsedSeconds;
  const isStale = remainingSeconds <= 0;

  // Only show the panel once we're within 1 day of the timeout (or already stale)
  if (remainingSeconds > 24 * 60 * 60) return null;

  const handleCancel = async () => {
    if (!confirm(`Reclaim Job #${jobId.toString()}? The agent will be marked as failed and your unreleased budget will be refunded.`)) return;
    try {
      await cancelStaleJob(jobId);
      setTimeout(() => refetch(), 5_000);
    } catch {
      // tx toast handles the failure surface
    }
  };

  return (
    <div className={`rounded-2xl border p-5 ${isStale ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isStale ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-[14px] font-medium ${isStale ? "text-red-400" : "text-amber-400"}`}>
            {isStale ? "Agent has gone silent — reclaim available" : "Agent inactivity warning"}
          </h4>
          <p className="text-white/50 text-[12px] mt-1 leading-relaxed">
            {isStale ? (
              <>The agent hasn't submitted any milestone activity in over 7 days. You can now reclaim the unreleased budget. The agent's reputation will be decremented.</>
            ) : (
              <>If the agent stays silent for {formatDuration(remainingSeconds)}, you'll be able to reclaim the unreleased budget on-chain.</>
            )}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-white/40">
              <span>Last activity:</span>
              <span className="font-mono text-white/60">{baseTimestamp ? new Date(baseTimestamp * 1000).toLocaleString() : "—"}</span>
            </div>
            {!isStale && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                <span>Reclaim in:</span>
                <span className="font-mono">{formatDuration(remainingSeconds)}</span>
              </div>
            )}
          </div>

          {isStale && (
            <div className="mt-4">
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[13px] font-medium hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? "Reclaiming…" : "Reclaim unreleased budget"}
              </button>
              {error && (
                <p className="mt-2 text-[11px] text-red-400/80">
                  {error.message?.slice(0, 120)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
