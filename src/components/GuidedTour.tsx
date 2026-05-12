"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// GuidedTour — spotlight overlay with smart-positioned card.
//
// Each step optionally points to a real UI element via `target` (CSS selector,
// typically `[data-tour-id="..."]`). When found:
//   - A glowing cyan ring traces the element's bounding rect with comfortable
//     padding, casting an outer box-shadow that dims the rest of the page.
//   - The card is placed adjacent to the element (below preferred, then above,
//     then right, then left, falling back to bottom-right corner).
//   - The element is scrolled into view before the spotlight settles.
// Without a target, falls back to a full-screen dim + bottom-right card.
//
// Each tour is identified by `tourKey`. First visit auto-opens. The
// `zerogig:tour:<tourKey>:seen` localStorage flag suppresses re-opens.
// `openTour(tourKey)` dispatches an event so the navbar Guide button can
// reopen the tour from anywhere.
// ─────────────────────────────────────────────────────────────────────────────

export interface TourStep {
  title:      string;
  body:       string;
  /** Optional CSS selector (e.g. `[data-tour-id="agent-switcher"]`). When the
   *  matching element exists, the spotlight + card position track it. */
  target?:    string;
  /** How much breathing room to add around the spotlight rect, in pixels. */
  padding?:   number;
  /** Preferred placement of the card relative to the target. */
  placement?: "top" | "bottom" | "left" | "right" | "auto";
}

interface GuidedTourProps {
  tourKey: string;
  steps:   TourStep[];
  badge?:  string;
}

const LS_KEY      = (tourKey: string) => `zerogig:tour:${tourKey}:seen`;
const OPEN_EVENT  = (tourKey: string) => `zerogig:tour:open:${tourKey}`;
const CARD_WIDTH  = 380;
const CARD_HEIGHT = 220;   // approximate — enough for placement math
const CARD_MARGIN = 16;
const GAP         = 20;

export function openTour(tourKey: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT(tourKey)));
}

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
  } catch { /* private mode */ }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

interface Placement {
  cardTop:    number;
  cardLeft:   number;
  spotlight?: { top: number; left: number; width: number; height: number };
}

/** Compute card + spotlight placement based on target rect + viewport. */
function computePlacement(
  target:    HTMLElement | null,
  prefer:    TourStep["placement"] = "auto",
  pad:       number                = 10,
): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!target) {
    return {
      cardTop:  vh - CARD_HEIGHT - CARD_MARGIN,
      cardLeft: vw - CARD_WIDTH  - CARD_MARGIN,
    };
  }

  const r = target.getBoundingClientRect();
  const spot = {
    top:    r.top    - pad,
    left:   r.left   - pad,
    width:  r.width  + pad * 2,
    height: r.height + pad * 2,
  };

  const candidates: Array<{ name: NonNullable<TourStep["placement"]>; top: number; left: number; fits: boolean }> = [
    {
      name: "bottom",
      top:  spot.top + spot.height + GAP,
      left: clamp(spot.left, CARD_MARGIN, vw - CARD_WIDTH - CARD_MARGIN),
      fits: spot.top + spot.height + GAP + CARD_HEIGHT + CARD_MARGIN <= vh,
    },
    {
      name: "top",
      top:  spot.top - CARD_HEIGHT - GAP,
      left: clamp(spot.left, CARD_MARGIN, vw - CARD_WIDTH - CARD_MARGIN),
      fits: spot.top - CARD_HEIGHT - GAP >= CARD_MARGIN,
    },
    {
      name: "right",
      top:  clamp(spot.top, CARD_MARGIN, vh - CARD_HEIGHT - CARD_MARGIN),
      left: spot.left + spot.width + GAP,
      fits: spot.left + spot.width + GAP + CARD_WIDTH + CARD_MARGIN <= vw,
    },
    {
      name: "left",
      top:  clamp(spot.top, CARD_MARGIN, vh - CARD_HEIGHT - CARD_MARGIN),
      left: spot.left - CARD_WIDTH - GAP,
      fits: spot.left - CARD_WIDTH - GAP >= CARD_MARGIN,
    },
  ];

  // Prefer the requested placement if it fits, otherwise the first fitting one
  const preferred = candidates.find(c => c.name === prefer && c.fits);
  const fallback  = candidates.find(c => c.fits);
  const pick      = preferred ?? fallback ?? candidates[0];

  return {
    cardTop:  pick.top,
    cardLeft: pick.left,
    spotlight: spot,
  };
}

export default function GuidedTour({ tourKey, steps, badge }: GuidedTourProps) {
  const [open,    setOpen]    = useState(false);
  const [index,   setIndex]   = useState(0);
  const [mounted, setMounted] = useState(false);
  const [placement, setPlacement] = useState<Placement>({ cardTop: 0, cardLeft: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Auto-open on first visit. Slight delay so the page renders first.
  useEffect(() => {
    if (hasSeen(tourKey)) return;
    const t = window.setTimeout(() => {
      setIndex(0);
      setOpen(true);
    }, 600);
    return () => window.clearTimeout(t);
  }, [tourKey]);

  // Manual reopen via the Guide nav button
  useEffect(() => {
    const handler = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT(tourKey), handler);
    return () => window.removeEventListener(OPEN_EVENT(tourKey), handler);
  }, [tourKey]);

  // Esc dismisses
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

  // Resolve target + compute placement on step / window changes. Recomputes on
  // resize + scroll so the spotlight tracks live UI changes.
  useEffect(() => {
    if (!open || !current) return;

    const recompute = () => {
      const el = current.target ? document.querySelector<HTMLElement>(current.target) : null;
      setPlacement(computePlacement(el, current.placement, current.padding));
    };

    // Scroll target into view first, then recompute after a beat so the
    // bounding rect reflects the post-scroll position.
    const el = current.target ? document.querySelector<HTMLElement>(current.target) : null;
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = window.setTimeout(recompute, el ? 350 : 0);

    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute);
    };
  }, [open, index, current]);

  const contentKey = useMemo(() => `${tourKey}-${index}`, [tourKey, index]);

  if (!current || !mounted) return null;

  const hasSpotlight = !!placement.spotlight;
  const isLast       = index === steps.length - 1;

  const overlay = (
    <AnimatePresence>
      {open && (
        <>
          {/* Full-screen dim — only used when no target exists. When a
              spotlight is present, the dim comes from the spotlight's
              box-shadow trick instead so the highlighted element pops. */}
          {!hasSpotlight && (
            <motion.div
              key="tour-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[2147483645] bg-black/55 backdrop-blur-[2px] pointer-events-auto"
              aria-hidden
            />
          )}

          {/* Spotlight — animated to new target position on step change. The
              big outer box-shadow paints the dim area, leaving the spotlight
              rectangle as a "window" through the darkness. Glowing cyan ring
              traces the rectangle border. */}
          {hasSpotlight && placement.spotlight && (
            <motion.div
              key={`tour-spotlight-${tourKey}`}
              initial={false}
              animate={{
                top:    placement.spotlight.top,
                left:   placement.spotlight.left,
                width:  placement.spotlight.width,
                height: placement.spotlight.height,
              }}
              transition={{ type: "spring", stiffness: 220, damping: 28, mass: 0.7 }}
              className="fixed z-[2147483645] rounded-2xl pointer-events-none"
              style={{
                boxShadow:
                  // outer dim (paints everything outside the spotlight)
                  "0 0 0 9999px rgba(3,5,9,0.65), " +
                  // inner glow ring
                  "0 0 0 2px rgba(56,189,248,0.65), " +
                  // outer halo
                  "0 0 32px 4px rgba(56,189,248,0.45), " +
                  // inner soft glow
                  "inset 0 0 16px rgba(56,189,248,0.15)",
                border:        "1px solid rgba(125,211,252,0.85)",
                background:    "transparent",
              }}
              aria-hidden
            />
          )}

          {/* Card */}
          <motion.div
            ref={cardRef}
            key={`tour-card-${tourKey}`}
            role="dialog"
            aria-modal="true"
            aria-label={`${badge ?? "Tour"} step ${index + 1} of ${steps.length}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{
              opacity: 1,
              scale:   1,
              top:     placement.cardTop,
              left:    placement.cardLeft,
            }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{
              opacity:    { duration: 0.2 },
              scale:      { duration: 0.2 },
              top:        { type: "spring", stiffness: 220, damping: 28, mass: 0.7 },
              left:       { type: "spring", stiffness: 220, damping: 28, mass: 0.7 },
            }}
            className="fixed z-[2147483647] w-[380px] max-w-[calc(100vw-32px)] rounded-2xl border border-white/10 bg-[#0d1525] shadow-[0_24px_64px_rgba(0,0,0,0.65)] p-5 pointer-events-auto"
          >
            {/* Header — progress dots + counter + close */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === index
                        ? "w-5 bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
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

            {/* Badge */}
            {badge && (
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400/70 mb-2">
                {badge}
              </p>
            )}

            {/* Content */}
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

            {/* Footer */}
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

  return createPortal(overlay, document.body);
}
