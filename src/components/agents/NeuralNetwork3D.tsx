"use client";

import React, { useMemo } from "react";

// ── CSS keyframe animations ───────────────────────────────────────────────────
const globalStyles = `
  @keyframes floatZ {
    0%, 100% { transform: translateZ(0px); }
    50%       { transform: translateZ(25px); }
  }
  @keyframes shadowPulse {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50%       { transform: scale(1.4); opacity: 0.2; }
  }
  @keyframes linePulse {
    0%   { stroke-dashoffset: 100; opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { stroke-dashoffset: -20; opacity: 0; }
  }
  @keyframes coreGlow {
    0%, 100% { box-shadow: 0 0 40px 10px rgba(52, 211, 153, 0.4); }
    50%       { box-shadow: 0 0 80px 20px rgba(52, 211, 153, 0.8); }
  }
`;

// ── Color palettes ────────────────────────────────────────────────────────────
const PALETTES = {
  blue:    {
    top:  { top: "#38bdf8", south: "#0284c7", east: "#0369a1" },
    base: { top: "#1e3a8a", south: "#172554", east: "#1e40af" },
  },
  emerald: {
    top:     { top: "#34d399", south: "#059669", east: "#047857" },
    base:    { top: "#064e3b", south: "#022c22", east: "#065f46" },
    coreTop: { top: "#6ee7b7", south: "#10b981", east: "#059669" },
  },
  purple:  {
    top:  { top: "#c084fc", south: "#7e22ce", east: "#6b21a8" },
    base: { top: "#4c1d95", south: "#2e1065", east: "#5b21b6" },
  },
  slate:   {
    top:  { top: "#94a3b8", south: "#475569", east: "#334155" },
    base: { top: "#1e293b", south: "#0f172a", east: "#020617" },
  },
  cyan:    {
    top:  { top: "#67e8f9", south: "#0891b2", east: "#0e7490" },
    base: { top: "#164e63", south: "#083344", east: "#0c4a6e" },
  },
} as const;
type PaletteKey = keyof typeof PALETTES;

// ── Graph types ───────────────────────────────────────────────────────────────
interface GraphNode {
  id: string;
  x: number;
  y: number;
  label?: string;
  palette: PaletteKey;
  delay: number;
  scale: number;
  isCore?: boolean;
  isActive: boolean;
}

interface GraphEdge {
  from: string;
  to: string;
  speed: string;
  delay: string;
  isActive: boolean;
}

// ── Activity feed helpers ─────────────────────────────────────────────────────
export interface ActivityEntry {
  id?: number;
  phase: string;
  message: string;
  created_at: string;
  agent_wallet?: string;
}

const PHASE_COLORS: Record<string, string> = {
  processing:        "#38bdf8",
  completed:         "#34d399",
  error:             "#f87171",
  downloading_brief: "#818cf8",
  uploading:         "#c084fc",
  submitting:        "#fb923c",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Public props ──────────────────────────────────────────────────────────────
export interface NeuralNetwork3DProps {
  agentName?: string;
  tools?: { name: string; type: string }[];
  skills?: string[];
  subscriptions?: { id: string | number; status: string }[];
  activityLog?: ActivityEntry[];
  compact?: boolean;
}

// ── Layout constants ──────────────────────────────────────────────────────────
const CORE_POS = { x: 468, y: 468 };

// These positions mirror the original static design's m1/m2/m3/m4,
// which were tuned for the rotateX(60deg) rotateZ(-45deg) projection.
const AGG_BY_COUNT: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 468, y: 268 }],
  2: [{ x: 268, y: 268 }, { x: 668, y: 268 }],
  3: [{ x: 268, y: 268 }, { x: 668, y: 268 }, { x: 268, y: 668 }],
  4: [{ x: 268, y: 268 }, { x: 668, y: 268 }, { x: 268, y: 668 }, { x: 668, y: 668 }],
};

// Spread `count` tiny nodes in a radial fan from (cx, cy) pointing away from CORE_POS.
// spread of 0.6π keeps outer nodes well inside the 0-950 canvas bounds.
function radialFan(cx: number, cy: number, count: number): { x: number; y: number }[] {
  if (count === 0) return [];
  const base = Math.atan2(cy - CORE_POS.y, cx - CORE_POS.x);
  const spread = Math.PI * 0.6;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = base - spread / 2 + t * spread;
    const r = 130 + (i % 2) * 55;
    return {
      x: Math.round(Math.max(30, Math.min(930, cx + Math.cos(angle) * r))),
      y: Math.round(Math.max(30, Math.min(930, cy + Math.sin(angle) * r))),
    };
  });
}

// ── Graph builder ─────────────────────────────────────────────────────────────
function buildGraph(
  agentName: string,
  tools: { name: string; type: string }[],
  skills: string[],
  subscriptions: { id: string | number; status: string }[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Core — always present
  nodes.push({
    id: "core", x: CORE_POS.x, y: CORE_POS.y,
    label: agentName.length > 16 ? `${agentName.slice(0, 13)}…` : agentName,
    palette: "emerald", delay: 0, scale: 2.8, isCore: true, isActive: true,
  });

  interface Cat {
    id: string; label: string; palette: "blue" | "purple";
    items: { id: string; isActive: boolean }[];
  }

  const cats: Cat[] = [];

  const cappedTools = tools.slice(0, 8);
  const cappedSkills = skills.slice(0, 8);
  const cappedSubs = subscriptions.slice(0, 8);

  if (cappedTools.length > 0)
    cats.push({
      id: "agg_tools", label: `TOOLS · ${cappedTools.length}`, palette: "blue",
      items: cappedTools.map((_, i) => ({ id: `tn_tool_${i}`, isActive: true })),
    });

  if (cappedSkills.length > 0)
    cats.push({
      id: "agg_skills", label: `SKILLS · ${cappedSkills.length}`, palette: "blue",
      items: cappedSkills.map((_, i) => ({ id: `tn_skill_${i}`, isActive: true })),
    });

  if (cappedSubs.length > 0)
    cats.push({
      id: "agg_subs", label: `SUBS · ${cappedSubs.length}`, palette: "purple",
      items: cappedSubs.map((s, i) => ({
        id: `tn_sub_${i}`,
        isActive: s.status?.toLowerCase() === "active",
      })),
    });

  // Fall back to decorative placeholder nodes when the agent has no registered data yet
  const activeCats: Cat[] = cats.length > 0 ? cats : [
    { id: "agg_c1", label: "COMPUTE", palette: "blue",   items: Array.from({ length: 4 }, (_, i) => ({ id: `fn_c1_${i}`, isActive: false })) },
    { id: "agg_c2", label: "MEMORY",  palette: "blue",   items: Array.from({ length: 3 }, (_, i) => ({ id: `fn_c2_${i}`, isActive: false })) },
    { id: "agg_c3", label: "NETWORK", palette: "purple", items: Array.from({ length: 4 }, (_, i) => ({ id: `fn_c3_${i}`, isActive: false })) },
    { id: "agg_c4", label: "I/O",     palette: "purple", items: Array.from({ length: 3 }, (_, i) => ({ id: `fn_c4_${i}`, isActive: false })) },
  ];

  const slots = AGG_BY_COUNT[Math.min(activeCats.length, 4)] ?? AGG_BY_COUNT[4];

  activeCats.forEach((cat, ci) => {
    const slot = slots[ci];
    const aggActive = cat.items.some(it => it.isActive);

    nodes.push({
      id: cat.id, x: slot.x, y: slot.y, label: cat.label,
      palette: cat.palette, delay: ci * 0.3, scale: 1, isActive: aggActive,
    });

    // Aggregator → core edge; active if any child is active
    edges.push({ from: cat.id, to: "core", speed: "2s", delay: `${ci * 0.5}s`, isActive: aggActive });

    // Tiny nodes fanned around the aggregator
    const positions = radialFan(slot.x, slot.y, cat.items.length);
    cat.items.forEach((item, ii) => {
      const pos = positions[ii];
      const tinyPalette: PaletteKey = item.isActive
        ? (cat.palette === "blue" ? "cyan" : "purple")
        : "slate";

      nodes.push({
        id: item.id, x: pos.x, y: pos.y, palette: tinyPalette,
        delay: ((ci * 8 + ii) * 0.137) % 1.5,
        scale: 0.5, isActive: item.isActive,
      });

      edges.push({
        from: item.id, to: cat.id, speed: "1.5s",
        delay: `${((ii * 0.2) % 1.2).toFixed(1)}s`, isActive: item.isActive,
      });
    });
  });

  // Cross-connections between neighbouring aggregators (decorative)
  for (let i = 0; i < activeCats.length - 1; i++) {
    edges.push({
      from: activeCats[i].id, to: activeCats[i + 1].id,
      speed: "3s", delay: `${(i * 0.7).toFixed(1)}s`, isActive: false,
    });
  }

  // A few active tiny-node → core shortcuts for visual richness
  const activeTiny = nodes.filter(n => !n.isCore && n.scale === 0.5 && n.isActive);
  const crossPicks = Math.min(3, Math.floor(activeTiny.length / 3));
  for (let i = 0; i < crossPicks; i++) {
    const pick = activeTiny[i * Math.floor(activeTiny.length / Math.max(1, crossPicks))];
    if (pick) {
      edges.push({
        from: pick.id, to: "core", speed: "2.5s",
        delay: `${(i * 0.6).toFixed(1)}s`, isActive: true,
      });
    }
  }

  return { nodes, edges };
}

// ── Isometric 3D slab ─────────────────────────────────────────────────────────
function IsometricSlab({
  zOffset, height, size = 64, colors,
}: {
  zOffset: number; height: number; size?: number;
  colors: { top: string; south: string; east: string };
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: size, height: size, left: "50%", top: "50%",
        transform: `translate3d(-50%, -50%, ${zOffset}px)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div className="absolute inset-0 border border-[#0f172a]"
        style={{ background: colors.top, transform: `translateZ(${height}px)` }} />
      <div className="absolute top-full left-0 border border-[#0f172a] origin-top"
        style={{ width: `${size}px`, height: `${height}px`, background: colors.south,
          transform: `translateZ(${height}px) rotateX(-90deg)` }} />
      <div className="absolute top-0 left-full border border-[#0f172a] origin-left"
        style={{ width: `${height}px`, height: `${size}px`, background: colors.east,
          transform: `translateZ(${height}px) rotateY(90deg)` }} />
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function NeuralNetwork3D({
  agentName = "0G NEURAL CORE",
  tools = [],
  skills = [],
  subscriptions = [],
  activityLog = [],
  compact = false,
}: NeuralNetwork3DProps) {
  const { nodes, edges } = useMemo(
    () => buildGraph(agentName, tools, skills, subscriptions),
    [agentName, tools, skills, subscriptions],
  );

  return (
    <div className="w-full bg-[#060913] font-sans">
      <style>{globalStyles}</style>

      {/* 3-D scene */}
      <div
        className="relative w-full overflow-hidden flex items-center justify-center"
        style={{ height: compact ? "360px" : "480px" }}
      >

      {/* Radial vignette — 65% keeps outer nodes readable */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{ background: "radial-gradient(circle at center, transparent 0%, #060913 65%)" }}
      />

      {/* Isometric 3-D scene */}
      <div
        className="relative"
        style={{
          width: "1000px", height: "1000px",
          transform: `scale(${compact ? 0.52 : 0.8}) rotateX(60deg) rotateZ(-45deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Holographic grid floor */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,0.04) 2px, transparent 2px), linear-gradient(90deg, rgba(56,189,248,0.04) 2px, transparent 2px)",
            backgroundSize: "50px 50px",
            border: "1px solid rgba(56,189,248,0.1)",
            boxShadow: "inset 0 0 100px rgba(6,9,19,0.9)",
          }}
        />

        {/* ── Edge layer (SVG, flat on the floor) ── */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ overflow: "visible", transform: "translateZ(0)" }}
        >
          {edges.map((edge, i) => {
            const src = nodes.find(n => n.id === edge.from);
            const tgt = nodes.find(n => n.id === edge.to);
            if (!src || !tgt) return null;

            const sx = src.x + 32, sy = src.y + 32;
            const tx = tgt.x + 32, ty = tgt.y + 32;
            const d = `M ${sx} ${sy} L ${tx} ${ty}`;

            return (
              <g key={`e${i}`}>
                {/* Static track */}
                <path
                  d={d} fill="none"
                  stroke={edge.isActive ? "rgba(56,189,248,0.18)" : "rgba(30,58,138,0.25)"}
                  strokeWidth="2"
                />
                {/* Animated light pulse */}
                <path
                  d={d} fill="none"
                  stroke={edge.isActive ? "#38bdf8" : "#1e3a8a"}
                  strokeWidth={edge.isActive ? "3" : "1.5"}
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray={edge.isActive ? "15 85" : "6 94"}
                  style={{
                    filter: edge.isActive ? "drop-shadow(0 0 8px #38bdf8)" : "none",
                    opacity: edge.isActive ? 1 : 0.45,
                    animation: `linePulse ${edge.speed} linear infinite ${edge.delay}`,
                  }}
                />
              </g>
            );
          })}

          {/* Floor connector sockets */}
          {nodes.map(n => (
            <circle
              key={`sock-${n.id}`}
              cx={n.x + 32} cy={n.y + 32}
              r={n.isCore ? "16" : n.scale >= 1 ? "6" : "4"}
              fill="#060913"
              stroke={n.isActive ? "#22d3ee" : "#1e3a8a"}
              strokeWidth="2"
              style={{ filter: n.isActive ? "drop-shadow(0 0 5px rgba(34,211,238,0.5))" : "none" }}
            />
          ))}
        </svg>

        {/* ── 3-D node layer ── */}
        {nodes.map(node => {
          const pal = PALETTES[node.palette] as any;

          return (
            <div
              key={node.id}
              className="absolute w-16 h-16"
              style={{ left: node.x, top: node.y, transformStyle: "preserve-3d" }}
            >
              {/* Dynamic floor shadow */}
              <div
                className="absolute inset-0 bg-black blur-[15px] rounded-full"
                style={{
                  transform: `translateZ(-2px) scale(${node.scale * 1.5})`,
                  animation: `shadowPulse 4s ease-in-out infinite ${node.delay}s`,
                }}
              />

              {/* Vertical tether: floor → floating node */}
              <div
                className="absolute left-[32px] top-[32px] w-[2px] pointer-events-none"
                style={{
                  height: "100px",
                  background: node.isActive
                    ? "linear-gradient(to top, rgba(34,211,238,0.8), transparent)"
                    : "linear-gradient(to top, rgba(30,58,138,0.5), transparent)",
                  transform: "translate(-50%, -100%) rotateX(-90deg)",
                  transformOrigin: "bottom",
                  boxShadow: node.isActive ? "0 0 10px rgba(34,211,238,0.5)" : "none",
                  filter: "blur(0.5px)",
                }}
              />

              {/* Floating body (scale + float animation) */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${node.scale})`,
                  animation: `floatZ 4s ease-in-out infinite ${node.delay}s`,
                  transformStyle: "preserve-3d",
                }}
              >
                {node.isCore ? (
                  <>
                    <IsometricSlab zOffset={0}  height={24} size={76} colors={pal.base} />
                    <IsometricSlab zOffset={24} height={16} size={60} colors={pal.top} />
                    <IsometricSlab zOffset={40} height={12} size={44} colors={pal.coreTop} />
                    <div
                      className="absolute left-1/2 top-1/2 rounded-full bg-emerald-300"
                      style={{
                        width: "24px", height: "24px",
                        transform: "translate3d(-50%, -50%, 60px)",
                        animation: "coreGlow 3s infinite alternate",
                      }}
                    />
                  </>
                ) : (
                  <>
                    <IsometricSlab zOffset={0}  height={12} size={64} colors={pal.base} />
                    <IsometricSlab zOffset={12} height={12} size={64} colors={pal.top} />
                    {/* Status dot — bright if active */}
                    <div
                      className="absolute left-1/2 top-1/2 rounded-full"
                      style={{
                        width: "6px", height: "6px",
                        background: node.isActive ? "#67e8f9" : "#475569",
                        transform: "translate3d(-50%, -50%, 28px)",
                        boxShadow: node.isActive ? "0 0 15px 5px rgba(34,211,238,0.4)" : "none",
                      }}
                    />
                  </>
                )}

                {/* Anti-rotation label (aggregators + core only) */}
                {node.label && (
                  <div
                    className="absolute left-1/2 top-1/2 flex items-center justify-center pointer-events-none"
                    style={{
                      transform: `translate3d(-50%, -50%, ${node.isCore ? 120 : 60}px) rotateZ(45deg) rotateX(-60deg)`,
                    }}
                  >
                    <div
                      className="bg-[#0f172a]/90 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg whitespace-nowrap shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
                      style={{ transform: `scale(${1 / node.scale})` }}
                    >
                      <span className={`font-mono font-bold tracking-widest uppercase ${node.isCore ? "text-emerald-400 text-sm" : "text-white text-xs"}`}>
                        {node.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>{/* end 3-D scene */}

      {/* Activity feed — section below the 3D scene */}
      {activityLog.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
              Runtime Activity
            </span>
            <span className="text-[9px] text-white/20">{activityLog.length} events</span>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {activityLog.slice(0, 20).map((entry, i) => {
              const color = PHASE_COLORS[entry.phase] ?? "#94a3b8";
              return (
                <div
                  key={entry.id ?? i}
                  className="flex items-start gap-2.5 px-4 py-1.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0"
                    style={{ background: color, boxShadow: `0 0 5px ${color}80` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-mono uppercase tracking-wider font-semibold"
                        style={{ color }}
                      >
                        {entry.phase}
                      </span>
                      <span className="text-[9px] text-white/20 ml-auto flex-shrink-0">
                        {timeAgo(entry.created_at)}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/45 leading-tight truncate mt-0.5">
                      {entry.message}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="h-2" />
          </div>
        </div>
      )}
    </div>
  );
}
