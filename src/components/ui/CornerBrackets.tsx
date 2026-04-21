"use client";

/**
 * CornerBrackets — terminal-style L-shaped markers at the four corners
 * of a container. Small, precise, evokes "precision instrument / agent
 * operations console" without adding weight.
 *
 * Place as an absolutely-positioned child inside a `relative` parent.
 * Pointer-events none so it never blocks interactions.
 *
 * Variants:
 *   - size:    "sm" (8px)  | "md" (14px) | "lg" (20px)
 *   - weight:  "hair" (1px) | "line" (1.5px)
 *   - accent:  hex color for the stroke (default: cyan #38bdf8)
 *   - glow:    adds a subtle drop-shadow matching the accent
 *   - inset:   pixels from the container edge (default: 0)
 */
export default function CornerBrackets({
  size = "md",
  weight = "line",
  accent = "#38bdf8",
  glow = false,
  inset = 0,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  weight?: "hair" | "line";
  accent?: string;
  glow?: boolean;
  inset?: number;
  className?: string;
}) {
  const px = size === "sm" ? 8 : size === "lg" ? 20 : 14;
  const sw = weight === "hair" ? 1 : 1.5;
  const filter = glow ? `drop-shadow(0 0 4px ${accent}80)` : undefined;

  // Each bracket is an L made of two 1-1.5px strokes of length `px`.
  const base: React.CSSProperties = {
    position: "absolute",
    width: px,
    height: px,
    pointerEvents: "none",
    filter,
  };

  const strokeV: React.CSSProperties = {
    position: "absolute",
    background: accent,
    width: sw,
    height: px,
  };
  const strokeH: React.CSSProperties = {
    position: "absolute",
    background: accent,
    height: sw,
    width: px,
  };

  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      {/* top-left */}
      <div style={{ ...base, top: inset, left: inset }}>
        <div style={{ ...strokeV, top: 0, left: 0 }} />
        <div style={{ ...strokeH, top: 0, left: 0 }} />
      </div>
      {/* top-right */}
      <div style={{ ...base, top: inset, right: inset }}>
        <div style={{ ...strokeV, top: 0, right: 0 }} />
        <div style={{ ...strokeH, top: 0, right: 0 }} />
      </div>
      {/* bottom-left */}
      <div style={{ ...base, bottom: inset, left: inset }}>
        <div style={{ ...strokeV, bottom: 0, left: 0 }} />
        <div style={{ ...strokeH, bottom: 0, left: 0 }} />
      </div>
      {/* bottom-right */}
      <div style={{ ...base, bottom: inset, right: inset }}>
        <div style={{ ...strokeV, bottom: 0, right: 0 }} />
        <div style={{ ...strokeH, bottom: 0, right: 0 }} />
      </div>
    </div>
  );
}
