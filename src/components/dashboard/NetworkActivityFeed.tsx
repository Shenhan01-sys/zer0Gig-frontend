"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityEvent {
  id: string;
  jobId: number;
  agentId: string | null;
  agentWallet: string | null;
  phase: string;
  label: string;
  color: string;
  message: string;
  milestoneIndex: number | null;
  timestamp: string;
}

const COLOR_MAP: Record<string, { dot: string; text: string; badge: string }> = {
  emerald: { dot: "bg-emerald-400", text: "text-emerald-400",  badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cyan:    { dot: "bg-[#38bdf8]",   text: "text-[#38bdf8]",    badge: "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20" },
  violet:  { dot: "bg-violet-400",  text: "text-violet-400",   badge: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  amber:   { dot: "bg-amber-400",   text: "text-amber-400",    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  red:     { dot: "bg-red-400",     text: "text-red-400",      badge: "bg-red-500/10 text-red-400 border-red-500/20" },
  white:   { dot: "bg-white/40",    text: "text-white/40",     badge: "bg-white/5 text-white/40 border-white/10" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function PhaseIcon({ phase }: { phase: string }) {
  if (phase === "completed") return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
  if (phase === "error") return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
  if (phase === "submitting") return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
  if (phase === "uploading") return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
  // processing / default — spinner-like icon
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
    </svg>
  );
}

export default function NetworkActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenIds] = useState(() => new Set<string>());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/network-activity", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const incoming: ActivityEvent[] = data.events ?? [];

      const fresh = new Set<string>();
      for (const ev of incoming) {
        if (!prevIdsRef.current.has(ev.id) && seenIds.size > 0) {
          fresh.add(ev.id);
        }
        seenIds.add(ev.id);
        prevIdsRef.current.add(ev.id);
      }

      setEvents(incoming);
      if (fresh.size > 0) {
        setNewIds(fresh);
        setTimeout(() => setNewIds(new Set()), 3000);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [seenIds]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 8_000);
    return () => clearInterval(id);
  }, [poll]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-emerald-400"
            style={{ boxShadow: "0 0 6px rgba(52,211,153,0.7)", animation: "pulse 2s ease-in-out infinite" }}
          />
          <h3 className="text-[13px] font-medium text-white/60 uppercase tracking-wide">Live Activity</h3>
        </div>
        <span className="text-[10px] text-white/25">auto-refreshes</span>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-white/30 text-[12px] text-center py-6">No activity yet.</p>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
          <AnimatePresence initial={false}>
            {events.map((ev) => {
              const c = COLOR_MAP[ev.color] ?? COLOR_MAP.white;
              const isNew = newIds.has(ev.id);
              return (
                <motion.div
                  key={ev.id}
                  layout
                  initial={isNew ? { opacity: 0, x: -10 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-2.5 px-3 py-2 rounded-xl transition-all ${
                    isNew ? "bg-[#38bdf8]/[0.06] border border-[#38bdf8]/15" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Phase icon */}
                  <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${c.badge} border`}>
                    <span className={c.text}>
                      <PhaseIcon phase={ev.phase} />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/jobs/${ev.jobId}`}
                        className="text-white text-[12px] font-medium hover:text-[#38bdf8] transition-colors"
                      >
                        Job #{ev.jobId}
                      </Link>
                      {ev.milestoneIndex !== null && (
                        <span className="text-white/25 text-[10px]">M{ev.milestoneIndex + 1}</span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold border ${c.badge}`}>
                        {ev.label}
                      </span>
                    </div>
                    <p className="text-white/35 text-[11px] truncate mt-0.5">{ev.message}</p>
                  </div>

                  <span className="text-white/20 text-[10px] flex-shrink-0 mt-1">{relativeTime(ev.timestamp)}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
