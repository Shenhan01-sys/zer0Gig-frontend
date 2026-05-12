import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 15;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// GET /api/marketplace/listings — public feed of active listings
// Optional query params:
//   ?mode=transfer|clone
//   ?seller=0x...
//   ?agent=123
//   ?sort=price_asc|price_desc|newest|score
//   ?limit=20&offset=0
export async function GET(req: Request) {
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "Supabase config missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const mode    = searchParams.get("mode");
  const seller  = (searchParams.get("seller") ?? "").toLowerCase();
  const agentId = searchParams.get("agent");
  const sort    = searchParams.get("sort") ?? "newest";
  const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset  = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let q = supabase.from("agent_listings").select("*").eq("status", "active");
  if (mode && (mode === "transfer" || mode === "clone")) q = q.eq("mode", mode);
  if (seller && /^0x[a-f0-9]{40}$/.test(seller))         q = q.eq("seller_address", seller);
  if (agentId && /^\d+$/.test(agentId))                  q = q.eq("agent_id", parseInt(agentId, 10));

  switch (sort) {
    case "price_asc":  q = q.order("price_og", { ascending: true });  break;
    case "price_desc": q = q.order("price_og", { ascending: false }); break;
    case "score":      q = q.order("agent_score_bps", { ascending: false, nullsFirst: false }); break;
    case "newest":
    default:           q = q.order("created_at", { ascending: false });
  }

  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    listings: data ?? [],
    count: count ?? (data?.length ?? 0),
    limit,
    offset,
  });
}
