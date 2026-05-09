"use client";

/**
 * JobOrbitCarousel — interactive coverflow showing an agent's job history.
 *
 * Center card is full-detail and active. Side cards scale + rotate-Y for
 * a 3D ring feel. Wheel scroll, drag, arrow buttons, and dot pagination
 * all advance the active index. Single-job mode falls back to a static card.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import type { JobData } from "@/hooks/useProgressiveEscrow";
import { formatOG } from "@/lib/utils";

const STATUS_LABELS: Record<number, { label: string; chipBg: string; chipText: string; dot: string }> = {
  0: { label: "Open",              chipBg: "bg-[#47A9CF]/10",  chipText: "text-[#47A9CF]",  dot: "bg-[#47A9CF]" },
  1: { label: "Pending Setup",     chipBg: "bg-white/10",       chipText: "text-white/60",  dot: "bg-white/40" },
  2: { label: "In Progress",       chipBg: "bg-amber-500/15",  chipText: "text-amber-400", dot: "bg-amber-400" },
  3: { label: "Completed",         chipBg: "bg-emerald-500/15", chipText: "text-emerald-400", dot: "bg-emerald-400" },
  4: { label: "Cancelled",         chipBg: "bg-red-500/15",    chipText: "text-red-400",   dot: "bg-red-400" },
  5: { label: "Partially Done",    chipBg: "bg-[#A6E0F4]/15",  chipText: "text-[#A6E0F4]", dot: "bg-[#A6E0F4]" },
};

function fmtAddr(addr?: string) {
  if (!addr || addr.length < 10) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtDate(ts?: bigint) {
  if (!ts || ts === 0n) return "—";
  return new Date(Number(ts) * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function progressPct(job: JobData) {
  const total = job.totalBudgetWei ?? 0n;
  if (total === 0n) return 0;
  const released = job.releasedWei ?? 0n;
  return Number((released * 100n) / total);
}

// ── Card ─────────────────────────────────────────────────────────────────────

function JobCard({ job, active }: { job: JobData; active: boolean }) {
  const status = STATUS_LABELS[job.status] ?? STATUS_LABELS[0];
  const pct = progressPct(job);

  return (
    <div
      className={`w-[300px] md:w-[340px] rounded-2xl border ${
        active ? "border-[#47A9CF]/45" : "border-white/[0.08]"
      } bg-[#032A3D]/85 backdrop-blur-sm overflow-hidden transition-colors duration-300`}
      style={{
        boxShadow: active
          ? "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(71,169,207,0.18), 0 0 32px rgba(71,169,207,0.18)"
          : "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header strip with status */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 relative">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full ${status.dot} flex-shrink-0`} style={{ boxShadow: `0 0 8px currentColor` }} />
          <span className="text-white/35 text-[11px] font-mono uppercase tracking-[0.2em]">Job</span>
          <span className="text-white text-[15px] font-semibold tabular-nums">#{job.jobId.toString()}</span>
        </div>
        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${status.chipBg} ${status.chipText}`}>
          {status.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 space-y-3.5">
        {/* Budget block */}
        <div className="rounded-xl border border-white/[0.06] bg-[#021F2E]/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/35 mb-0.5">Budget</p>
          <p className="text-white text-[18px] font-semibold tabular-nums">{formatOG(job.totalBudgetWei ?? 0n)}</p>
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide text-white/35">Released</span>
              <span className="text-[11px] text-[#A6E0F4] tabular-nums">{formatOG(job.releasedWei ?? 0n)}</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#47A9CF] to-[#A6E0F4]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, pct)}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Meta rows */}
        <div className="space-y-1.5 text-[12px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/35 uppercase tracking-wide text-[10px]">Client</span>
            <span className="text-white/65 font-mono">{fmtAddr(job.client)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/35 uppercase tracking-wide text-[10px]">Milestones</span>
            <span className="text-white/65 tabular-nums">{job.milestoneCount}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/35 uppercase tracking-wide text-[10px]">Posted</span>
            <span className="text-white/65">{fmtDate(job.createdAt)}</span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/dashboard/jobs/${job.jobId.toString()}`}
          className="mt-1 inline-flex items-center justify-center gap-1.5 w-full px-3.5 py-2 rounded-full border border-[#47A9CF]/30 bg-[#47A9CF]/10 text-[#47A9CF] text-[12px] font-medium hover:bg-[#47A9CF]/20 hover:border-[#47A9CF]/50 transition-colors"
        >
          Open Job Detail
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

// ── Carousel ─────────────────────────────────────────────────────────────────

interface Props {
  jobs: JobData[];
  isLoading?: boolean;
}

export default function JobOrbitCarousel({ jobs, isLoading }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = (dir: 1 | -1) => {
    setActiveIdx((idx) => {
      const len = jobs.length;
      if (len === 0) return 0;
      return ((idx + dir) % len + len) % len;
    });
  };

  // Wheel listener — debounced so a single swipe advances exactly once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || jobs.length <= 1) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelTimerRef.current) return;
      advance(e.deltaY + e.deltaX > 0 ? 1 : -1);
      wheelTimerRef.current = setTimeout(() => {
        wheelTimerRef.current = null;
      }, 280);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length]);

  // Keyboard nav (when container is focused)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement !== el) return;
      if (e.key === "ArrowLeft")  { e.preventDefault(); advance(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); advance(1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 60;
    if (info.offset.x < -threshold || info.velocity.x < -400)  advance(1);
    else if (info.offset.x > threshold || info.velocity.x > 400) advance(-1);
  };

  // ─── Loading
  if (isLoading) {
    return (
      <div className="relative h-[440px] flex items-center justify-center gap-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`w-[300px] h-[340px] rounded-2xl border border-white/[0.08] bg-[#032A3D]/40 animate-pulse ${
              i === 1 ? "z-10" : "opacity-50 scale-90"
            }`}
          />
        ))}
      </div>
    );
  }

  // ─── Empty
  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#032A3D]/40 px-6 py-12 text-center">
        <p className="text-white/45 text-[14px]">No jobs in agent's history yet.</p>
        <p className="text-white/25 text-[12px] mt-1">When this agent accepts a proposal, the job will land here.</p>
      </div>
    );
  }

  // Pre-compute visible slots (±3 around active for ring effect; rest skipped)
  const visibleRange = 3;

  return (
    <div className="relative">
      {/* Carousel viewport */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label="Agent job history carousel"
        className="relative h-[460px] flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#47A9CF]/30 rounded-2xl"
        style={{ perspective: 1400 }}
      >
        <AnimatePresence initial={false}>
          {jobs.map((job, i) => {
            // Wrap offset so far-side items appear on near side when wrapping
            const len = jobs.length;
            let offset = i - activeIdx;
            if (offset > len / 2)  offset -= len;
            if (offset < -len / 2) offset += len;
            const absOff = Math.abs(offset);

            if (absOff > visibleRange) return null;

            const isActive = offset === 0;
            const x        = offset * 230;
            const scale    = isActive ? 1 : 1 - absOff * 0.13;
            const rotateY  = offset * -22;
            const opacity  = 1 - absOff * 0.28;
            const blur     = absOff > 0 ? `blur(${absOff * 0.6}px)` : undefined;

            return (
              <motion.div
                key={job.jobId.toString()}
                drag={isActive ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={handleDragEnd}
                onClick={() => !isActive && setActiveIdx(i)}
                animate={{ x, scale, rotateY, opacity, zIndex: 50 - absOff }}
                transition={{ type: "spring", stiffness: 180, damping: 28, mass: 0.8 }}
                className={`absolute ${isActive ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                style={{
                  transformStyle: "preserve-3d",
                  filter: blur,
                  willChange: "transform, opacity",
                }}
              >
                <JobCard job={job} active={isActive} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Edge fades to soften side cards into bg */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent pointer-events-none" />

        {/* Nav arrows */}
        {jobs.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => advance(-1)}
              aria-label="Previous job"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full border border-white/[0.12] bg-[#021F2E]/80 backdrop-blur-sm text-white/65 hover:text-white hover:border-[#47A9CF]/45 hover:bg-[#032A3D] transition-all flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => advance(1)}
              aria-label="Next job"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full border border-white/[0.12] bg-[#021F2E]/80 backdrop-blur-sm text-white/65 hover:text-white hover:border-[#47A9CF]/45 hover:bg-[#032A3D] transition-all flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Index strip */}
      {jobs.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="text-white/30 text-[11px] font-mono tabular-nums">
            {String(activeIdx + 1).padStart(2, "0")} / {String(jobs.length).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-1.5">
            {jobs.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIdx(i)}
                aria-label={`Go to job ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIdx
                    ? "w-6 bg-[#47A9CF]"
                    : "w-1.5 bg-white/15 hover:bg-white/35"
                }`}
              />
            ))}
          </div>
          <span className="text-white/25 text-[10px] uppercase tracking-[0.18em] hidden sm:inline">
            scroll · drag · ←→
          </span>
        </div>
      )}
    </div>
  );
}
