import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url        = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const VALID_SIZE = new Set(["1-10", "11-50", "51-200", "201-1000", "1000+"]);
const VALID_TYPE = new Set(["agent-ops", "custom-dev", "integration", "reseller", "other"]);

// POST /api/partnership/submit — PT / company partnership application.
//
// Validates the form, writes to partner_waitlist via service role (bypasses
// RLS). Returns 200 + row id on success. The Supabase table keeps its
// `partner_waitlist` name for backwards-compat with existing rows; only the
// frontend route renames waitlist -> partnership.
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

  const companyName     = String(body.companyName     ?? "").trim();
  const companyWebsite  = String(body.companyWebsite  ?? "").trim().slice(0, 200);
  const industry        = String(body.industry        ?? "").trim().slice(0, 80);
  const companySize     = String(body.companySize     ?? "").trim();
  const contactName     = String(body.contactName     ?? "").trim();
  const contactEmail    = String(body.contactEmail    ?? "").trim().toLowerCase();
  const contactPhone    = String(body.contactPhone    ?? "").trim().slice(0, 40);
  const contactCountry  = String(body.contactCountry  ?? "ID").trim().toUpperCase().slice(0, 2);
  const partnershipType = String(body.partnershipType ?? "").trim();
  const useCase         = String(body.useCase         ?? "").trim().slice(0, 2000);
  const source          = String(body.source          ?? "landing").trim().slice(0, 40);

  // ── Validation ────────────────────────────────────────────────────────────
  if (companyName.length < 2 || companyName.length > 120) {
    return NextResponse.json({ ok: false, error: "Company name must be 2–120 characters" }, { status: 400 });
  }
  if (contactName.length < 2 || contactName.length > 80) {
    return NextResponse.json({ ok: false, error: "Contact name must be 2–80 characters" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail) || contactEmail.length > 200) {
    return NextResponse.json({ ok: false, error: "Invalid contact email" }, { status: 400 });
  }
  if (companySize && !VALID_SIZE.has(companySize)) {
    return NextResponse.json({ ok: false, error: "Invalid company size" }, { status: 400 });
  }
  if (partnershipType && !VALID_TYPE.has(partnershipType)) {
    return NextResponse.json({ ok: false, error: "Invalid partnership type" }, { status: 400 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("partner_waitlist")
    .insert({
      company_name:     companyName,
      company_website:  companyWebsite || null,
      industry:         industry       || null,
      company_size:     companySize    || null,
      contact_name:     contactName,
      contact_email:    contactEmail,
      contact_phone:    contactPhone || null,
      contact_country:  contactCountry,
      partnership_type: partnershipType || null,
      use_case:         useCase || null,
      source,
    })
    .select("id, created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id, createdAt: data?.created_at });
}
