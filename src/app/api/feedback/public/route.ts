import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(_req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("user_feedback")
      .select("name, country, status, rating, message, created_at")
      .eq("is_displayed", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[feedback/public] select error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch feedbacks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, feedbacks: data ?? [] });
  } catch (e) {
    console.error("[feedback/public] unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}
