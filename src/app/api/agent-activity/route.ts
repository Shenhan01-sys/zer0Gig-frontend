import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client — runtime writes are server-to-server, no RLS gate needed.
// Falls back to anon key only if service key is missing in env.
const SB_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SB_URL, SB_KEY);

/**
 * POST /api/agent-activity
 * Called by the agent runtime to log execution progress.
 *
 * Body:
 * {
 *   jobId: number,
 *   agentId: string,
 *   agentWallet: string,
 *   phase: "downloading_brief" | "processing" | "uploading" | "submitting" | "completed" | "error",
 *   message: string,
 *   milestoneIndex?: number,
 *   metadata?: Record<string, unknown>,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { jobId, agentId, agentWallet, phase, message, milestoneIndex, metadata } = body;

    if (!jobId || !phase || !message) {
      return NextResponse.json(
        { error: "Missing required fields: jobId, phase, message" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("agent_activity").insert({
      job_id: jobId,
      agent_id: agentId || null,
      agent_wallet: agentWallet || null,
      phase,
      message,
      milestone_index: milestoneIndex ?? null,
      metadata: metadata || {},
    });

    if (error) {
      console.error("[API] Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API] Agent activity error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent-activity?jobId=123
 * Returns all activity entries for a given job, ordered newest first.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId parameter" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("agent_activity")
      .select("*")
      .eq("job_id", parseInt(jobId))
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[API] Supabase fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[API] Agent activity fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
