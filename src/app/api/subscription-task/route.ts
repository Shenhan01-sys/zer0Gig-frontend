import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { keccak256, toBytes } from "viem";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function admin() {
  return createClient(SB_URL, SB_SERVICE_KEY);
}

/**
 * GET /api/subscription-task?hash=0x...
 * Returns the off-chain task description for an on-chain task_hash.
 */
export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get("hash");
  if (!hash) return NextResponse.json({ error: "hash required" }, { status: 400 });

  const { data, error } = await admin()
    .from("subscription_tasks")
    .select("task_hash, task_description, client_address, webhook_url, metadata, created_at")
    .eq("task_hash", hash.toLowerCase())
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/**
 * POST /api/subscription-task
 * Stores the task description keyed by keccak256(task) and returns the hash.
 *
 * Body: { taskDescription, clientAddress?, webhookUrl?, metadata? }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const taskDescription: string = (body.taskDescription || "").trim();
  if (!taskDescription) {
    return NextResponse.json({ error: "taskDescription required" }, { status: 400 });
  }

  const taskHash = keccak256(toBytes(taskDescription));

  const { error } = await admin()
    .from("subscription_tasks")
    .upsert(
      {
        task_hash: taskHash.toLowerCase(),
        task_description: taskDescription,
        client_address: (body.clientAddress || null)?.toLowerCase?.() ?? null,
        webhook_url: body.webhookUrl || null,
        metadata: body.metadata ?? {},
      },
      { onConflict: "task_hash" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ taskHash });
}
