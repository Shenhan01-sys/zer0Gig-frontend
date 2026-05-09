import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { keccak256, toBytes } from "viem";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(SB_URL, SB_SERVICE_KEY);
}

/**
 * GET /api/job-brief?hash=0x...
 * Returns the off-chain brief content for a given on-chain jobDataHash.
 */
export async function GET(request: NextRequest) {
  const hash = request.nextUrl.searchParams.get("hash");
  if (!hash) return NextResponse.json({ error: "hash required" }, { status: 400 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("jobs")
    .select("title, description, skill_id, metadata, client_address, job_id")
    .eq("job_data_hash", hash.toLowerCase())
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/**
 * POST /api/job-brief
 * Stores the brief content keyed by keccak256(content) and returns the hash.
 * The frontend then sends this hash on-chain via postJob().
 *
 * Body: { cid: string (txt:base64(json)), skillId: 0x... } | { title, description, skillId }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  let title: string | null = null;
  let description: string;
  let skillId: string = body.skillId || "0x" + "0".repeat(64);

  if (body.cid && typeof body.cid === "string" && body.cid.startsWith("txt:")) {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(body.cid.slice(4)))));
      title = decoded.title || null;
      description = decoded.description || "";
    } catch {
      return NextResponse.json({ error: "invalid cid format" }, { status: 400 });
    }
  } else if (body.description) {
    title = body.title || null;
    description = body.description;
  } else {
    return NextResponse.json({ error: "missing cid or description" }, { status: 400 });
  }

  if (!description) return NextResponse.json({ error: "description required" }, { status: 400 });

  const briefStr = JSON.stringify({ title, description });
  const jobDataHash = keccak256(toBytes(briefStr));

  const admin = getAdminClient();
  const { error } = await admin.from("jobs").upsert({
    job_data_hash: jobDataHash.toLowerCase(),
    client_address: body.clientAddress || "0x0000000000000000000000000000000000000000",
    title,
    description,
    skill_id: skillId.toLowerCase(),
  }, { onConflict: "job_data_hash" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobDataHash });
}
