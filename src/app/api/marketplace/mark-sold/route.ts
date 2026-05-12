import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// POST /api/marketplace/mark-sold
//
// Called by the buyer or seller's UI right after AgentMarketplace.completeTransfer /
// completeClone succeeds. Marks the off-chain Supabase listing row as 'sold' and
// stamps the buyer + final agentId + on-chain order id.
//
// Body:
//   { listingId: uuid, orderId: number, buyerAddress: 0x..., finalAgentId?: number }
export async function POST(req: Request) {
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Server config missing" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const listingId      = String(body.listingId ?? "");
  const orderId        = Number(body.orderId);
  const buyerAddress   = String(body.buyerAddress ?? "").trim().toLowerCase();
  const finalAgentId   = body.finalAgentId != null ? Number(body.finalAgentId) : null;
  const agentId        = body.agentId != null ? Number(body.agentId) : null;
  const sellerAddress  = body.sellerAddress ? String(body.sellerAddress).trim().toLowerCase() : null;

  if (!Number.isInteger(orderId) || orderId < 0)        return bad("orderId required");
  if (!/^0x[a-f0-9]{40}$/.test(buyerAddress))           return bad("Invalid buyerAddress");
  if (!listingId && (!agentId || !sellerAddress))       return bad("listingId OR (agentId + sellerAddress) required");

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let q = supabase
    .from("agent_listings")
    .update({
      status:         "sold",
      order_id:       orderId,
      buyer_address:  buyerAddress,
      sold_at:        new Date().toISOString(),
      final_agent_id: finalAgentId,
      updated_at:     new Date().toISOString(),
    })
    .in("status", ["active", "pending"]);  // idempotent

  if (listingId) {
    q = q.eq("id", listingId);
  } else {
    q = q.eq("agent_id", agentId!).eq("seller_address", sellerAddress!);
  }

  const { data, error } = await q.select("id").maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ ok: false, error: "Listing not found or already settled" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
