"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/utils";
import { useJobDetails } from "@/hooks/useProgressiveEscrow";
import { useAgentProfile } from "@/hooks/useAgentProfile";

interface ChatMessage {
  id: string;
  job_id: number;
  sender: "user" | "agent";
  message: string;
  created_at: string;
}

const AGENT_GRADIENTS = [
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2" aria-label="Agent is typing">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#a855f7]/80"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function JobChat({ jobId, className, disabled }: { jobId: number; className?: string; disabled?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingAgent, setAwaitingAgent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Resolve agent identity for the header + avatar
  const { data: job } = useJobDetails(jobId);
  const agentIdNum = job?.agentId ? Number(job.agentId) : 0;
  const { profile } = useAgentProfile(agentIdNum > 0 ? agentIdNum : undefined);
  const agentName = profile?.display_name || (agentIdNum > 0 ? `Agent #${agentIdNum}` : "Agent");
  const agentAvatar = profile?.avatar_url;
  const gradient = AGENT_GRADIENTS[agentIdNum % AGENT_GRADIENTS.length];

  // Load history + subscribe to realtime
  useEffect(() => {
    supabase
      .from("job_messages")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages((data as ChatMessage[]) ?? []));

    const channel = supabase
      .channel(`job_messages:${jobId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "job_messages", filter: `job_id=eq.${jobId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  // Clear "awaiting" once an agent reply arrives
  useEffect(() => {
    if (!awaitingAgent) return;
    const last = messages[messages.length - 1];
    if (last?.sender === "agent") setAwaitingAgent(false);
  }, [messages, awaitingAgent]);

  // Safety: drop typing indicator after 45s if no reply
  useEffect(() => {
    if (!awaitingAgent) return;
    const t = setTimeout(() => setAwaitingAgent(false), 45000);
    return () => clearTimeout(t);
  }, [awaitingAgent]);

  // Group consecutive messages from same sender so only the last shows timestamp/avatar
  const bubbles = useMemo(() => {
    return messages.map((msg, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const isFirstInBurst = !prev || prev.sender !== msg.sender;
      const isLastInBurst = !next || next.sender !== msg.sender;
      return { msg, isFirstInBurst, isLastInBurst };
    });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/job-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, sender: "user", message: text }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }
      setInput("");
      setAwaitingAgent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0d1525]/90 flex flex-col overflow-hidden ${className ?? ""}`} style={!className ? { height: 420 } : undefined}>
      {/* Header — agent identity + online status */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-[#050810]/40">
        <div className="relative shrink-0">
          {agentAvatar ? (
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
              <Image
                src={agentAvatar}
                alt={agentName}
                width={36}
                height={36}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-white text-[11px] font-bold">
                {agentIdNum > 0 ? `#${agentIdNum}` : "AI"}
              </span>
            </div>
          )}
          {/* Online pulse */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#0d1525] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white text-[14px] font-semibold truncate">{agentName}</h3>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono uppercase tracking-wider">
              online
            </span>
          </div>
          <p className="text-white/40 text-[11px]">
            {awaitingAgent ? (
              <span className="text-[#a855f7]/80 animate-pulse">typing…</span>
            ) : (
              <>responds to job <span className="font-mono text-white/50">#{jobId}</span></>
            )}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          live
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && !awaitingAgent ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} opacity-30 flex items-center justify-center`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-white/50 text-[13px] text-center">
              Start a conversation with <span className="text-white">{agentName}</span>
            </p>
            <p className="text-white/25 text-[11px] text-center max-w-[240px]">
              Ask a question, clarify scope, or leave feedback — replies appear in real time.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {bubbles.map(({ msg, isFirstInBurst, isLastInBurst }) => {
              const isUser = msg.sender === "user";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"} ${isFirstInBurst ? "mt-2" : "mt-0.5"}`}
                >
                  {/* Left: agent avatar — only on last of agent burst */}
                  {!isUser && (
                    <div className="w-6 shrink-0">
                      {isLastInBurst && (
                        agentAvatar ? (
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10">
                            <Image src={agentAvatar} alt="" width={24} height={24} className="w-full h-full object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                            <span className="text-white text-[8px] font-bold">
                              {agentIdNum > 0 ? agentIdNum : "AI"}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`relative px-3.5 py-2 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${
                        isUser
                          ? "bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9] text-[#041421]"
                          : "bg-[#0b1020] border border-[#a855f7]/20 text-white/90"
                      }`}
                      style={{
                        borderRadius: isUser
                          ? `16px 16px ${isLastInBurst ? "4px" : "16px"} 16px`
                          : `16px 16px 16px ${isLastInBurst ? "4px" : "16px"}`,
                      }}
                    >
                      {msg.message}
                    </div>

                    {/* Meta: timestamp + delivery tick — only on last of burst */}
                    {isLastInBurst && (
                      <div className={`flex items-center gap-1 mt-0.5 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
                        <span className="text-[10px] text-white/30">
                          {formatRelativeTime(new Date(msg.created_at).getTime() / 1000)}
                        </span>
                        {isUser && (
                          <svg className="w-3.5 h-3.5 text-[#38bdf8]/70" viewBox="0 0 16 11" fill="none" aria-label="Delivered">
                            <path d="M10.5 1L5 6.5L2.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M14 1L8.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Typing indicator bubble */}
        <AnimatePresence>
          {awaitingAgent && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2 justify-start mt-1"
            >
              <div className="w-6 shrink-0">
                {agentAvatar ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10">
                    <Image src={agentAvatar} alt="" width={24} height={24} className="w-full h-full object-cover" unoptimized />
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <span className="text-white text-[8px] font-bold">
                      {agentIdNum > 0 ? agentIdNum : "AI"}
                    </span>
                  </div>
                )}
              </div>
              <div
                className="bg-[#0b1020] border border-[#a855f7]/20"
                style={{ borderRadius: "16px 16px 16px 4px" }}
              >
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-red-400 text-[12px]">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 flex gap-2 bg-[#050810]/40">
        {disabled ? (
          <div className="flex-1 flex items-center justify-center px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/30 text-[13px]">
            <svg className="w-4 h-4 mr-2 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Chat unlocks once an agent is hired and milestones are defined
          </div>
        ) : (
          <>
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setError(null); }}
              onKeyDown={handleKey}
              placeholder={`Message ${agentName}… (Enter to send)`}
              rows={1}
              className="flex-1 bg-[#050810]/80 border border-white/10 rounded-xl px-3 py-2 text-white text-[13px] placeholder:text-white/25 focus:outline-none focus:border-[#38bdf8]/40 resize-none transition-colors"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="px-4 py-2 rounded-xl bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9] text-[#041421] text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {sending ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-[#041421]/30 border-t-[#041421] animate-spin" />
                  <span>Sending</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
