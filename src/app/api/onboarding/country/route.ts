import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 30;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Returns the list of community members for a given country code.
// Uses the `community_members_public` view which only exposes safe fields
// (no full wallet address).
export async function GET(req: Request) {
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "Supabase config missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Invalid country code" }, { status: 400 });
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("community_members_public")
    .select("display_name, role, preferred_model, wallet_preview, created_at, country_name")
    .eq("country_code", code)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    code,
    name: data?.[0]?.country_name ?? null,
    count: data?.length ?? 0,
    members: data ?? [],
  });
}
