import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 30; // ISR-style: refresh aggregates every 30s

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Views `community_stats`, `community_by_country`, `community_by_model` are
// granted to anon — safe to read with the anon key.

export async function GET() {
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "Supabase config missing" }, { status: 500 });
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [stats, byCountry, byModel, byIdCity] = await Promise.all([
    supabase.from("community_stats").select("*").maybeSingle(),
    supabase.from("community_by_country").select("*"),
    supabase.from("community_by_model").select("*"),
    // Optional view — only present after migration 014. Tolerate missing view
    // so the route doesn't 500 if migration hasn't been applied yet.
    supabase.from("community_id_cities").select("*"),
  ]);

  if (stats.error || byCountry.error || byModel.error) {
    return NextResponse.json(
      { ok: false, error: stats.error?.message ?? byCountry.error?.message ?? byModel.error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    total:        stats.data?.total ?? 0,
    countries:    stats.data?.countries ?? 0,
    clients:      stats.data?.clients ?? 0,
    agentOwners:  stats.data?.agent_owners ?? 0,
    byCountry:    byCountry.data ?? [],
    byModel:      byModel.data ?? [],
    byIdCity:     byIdCity.error ? [] : (byIdCity.data ?? []),
  });
}
