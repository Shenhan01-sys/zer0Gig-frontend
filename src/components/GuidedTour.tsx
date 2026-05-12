"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// GuidedTour — bottom-right card walkthrough.
//
// Patterned after stealth-frontier-hackathon.vercel.app/treasurer:
//   - Fixed bottom-right card (not anchored to a specific DOM element).
//   - Dimming backdrop so the card draws focus without spotlight gymnastics.
//   - Progress dots + N / total counter on top.
//   - Skip tour (ghost) + Next/Done (filled) on bottom.
//
// Each tour is identified by a `tourKey` string. First visit auto-opens.
// localStorage flag `zerogig:tour:<tourKey>:seen` prevents re-opening on
// subsequent visits. A Guide button in AppNavbar resets the visit state by
// opening the tour again via the same hook.
// ─────────────────────────────────────────────────────────────────────────────

export interface TourStep {
  title: string;
  body:  string;
}

interface GuidedTourProps {
  tourKey: string;          // unique identifier — localStorage key + open-event dispatch target
  steps:   TourStep[];
  /** Optional badge shown above the title — e.g. the section name. */
  badge?:  string;
}

const LS_KEY = (tourKey: string) => `zerogig:tour:${tourKey}:seen`;
const OPEN_EVENT = (tourKey: string) => `zerogig:tour:open:${tourKey}`;

/** Imperative open helper — call from anywhere (e.g. AppNavbar Guide button). */
export function openTour(tourKey: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT(tourKey)));
}

/** SSR-safe localStorage read. */
function hasSeen(tourKey: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(LS_KEY(tourKey)) === "1";
  } catch {
    return false;
  }
}

function markSeen(tourKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY(tourKey), "1");
  } catch {
    // private mode / quota — non-fatal, just means we re-show
  }
}

export default function GuidedTour({ tourKey, steps, badge }: GuidedTourProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // Auto-open on first visit. Defer to the next tick so the page has a moment
  // to render before the dim backdrop appears — feels less abrupt.
  useEffect(() => {
    if (hasSeen(tourKey)) return;
    const t = window.setTimeout(() => {
      setIndex(0);
      setOpen(true);
    }, 600);
    return () => window.clearTimeout(t);
  }, [tourKey]);

  // Manual reopen via the Guide nav button — dispatches a custom event with
  // the tourKey as part of the event name so each tour listens for its own.
  useEffect(() => {
    const handler = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT(tourKey), handler);
    return () => window.removeEventListener(OPEN_EVENT(tourKey), handler);
  }, [tourKey]);

  // Esc to dismiss
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    markSeen(tourKey);
  }, [tourKey]);

  const handleNext = useCallback(() => {
    if (index < steps.length - 1) setIndex(i => i + 1);
    else handleClose();
  }, [index, steps.length, handleClose]);

  const current = steps[index];
  const isLast  = index === steps.length - 1;

  // Stable per-step key so AnimatePresence cross-fades content
  const contentKey = useMemo(() => `${tourKey}-${index}`, [tourKey, index]);

  if (!current) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Dimming backdrop. Clicking it does NOT close — too easy to dismiss
              accidentally on mobile. Use Skip or the explicit close button. */}
          <motion.div
            key="tour-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[2px] pointer-events-none"
            aria-hidden
          />

          {/* Card — bottom right on desktop, bottom-center on small screens */}
          <motion.div
            key="tour-card"
            role="dialog"
            aria-modal="true"
            aria-label={`${badge ?? "Tour"} step ${index + 1} of ${steps.length}`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.25, 0.4, 0.25, 1] }}
            className="fixed z-[101] left-4 right-4 bottom-5 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px] rounded-2xl border border-white/10 bg-[#0d1525] shadow-[0_24px_64px_rgba(0,0,0,0.55)] p-5"
          >
            {/* Header — progress dots + counter + close */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === index
                        ? "w-5 bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                        : i < index
                          ? "w-3 bg-cyan-400/45"
                          : "w-3 bg-white/15"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-white/40 tabular-nums">
                  {index + 1} / {steps.length}
                </span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-white/35 hover:text-white/70 transition-colors p-0.5"
                  aria-label="Close tour"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Badge (optional) */}
            {badge && (
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400/70 mb-2">
                {badge}
              </p>
            )}

            {/* Content with cross-fade between steps */}
            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mb-5"
              >
                <h3 className="text-white text-[16px] font-medium leading-snug mb-1.5">
                  {current.title}
                </h3>
                <p className="text-white/60 text-[13px] leading-relaxed">
                  {current.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Footer — Skip + Next */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="text-white/45 hover:text-white/75 text-[12px] font-medium transition-colors"
              >
                Skip tour
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-[12px] font-medium hover:bg-white/90 transition-colors"
              >
                {isLast ? "Done" : "Next"}
                {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
