"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface ClientBotConfig {
  subscription_id: number;
  client_address: string;
  bot_token: string;
  allowed_chats: string[];
  updated_at: string;
}

interface BotIdentity {
  username: string;
  firstName: string;
  id: number;
}

/** Fetch bot identity from Telegram. Telegram's bot API allows CORS, so this
 *  works directly from the browser. Returns null on any failure (invalid token,
 *  network, deleted bot — caller falls back to the raw token display). */
async function fetchBotIdentity(botToken: string): Promise<BotIdentity | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.ok || !json?.result?.username) return null;
    return {
      username:  json.result.username,
      firstName: json.result.first_name || json.result.username,
      id:        json.result.id,
    };
  } catch {
    return null;
  }
}

export default function ClientTelegramBotSection({ subscriptionId }: { subscriptionId: bigint }) {
  const { address } = useAccount();
  const subIdNum = Number(subscriptionId);

  const [existing, setExisting]   = useState<ClientBotConfig | null>(null);
  const [identity, setIdentity]   = useState<BotIdentity | null>(null);
  const [loading, setLoading]     = useState(true);
  const [botToken, setBotToken]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [removing, setRemoving]   = useState(false);

  // Load existing config via API (uses admin client to bypass RLS)
  useEffect(() => {
    fetch(`/api/client-bot-config?subscription_id=${subIdNum}`)
      .then(r => r.json())
      .then(({ data }) => {
        setExisting(data as ClientBotConfig | null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [subIdNum]);

  // When a bot is configured, resolve its public identity (@username, name)
  // so the user sees something meaningful instead of the raw token blob.
  useEffect(() => {
    if (!existing?.bot_token) {
      setIdentity(null);
      return;
    }
    let cancelled = false;
    fetchBotIdentity(existing.bot_token).then(info => {
      if (!cancelled) setIdentity(info);
    });
    return () => { cancelled = true; };
  }, [existing?.bot_token]);

  const handleSave = async () => {
    if (!botToken.trim() || !address) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    const res = await fetch("/api/client-bot-config", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        subscription_id: subIdNum,
        client_address:  address,
        bot_token:       botToken.trim(),
      }),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok || json.error) {
      setSaveError(json.error || "Failed to save bot token. Please try again.");
      return;
    }
    setExisting(json.data as ClientBotConfig);
    setBotToken("");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRemove = async () => {
    if (!existing || !address) return;
    setRemoving(true);
    await fetch("/api/client-bot-config", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        subscription_id: subIdNum,
        client_address:  address,
        bot_token:       null,
      }),
    });
    setExisting(null);
    setRemoving(false);
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wider">
            Customer Service Bot
          </h2>
          <p className="text-[12px] text-white/30 mt-1">
            Your agent answers customer Telegram messages 24/7 using AI.
            Each client brings their own bot.
          </p>
        </div>
        {existing && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        )}
      </div>

      {existing ? (
        /* ── Configured state — surface bot @username + chat deep link ── */
        <div className="space-y-3">
          {/* Identity card — the part the user actually cares about */}
          <div className="rounded-xl border border-[#38bdf8]/15 bg-gradient-to-br from-[#38bdf8]/[0.06] to-[#0d1525]/60 p-4">
            <div className="flex items-center gap-3 mb-3">
              {/* Telegram icon */}
              <div className="w-10 h-10 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/25 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#38bdf8]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                {identity ? (
                  <>
                    <p className="text-[14px] text-white font-medium truncate">{identity.firstName}</p>
                    <p className="text-[12px] text-[#38bdf8]/80 font-mono truncate">@{identity.username}</p>
                  </>
                ) : (
                  <>
                    <p className="text-[14px] text-white/80 font-medium">Customer service bot</p>
                    <p className="text-[11px] text-white/40">Resolving bot identity…</p>
                  </>
                )}
              </div>
            </div>

            {identity ? (
              <a
                href={`https://t.me/${identity.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#38bdf8] text-[#021F2E] text-[13px] font-semibold hover:bg-[#7dd3fc] transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
                Open chat with @{identity.username}
              </a>
            ) : (
              <div className="text-center py-2 text-[11px] text-amber-400/70 border border-amber-400/20 bg-amber-400/5 rounded-xl">
                Couldn't reach Telegram — token may be invalid or revoked.
              </div>
            )}

            <p className="text-[11px] text-white/35 mt-3 leading-relaxed">
              Share this bot link with your customers — your agent answers their questions 24/7.
            </p>
          </div>

          {/* Meta + advanced controls */}
          <div className="flex items-center justify-between text-[11px] text-white/30">
            <span>Configured {new Date(existing.updated_at).toLocaleDateString()}</span>
            <button
              onClick={() => setShowToken(v => !v)}
              className="hover:text-white/60 transition-colors"
            >
              {showToken ? "Hide token" : "Show token"}
            </button>
          </div>

          {showToken && (
            <div className="rounded-xl border border-white/[0.07] bg-[#050810]/60 p-3">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Bot Token</p>
              <p className="text-[11px] text-white/60 font-mono break-all">{existing.bot_token}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <div className="flex-1 flex gap-2">
              <input
                type="password"
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                placeholder="Paste new token to replace"
                className="flex-1 bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25"
              />
              <button
                onClick={handleSave}
                disabled={saving || !botToken.trim()}
                className="px-4 py-2 bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-[12px] font-medium rounded-xl disabled:opacity-40 hover:bg-[#38bdf8]/20 transition-colors"
              >
                {saving ? "Saving…" : "Replace"}
              </button>
            </div>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="px-3 py-2 border border-red-500/20 text-red-400/60 text-[12px] rounded-xl hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              {removing ? "…" : "Remove"}
            </button>
          </div>
        </div>
      ) : (
        /* ── Not configured state ── */
        <div className="space-y-4">
          {/* Steps */}
          <div className="rounded-xl border border-white/[0.06] bg-[#050810]/40 p-4 space-y-2.5">
            {[
              { n: "1", text: "Open Telegram and message @BotFather" },
              { n: "2", text: "Send /newbot — choose a name and username" },
              { n: "3", text: "Copy the bot token BotFather gives you" },
              { n: "4", text: "Paste it below — your agent is ready 24/7" },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {s.n}
                </span>
                <p className="text-[12px] text-white/45 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="password"
              value={botToken}
              onChange={e => setBotToken(e.target.value)}
              placeholder="7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxx"
              className="flex-1 bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25 font-mono"
            />
            <button
              onClick={handleSave}
              disabled={saving || !botToken.trim()}
              className="px-5 py-2.5 bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-[13px] font-medium rounded-xl disabled:opacity-40 hover:bg-[#38bdf8]/20 transition-colors whitespace-nowrap"
            >
              {saving ? "Saving…" : "Activate Bot"}
            </button>
          </div>

          {saved && (
            <p className="text-[12px] text-emerald-400/70">
              Bot configured — your agent will start answering customers shortly.
            </p>
          )}

          {saveError && (
            <p className="text-[12px] text-red-400/80">
              {saveError}
            </p>
          )}

          <p className="text-[11px] text-white/20">
            The token is stored securely. Your agent uses it to reply to customers on your behalf.
          </p>
        </div>
      )}
    </div>
  );
}
