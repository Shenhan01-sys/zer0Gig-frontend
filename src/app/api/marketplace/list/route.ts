import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// POST /api/marketplace/list — seller creates a listing
//
// Body shape:
//   {
//     agentId:       number,
//     sellerAddress: string,
//     priceWei:      string,           // uint96 as decimal string
//     mode:          "transfer" | "clone",
//     title?:        string,
//     description?:  string,
//     termsUrl?:     string,
//     sellerSignature?: string,        // EIP-712 sig over the listing (optional in V1)
//     expiresAt?:    string,           // ISO 8601
//     agentSnapshot: {
//       name?: string;
//       scoreBps?: number;
//       jobsDone?: number;
//       skills?: string[];
//     }
//   }
//
// Note: in V1 we trust the connected wallet via Privy session; production should
// verify the seller signature on-chain or via a typed-data verifier here.
export async function POST(req: Request) {
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Server config missing" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const agentId       = Number(body.agentId);
  const sellerAddress = String(body.sellerAddress ?? "").trim().toLowerCase();
  const priceWei      = String(body.priceWei ?? "");
  const mode          = String(body.mode ?? "transfer");
  const title         = body.title ? String(body.title).slice(0, 120) : null;
  const description   = body.description ? String(body.description).slice(0, 2000) : null;
  const termsUrl      = body.termsUrl ? String(body.termsUrl).slice(0, 500) : null;
  const expiresAt     = body.expiresAt ? String(body.expiresAt) : null;
  const snapshot      = (body.agentSnapshot ?? {}) as Record<string, unknown>;
  const sellerSig     = body.sellerSignature ? String(body.sellerSignature) : null;

  // Validate
  if (!Number.isInteger(agentId) || agentId < 0) {
    return NextResponse.json({ ok: false, error: "Invalid agentId" }, { status: 400 });
  }
  if (!/^0x[a-f0-9]{40}$/.test(sellerAddress)) {
    return NextResponse.json({ ok: false, error: "Invalid sellerAddress" }, { status: 400 });
  }
  if (!/^\d+$/.test(priceWei)) {
    return NextResponse.json({ ok: false, error: "Invalid priceWei (must be decimal string)" }, { status: 400 });
  }
  if (mode !== "transfer" && mode !== "clone") {
    return NextResponse.json({ ok: false, error: "Mode must be 'transfer' or 'clone'" }, { status: 400 });
  }

  const priceOg = Number(BigInt(priceWei)) / 1e18;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("agent_listings")
    .insert({
      agent_id:         agentId,
      seller_address:   sellerAddress,
      price_wei:        priceWei,
      price_og:         priceOg,
      mode,
      title,
      description,
      terms_url:        termsUrl,
      seller_signature: sellerSig,
      expires_at:       expiresAt,
      agent_name:       snapshot.name ?? null,
      agent_score_bps:  snapshot.scoreBps ?? null,
      agent_jobs_done:  snapshot.jobsDone ?? null,
      agent_skills:     snapshot.skills ?? null,
      status:           "active",
    })
    .select("id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id, createdAt: data?.created_at });
}

// DELETE /api/marketplace/list?id=<listing_uuid> — seller cancels their listing
export async function DELETE(req: Request) {
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Server config missing" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const seller = (searchParams.get("seller") ?? "").trim().toLowerCase();

  if (!id) return NextResponse.json({ ok: false, error: "Missing listing id" }, { status: 400 });
  if (!/^0x[a-f0-9]{40}$/.test(seller)) {
    return NextResponse.json({ ok: false, error: "Invalid seller" }, { status: 400 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("agent_listings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("seller_address", seller)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ ok: false, error: "Listing not found or not owned by seller" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
