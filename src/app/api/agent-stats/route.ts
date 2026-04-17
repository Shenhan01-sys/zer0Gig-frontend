import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/agent-stats?agent_id=N
 * Returns agent_proposal_stats for a given agent.
 */
export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get("agent_id");
  if (!agentId) return NextResponse.json({ data: null });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("agent_proposal_stats")
    .select("*")
    .eq("agent_id", Number(agentId))
    .maybeSingle();

  if (error) return NextResponse.json({ data: null });
  return NextResponse.json({ data });
}
