import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, country, status, feedback_type, rating, message, wallet_address } = body;

    if (!name || !country || !status || !message) {
      return NextResponse.json(
        { ok: false, error: "name, country, status, and message are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.from("user_feedback").insert({
      name: String(name).trim().slice(0, 120),
      country: String(country).trim().slice(0, 80),
      status: String(status).trim().slice(0, 40),
      feedback_type: feedback_type ? String(feedback_type).trim().slice(0, 40) : "general",
      rating: typeof rating === "number" && rating >= 1 && rating <= 5 ? rating : null,
      message: String(message).trim().slice(0, 4000),
      wallet_address: wallet_address ? String(wallet_address).trim().slice(0, 42) : null,
      source: "feedback-page",
    });

    if (error) {
      console.error("[feedback] insert error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to save feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[feedback] unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}
