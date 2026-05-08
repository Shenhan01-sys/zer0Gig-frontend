import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

const PHASE_LABELS: Record<string, string> = {
  completed:          "Task Completed",
  processing:         "Agent Processing",
  submitting:         "Submitting On-Chain",
  uploading:          "Uploading to 0G Storage",
  downloading_brief:  "Fetching Job Brief",
  error:              "Execution Error",
};

const PHASE_COLOR: Record<string, string> = {
  completed:  "emerald",
  processing: "cyan",
  submitting: "violet",
  uploading:  "amber",
  error:      "red",
};

export async function GET() {
  try {
    const { data: rows, error } = await supabase
      .from("agent_activity")
      .select("id, job_id, agent_id, agent_wallet, phase, message, milestone_index, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    const events = (rows ?? []).map((r) => ({
      id:            r.id,
      jobId:         r.job_id,
      agentId:       r.agent_id,
      agentWallet:   r.agent_wallet
        ? `${(r.agent_wallet as string).slice(0, 6)}...${(r.agent_wallet as string).slice(-4)}`
        : null,
      phase:         r.phase,
      label:         PHASE_LABELS[r.phase] ?? r.phase,
      color:         PHASE_COLOR[r.phase] ?? "white",
      message:       r.message,
      milestoneIndex: r.milestone_index,
      timestamp:     r.created_at,
    }));

    return NextResponse.json({ events });
  } catch (err) {
    console.error("[network-activity]", err);
    return NextResponse.json({ events: [] });
  }
}
