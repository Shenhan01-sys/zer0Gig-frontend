import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { OG_MODELS } from "@/lib/og-models";
import { COUNTRIES_BY_CODE } from "@/lib/countries";
import { findIdCity } from "@/lib/idCities";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const VALID_MODEL_IDS = new Set(OG_MODELS.map(m => m.id));
const VALID_ROLES = new Set(["client", "agent_owner"]);

export async function POST(req: Request) {
  if (!url || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase server config missing" },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const displayName    = String(body.displayName ?? "").trim();
  const walletAddress  = String(body.walletAddress ?? "").trim().toLowerCase();
  const role           = String(body.role ?? "").trim();
  const preferredModel = String(body.preferredModel ?? "").trim();
  const countryCode    = String(body.countryCode ?? "").trim().toUpperCase();
  // Optional sub-country location fields (only relevant when country is ID).
  // We accept them for any country to keep the API flexible, but only the
  // ID lookup table resolves city -> precise coordinates today.
  const cityInput      = String(body.city ?? "").trim();
  const kecamatanInput = String(body.kecamatan ?? "").trim().slice(0, 80);

  // ── Validation ─────────────────────────────────────────────────────────────
  if (!displayName || displayName.length < 2 || displayName.length > 64) {
    return NextResponse.json(
      { ok: false, error: "Display name must be 2-64 characters" },
      { status: 400 },
    );
  }
  if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) {
    return NextResponse.json(
      { ok: false, error: "Invalid wallet address" },
      { status: 400 },
    );
  }
  if (!VALID_ROLES.has(role)) {
    return NextResponse.json(
      { ok: false, error: "Role must be 'client' or 'agent_owner'" },
      { status: 400 },
    );
  }
  if (!VALID_MODEL_IDS.has(preferredModel)) {
    return NextResponse.json(
      { ok: false, error: "Unknown model" },
      { status: 400 },
    );
  }
  const country = COUNTRIES_BY_CODE[countryCode];
  if (!country) {
    return NextResponse.json(
      { ok: false, error: "Unknown country code" },
      { status: 400 },
    );
  }

  // Resolve city coords when country is Indonesia and the city is in our
  // lookup table. Falls back to the country centroid otherwise.
  let latitude  = country.lat;
  let longitude = country.lng;
  let resolvedCity: string | null = null;
  if (countryCode === "ID" && cityInput) {
    const city = findIdCity(cityInput);
    if (city) {
      resolvedCity = city.name;
      latitude     = city.lat;
      longitude    = city.lng;
    } else {
      // Accept the user's typed value even if not in lookup — they keep the
      // country centroid coords but the city name still ends up on the row
      // for later analysis.
      resolvedCity = cityInput.slice(0, 80);
    }
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Upsert by wallet — re-onboarding overrides previous answers
  const { data, error } = await supabase
    .from("community_signups")
    .upsert(
      {
        display_name:    displayName,
        wallet_address:  walletAddress,
        role,
        preferred_model: preferredModel,
        country_code:    country.code,
        country_name:    country.name,
        latitude,
        longitude,
        city:            resolvedCity,
        kecamatan:       countryCode === "ID" && kecamatanInput ? kecamatanInput : null,
        updated_at:      new Date().toISOString(),
      },
      { onConflict: "wallet_address" },
    )
    .select("id, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data?.id, createdAt: data?.created_at });
}

export async function GET(req: Request) {
  // Returns whether the requesting wallet has already onboarded — used by the
  // onboarding page to short-circuit returning users.
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Server config missing" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const wallet = (searchParams.get("wallet") ?? "").trim().toLowerCase();

  if (!/^0x[a-f0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ ok: true, exists: false });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("community_signups")
    .select("id, display_name, role, preferred_model, country_code, city, kecamatan")
    .eq("wallet_address", wallet)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, exists: !!data, profile: data ?? null });
}
