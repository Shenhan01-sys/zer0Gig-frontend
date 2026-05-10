import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/agent-storage?agentId=X&viewerAddress=0x...
 *
 * Returns progressive jobs + subscriptions for this agent, scoped to the viewer:
 *   - If viewer is the agent owner → returns ALL data grouped across all clients
 *   - If viewer is a client       → returns only their own jobs + subscriptions
 *
 * Response shape:
 * {
 *   isOwner: boolean,
 *   progressive: ProgressiveJob[],
 *   subscriptions: SubscriptionRecord[],
 * }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = parseInt(searchParams.get("agentId") ?? "");
  const viewerAddress = searchParams.get("viewerAddress")?.toLowerCase();

  if (!agentId || !viewerAddress) {
    return NextResponse.json({ error: "Missing agentId or viewerAddress" }, { status: 400 });
  }

  const db = admin();

  // ── 1. Determine viewer role ─────────────────────────────────────────────
  const { data: profileRow } = await db
    .from("agent_profiles")
    .select("owner_address")
    .eq("agent_id", agentId)
    .maybeSingle();

  const isOwner = profileRow?.owner_address?.toLowerCase() === viewerAddress;

  // ── 2. Fetch all activity rows for this agent ───────────────────────────
  const { data: allActivity } = await db
    .from("agent_activity")
    .select("job_id, phase, message, metadata, created_at, agent_wallet, milestone_index")
    .eq("agent_id", String(agentId))
    .order("created_at", { ascending: true });

  const allJobIds: number[] = [
    ...new Set((allActivity ?? []).map((a) => a.job_id).filter(Boolean) as number[]),
  ];

  // ── 3. Fetch job metadata for those job IDs ─────────────────────────────
  let jobRows: any[] = [];
  if (allJobIds.length > 0) {
    const { data } = await db
      .from("jobs")
      .select("job_id, client_address, title, description, created_at")
      .in("job_id", allJobIds);
    jobRows = data ?? [];
  }

  // ── 4. Filter job IDs by viewer role ────────────────────────────────────
  const visibleJobIds = isOwner
    ? allJobIds
    : jobRows
        .filter((j) => j.client_address?.toLowerCase() === viewerAddress)
        .map((j) => j.job_id as number);

  // ── 5. Fetch messages for visible jobs ──────────────────────────────────
  let messages: any[] = [];
  if (visibleJobIds.length > 0) {
    const { data } = await db
      .from("job_messages")
      .select("id, job_id, sender, message, msg_type, created_at, metadata")
      .in("job_id", visibleJobIds)
      .order("created_at", { ascending: true });
    messages = data ?? [];
  }

  // ── 6. Fetch subscriptions ───────────────────────────────────────────────
  let subsQuery = db
    .from("subscription_proposals")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (!isOwner) {
    subsQuery = subsQuery.eq("client_address", viewerAddress);
  }

  const { data: subs } = await subsQuery;

  // ── 7. Fetch KV storage refs from agent_kv_index ────────────────────────
  const kvKeys = [
    ...visibleJobIds.map((id) => `output:${id}`),
    ...(subs ?? []).map((s: any) => `checkpoint:${s.id}`),
  ];

  const kvRefs: Record<string, string> = {};
  if (kvKeys.length > 0) {
    const { data: kvRows } = await db
      .from("agent_kv_index")
      .select("key, value")
      .eq("stream_id", "zer0gig:kv")
      .in("key", kvKeys);
    for (const row of kvRows ?? []) {
      kvRefs[row.key] = row.value;
    }
  }

  // ── 8. Build grouped response ────────────────────────────────────────────
  const activityByJob: Record<number, any[]> = {};
  for (const a of allActivity ?? []) {
    if (!visibleJobIds.includes(a.job_id)) continue;
    (activityByJob[a.job_id] ??= []).push(a);
  }

  const messagesByJob: Record<number, any[]> = {};
  for (const m of messages) {
    (messagesByJob[m.job_id] ??= []).push(m);
  }

  const progressive = visibleJobIds.map((jobId) => {
    const job = jobRows.find((j) => j.job_id === jobId);
    return {
      jobId,
      title: job?.title ?? null,
      description: job?.description ?? "",
      clientAddress: job?.client_address ?? "",
      createdAt: job?.created_at ?? "",
      activity: activityByJob[jobId] ?? [],
      messages: messagesByJob[jobId] ?? [],
      outputHash: kvRefs[`output:${jobId}`] ?? null,
    };
  });

  const subscriptions = (subs ?? []).map((s: any) => ({
    id: s.id,
    clientAddress: s.client_address,
    taskDescription: s.task_description,
    intervalSeconds: Number(s.interval_seconds),
    checkInRate: s.check_in_rate,
    alertRate: s.alert_rate,
    status: s.status,
    createdAt: s.created_at,
    budgetOg: s.budget_og,
    checkpointHash: kvRefs[`checkpoint:${s.id}`] ?? null,
  }));

  return NextResponse.json({ isOwner, progressive, subscriptions });
}
