import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(SB_URL, SB_SERVICE_KEY);
}

/**
 * GET /api/agent-profile?agent_id=N
 * Returns the Supabase profile for a given agent (bypasses RLS via service role).
 */
export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get("agent_id");
  if (!agentId) return NextResponse.json({ data: null });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("agent_profiles")
    .select("agent_id, display_name, bio, avatar_url, tags, metadata")
    .eq("agent_id", Number(agentId))
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/**
 * POST /api/agent-profile
 * Upserts an agent profile using the service role key to bypass RLS.
 * Also upserts prebuilt agent_skills and stores custom tools in metadata.
 *
 * Body: {
 *   agent_id: number,
 *   owner_address: string,
 *   display_name?: string,
 *   avatar_url?: string,
 *   bio?: string,
 *   tags?: string[],
 *   prebuilt_skills?: string[],
 *   skill_configs?: Record<string, Record<string, string>>,
 *   custom_tools?: Array<{ type: string; name: string; endpoint: string; description: string }>,
 *   telegram_chat_id?: string | null,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agent_id,
      owner_address,
      display_name,
      avatar_url,
      bio,
      tags,
      prebuilt_skills,
      skill_configs,
      custom_tools,
      telegram_chat_id,
      runtime_type,
      platform_config,
      agent_wallet,
    } = body;

    if (agent_id === undefined || !owner_address) {
      return NextResponse.json({ error: "Missing agent_id or owner_address" }, { status: 400 });
    }

    const admin = getAdminClient();

    // ── 1. Build metadata (custom tools + telegram chat id + platform manifest) ─
    const metadata: Record<string, unknown> = {};
    if (telegram_chat_id) metadata.telegramChatId = telegram_chat_id;
    if (custom_tools && custom_tools.length > 0) {
      // Strip API keys before storing in DB
      metadata.customTools = (custom_tools as Array<Record<string, unknown>>).map(t => ({
        type:        t.type,
        name:        t.name,
        endpoint:    t.endpoint,
        description: t.description,
      }));
    }
    if (runtime_type) {
      metadata.platformManaged = runtime_type === "platform_managed";
      metadata.runtimeMode = runtime_type === "platform_managed" ? "platform" : "self-hosted";
    }
    if (platform_config && typeof platform_config === "object") {
      // Merge full capability manifest (platformConfig, tools, prebuiltSkills, etc.)
      Object.assign(metadata, platform_config);
    }
    if (agent_wallet) metadata.agentWallet = agent_wallet;

    // ── 2. Upsert agent_profiles ─────────────────────────────────────────────
    const profilePayload: Record<string, unknown> = {
      agent_id,
      owner_address: (owner_address as string).toLowerCase(),
      updated_at:    new Date().toISOString(),
    };
    if (display_name !== undefined) profilePayload.display_name = display_name || null;
    if (avatar_url   !== undefined) profilePayload.avatar_url   = avatar_url   || null;
    if (bio          !== undefined) profilePayload.bio          = bio          || null;
    if (tags         !== undefined) profilePayload.tags         = tags;
    if (Object.keys(metadata).length > 0) profilePayload.metadata = metadata;

    const { error: profileError } = await admin
      .from("agent_profiles")
      .upsert(profilePayload, { onConflict: "agent_id" });

    if (profileError) {
      console.error("[agent-profile] profile upsert error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // ── 3. Upsert agent_skills (prebuilt only — custom tools go in metadata) ─
    if (prebuilt_skills && (prebuilt_skills as string[]).length > 0) {
      const skillRows = (prebuilt_skills as string[]).map((skillId: string) => {
        const baseConfig: Record<string, string> = (skill_configs as Record<string, Record<string, string>>)?.[skillId] || {};
        const config =
          skillId === "telegram_notify" && telegram_chat_id
            ? { ...baseConfig, chatId: telegram_chat_id }
            : baseConfig;
        return { agent_id, skill_id: skillId, config, is_active: true };
      });

      const { error: skillsError } = await admin
        .from("agent_skills")
        .upsert(skillRows, { onConflict: "agent_id,skill_id" });

      if (skillsError) {
        // Non-fatal — profile was already saved; log and continue
        console.error("[agent-profile] agent_skills upsert error:", skillsError);
      }
    }

    return NextResponse.json({ success: true, agent_id });
  } catch (err) {
    console.error("[agent-profile] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agent-profile
 * Merges specific metadata fields without overwriting the whole metadata blob.
 * Currently supports: { agent_id, tools }
 *
 * Body: {
 *   agent_id: number,
 *   tools?: Array<{ type, name, description, config }>   // runtime tool format
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, tools } = body;

    if (agent_id === undefined) {
      return NextResponse.json({ error: "Missing agent_id" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Read current metadata so we can merge (not overwrite)
    const { data: current, error: readErr } = await admin
      .from("agent_profiles")
      .select("metadata")
      .eq("agent_id", Number(agent_id))
      .maybeSingle();

    if (readErr) {
      return NextResponse.json({ error: readErr.message }, { status: 500 });
    }

    const existingMeta: Record<string, unknown> = (current?.metadata as Record<string, unknown>) || {};

    // Merge only the provided fields
    const mergedMeta: Record<string, unknown> = { ...existingMeta };
    if (tools !== undefined) mergedMeta.tools = tools;

    const { error: updateErr } = await admin
      .from("agent_profiles")
      .update({ metadata: mergedMeta, updated_at: new Date().toISOString() })
      .eq("agent_id", Number(agent_id));

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, agent_id });
  } catch (err) {
    console.error("[agent-profile PATCH] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
