import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(SB_URL, SB_SERVICE_KEY);
}

/**
 * GET /api/client-bot-config?subscription_id=N
 * Returns the bot config for a given subscription (if any).
 */
export async function GET(request: NextRequest) {
  const subId = request.nextUrl.searchParams.get("subscription_id");
  if (!subId) return NextResponse.json({ data: null });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("client_bot_configs")
    .select("subscription_id, client_address, bot_token, allowed_chats, updated_at")
    .eq("subscription_id", Number(subId))
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/**
 * POST /api/client-bot-config
 * Upserts (or deletes when bot_token is null) a bot config.
 * Uses service role to bypass RLS.
 *
 * Body: { subscription_id: number, client_address: string, bot_token: string | null }
 */
export async function POST(request: NextRequest) {
  try {
    const { subscription_id, client_address, bot_token } = await request.json();
    if (!subscription_id || !client_address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = getAdminClient();

    // null bot_token = remove
    if (bot_token === null) {
      await admin.from("client_bot_configs").delete().eq("subscription_id", subscription_id);
      return NextResponse.json({ success: true });
    }

    const { data, error } = await admin
      .from("client_bot_configs")
      .upsert(
        {
          subscription_id,
          client_address: client_address.toLowerCase(),
          bot_token,
          allowed_chats: [],
          updated_at:    new Date().toISOString(),
        },
        { onConflict: "subscription_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[client-bot-config]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
