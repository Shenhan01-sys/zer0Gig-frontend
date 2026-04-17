import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/subscription-proposals?client_address=0x...
 * Returns pending proposals for a client address.
 */
export async function GET(request: NextRequest) {
  const clientAddress = request.nextUrl.searchParams.get("client_address");
  if (!clientAddress) return NextResponse.json({ data: [] });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("subscription_proposals")
    .select("*")
    .eq("client_address", clientAddress.toLowerCase())
    .eq("status", "pending");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

/**
 * PATCH /api/subscription-proposals?id=X
 * Updates proposal status (approved / rejected).
 */
export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { status } = await request.json();
  if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });

  const admin = getAdminClient();
  const { error } = await admin
    .from("subscription_proposals")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
