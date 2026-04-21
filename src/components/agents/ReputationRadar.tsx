"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface RadarAxis {
  label: string;
  value: number; // 0–100
  sub?: string;
}

interface ReputationRadarProps {
  axes: RadarAxis[]; // expects exactly 5
  accent?: string;
  accentSoft?: string;
}

// Project a value (0–100) along axis i onto SVG coords centered at (cx, cy)
function project(i: number, count: number, value: number, radius: number, cx: number, cy: number) {
  const angle = (Math.PI * 2 * i) / count - Math.PI / 2; // start at top
  const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
  return {
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
    // label position (just outside the max ring)
    lx: cx + Math.cos(angle) * (radius + 18),
    ly: cy + Math.sin(angle) * (radius + 18),
    // axis endpoint at 100%
    ax: cx + Math.cos(angle) * radius,
    ay: cy + Math.sin(angle) * radius,
  };
}

export default function ReputationRadar({
  axes,
  accent = "#38bdf8",
  accentSoft = "rgba(56,189,248,0.15)",
}: ReputationRadarProps) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;
  const rings = [0.25, 0.5, 0.75, 1.0];

  const points = useMemo(
    () => axes.map((a, i) => project(i, axes.length, a.value, radius, cx, cy)),
    [axes]
  );

  const polygonPath = points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

  const overall = Math.round(axes.reduce((sum, a) => sum + a.value, 0) / axes.length);

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Radar SVG */}
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Concentric rings */}
          {rings.map((r, ri) => {
            const ringPoints = axes
              .map((_, i) => {
                const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
                const rr = r * radius;
                return `${cx + Math.cos(angle) * rr},${cy + Math.sin(angle) * rr}`;
              })
              .join(" ");
            return (
              <polygon
                key={ri}
                points={ringPoints}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
            );
          })}

          {/* Axis spokes */}
          {points.map((p, i) => (
            <line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={p.ax}
              y2={p.ay}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}

          {/* Value polygon — animated draw + fill */}
          <motion.polygon
            points={polygonPath}
            fill={accentSoft}
            stroke={accent}
            strokeWidth={1.5}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Vertex dots with subtle glow */}
          {points.map((p, i) => (
            <motion.g
              key={`vertex-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            >
              <circle cx={p.x} cy={p.y} r={5} fill={accent} opacity={0.2} />
              <circle cx={p.x} cy={p.y} r={2.5} fill={accent} />
            </motion.g>
          ))}

          {/* Axis labels */}
          {points.map((p, i) => {
            const axis = axes[i];
            // Anchor tuned by horizontal position to avoid overflow
            let anchor: "start" | "middle" | "end" = "middle";
            if (p.lx < cx - 5) anchor = "end";
            else if (p.lx > cx + 5) anchor = "start";
            return (
              <text
                key={`label-${i}`}
                x={p.lx}
                y={p.ly}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-white/60"
                style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {axis.label}
              </text>
            );
          })}

          {/* Center score readout */}
          <g>
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white"
              style={{ fontSize: 26, fontWeight: 600 }}
            >
              {overall}
            </text>
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white/35"
              style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" }}
            >
              composite
            </text>
          </g>
        </svg>
      </div>

      {/* Axis breakdown list */}
      <div className="flex-1 w-full space-y-2.5">
        {axes.map((axis, i) => (
          <motion.div
            key={axis.label}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.07 }}
            className="flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-white/50 uppercase tracking-wider font-mono">{axis.label}</span>
                <span className="text-[12px] text-white font-medium tabular-nums">
                  {Math.round(axis.value)}
                  {axis.sub && <span className="text-white/30 text-[10px] ml-1 font-mono">{axis.sub}</span>}
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, axis.value)}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.07, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${accent}, ${accent}aa)` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
