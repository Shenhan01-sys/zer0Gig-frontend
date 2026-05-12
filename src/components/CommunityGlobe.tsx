"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, Globe2, Sparkles, X, Briefcase, Cpu } from "lucide-react";
import { COUNTRIES, COUNTRIES_BY_CODE } from "@/lib/countries";
import { OG_MODELS, getModelById } from "@/lib/og-models";

// react-globe.gl uses three.js — must run client-side only.
const Globe = dynamic(() => import("react-globe.gl").then(m => m.default), { ssr: false });

interface CountryRow {
  country_code: string;
  country_name: string;
  latitude: number;
  longitude: number;
  signup_count: number;
  clients_count?: number;
  agent_owners_count?: number;
}

interface ModelRow {
  preferred_model: string;
  signup_count: number;
}

interface StatsResponse {
  ok: boolean;
  total: number;
  countries: number;
  clients: number;
  agentOwners: number;
  byCountry: CountryRow[];
  byModel: ModelRow[];
}

interface MemberRow {
  display_name: string;
  role: "client" | "agent_owner";
  preferred_model: string;
  wallet_preview: string;
  created_at: string;
  country_name: string;
}

const SAMPLE_STATS: StatsResponse = {
  ok: true, total: 0, countries: 0, clients: 0, agentOwners: 0, byCountry: [], byModel: [],
};

const COLOR_CLIENT      = "#38bdf8"; // cyan
const COLOR_AGENT_OWNER = "#34d399"; // emerald
const COLOR_SEED        = "#a78bfa"; // soft violet — non-data placeholder

// Interpolate between cyan (clients dominant) and emerald (agent owners dominant).
// `ownerRatio` is agent_owners / total (0 = all clients, 1 = all agent owners).
function blendRoleColor(ownerRatio: number): string {
  const r1 = 56,  g1 = 189, b1 = 248; // cyan #38bdf8
  const r2 = 52,  g2 = 211, b2 = 153; // emerald #34d399
  const t = Math.min(1, Math.max(0, ownerRatio));
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Auto-rotate config — OrbitControls.autoRotateSpeed. Default value of 2.0
// gives ~30s per revolution; 0.6 gives ~100s per revolution which reads as
// a slow, intentional drift rather than a spin. Bump if more visible motion
// is wanted.
const AUTO_ROTATE_SPEED = 0.6;

export default function CommunityGlobe() {
  const [stats, setStats] = useState<StatsResponse>(SAMPLE_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  // react-globe.gl forwards an underlying THREE.OrbitControls + camera ref via the .controls() method
  // We use any here because the lib doesn't fully export its instance type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [size, setSize] = useState({ w: 560, h: 560 });

  // Fetch aggregated stats
  useEffect(() => {
    fetch("/api/onboarding/stats")
      .then(r => r.json())
      .then((j: StatsResponse) => { if (j.ok) setStats(j); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const e = entries[0];
      if (!e) return;
      const w = Math.max(320, Math.min(640, e.contentRect.width));
      setSize({ w, h: w });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-rotate + camera POV.
  //
  // react-globe.gl is loaded dynamically (next/dynamic, ssr:false) and three.js
  // is initialised inside an effect AFTER the React ref is populated. On the
  // first commit, `globeRef.current.controls()` may return undefined. We poll
  // every 100ms (up to 5s) until the OrbitControls instance exists, then wire
  // up auto-rotate + initial point-of-view in one shot.
  useEffect(() => {
    let cancelled  = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const setupControls = () => {
      const g = globeRef.current;
      if (!g) return false;
      const controls = g.controls?.();
      if (!controls) return false;
      controls.autoRotate      = true;
      controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
      controls.enableZoom      = false;
      g.pointOfView?.({ lat: 5, lng: 110, altitude: 2.4 }, 1500);
      return true;
    };

    if (setupControls()) return;

    let attempts = 0;
    intervalId = setInterval(() => {
      attempts++;
      if (cancelled || setupControls() || attempts > 50) {
        if (intervalId) clearInterval(intervalId);
      }
    }, 100);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Click → fetch members for that country
  useEffect(() => {
    if (!selectedCountry) return;
    setMembers(null);
    setMembersLoading(true);
    fetch(`/api/onboarding/country?code=${selectedCountry}`)
      .then(r => r.json())
      .then(j => {
        if (j.ok) setMembers(j.members);
        else setMembers([]);
      })
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  }, [selectedCountry]);

  // Pause/resume auto-rotate when modal opens
  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (!controls) return;
    controls.autoRotate = !selectedCountry;
  }, [selectedCountry]);

  // Build ONE flat dot per country. Color blends cyan→emerald based on the
  // share of agent owners. Keeps every signup at the exact same lat/lng so
  // nothing visually scatters.
  const allPoints = useMemo(() => {
    if (stats.byCountry.length === 0) {
      // Demo seed pattern — small flat dots in target markets so the section
      // never looks empty during pre-launch.
      const seedCodes = ["ID", "SG", "MY", "VN", "IN", "JP", "US", "DE", "GB", "BR"];
      return seedCodes
        .map(code => COUNTRIES_BY_CODE[code])
        .filter(Boolean)
        .map(c => ({
          lat: c!.lat, lng: c!.lng,
          countryCode: c!.code, countryName: c!.name,
          totalCount: 0, clientCount: 0, ownerCount: 0,
          color: COLOR_SEED, radius: 0.42, altitude: 0.012,
          isSeed: true,
        }));
    }

    const maxCount = Math.max(...stats.byCountry.map(c => c.signup_count));
    const scaleRadius = (n: number) => 0.35 + (n / maxCount) * 0.55;

    return stats.byCountry.map(c => {
      const clientCount = c.clients_count ?? 0;
      const ownerCount  = c.agent_owners_count ?? 0;
      const total       = clientCount + ownerCount;
      const ownerRatio  = total === 0 ? 0 : ownerCount / total;
      return {
        lat: Number(c.latitude),
        lng: Number(c.longitude),
        countryCode: c.country_code,
        countryName: c.country_name,
        totalCount: total,
        clientCount,
        ownerCount,
        color: blendRoleColor(ownerRatio),
        radius: scaleRadius(c.signup_count),
        altitude: 0.012,
        isSeed: false,
      };
    });
  }, [stats.byCountry]);

  // Animated arcs — agent_owner → client. Visualizes agents "running" jobs
  // between regions. Stays subtle: thin stroke, low opacity, dashed.
  type Arc = {
    startLat: number; startLng: number; endLat: number; endLng: number;
    color: [string, string];
  };
  const arcs: Arc[] = useMemo(() => {
    // No real signups → use a demo pattern so the animation still plays
    if (stats.byCountry.length === 0) {
      const pairs: Array<[string, string]> = [
        ["JP", "ID"], ["SG", "MY"], ["DE", "GB"],
        ["US", "BR"], ["IN", "VN"],
      ];
      const out: Arc[] = [];
      for (const [from, to] of pairs) {
        const a = COUNTRIES_BY_CODE[from];
        const b = COUNTRIES_BY_CODE[to];
        if (!a || !b) continue;
        out.push({
          startLat: a.lat, startLng: a.lng,
          endLat:   b.lat, endLng:   b.lng,
          color:    [COLOR_AGENT_OWNER, COLOR_CLIENT],
        });
      }
      return out;
    }

    const ownerCountries  = stats.byCountry.filter(c => (c.agent_owners_count ?? 0) > 0);
    const clientCountries = stats.byCountry.filter(c => (c.clients_count ?? 0) > 0);
    if (ownerCountries.length === 0 || clientCountries.length === 0) return [];

    // For each agent owner country, pair with up to 2 client countries.
    // Cap at 12 arcs total to keep the visual subtle.
    const out: Arc[] = [];
    let i = 0;
    for (const owner of ownerCountries) {
      const targets = clientCountries
        .filter(c => c.country_code !== owner.country_code)
        .slice(0, 2);
      for (const t of targets) {
        out.push({
          startLat: Number(owner.latitude),
          startLng: Number(owner.longitude),
          endLat:   Number(t.latitude),
          endLng:   Number(t.longitude),
          color:    [COLOR_AGENT_OWNER, COLOR_CLIENT],
        });
        if (++i >= 12) return out;
      }
    }
    return out;
  }, [stats.byCountry]);

  const topCountries = useMemo(
    () => [...stats.byCountry].sort((a, b) => b.signup_count - a.signup_count).slice(0, 6),
    [stats.byCountry],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointClick = useCallback((point: any) => {
    if (!point?.countryCode || point.isSeed) return;
    setSelectedCountry(point.countryCode);
  }, []);

  return (
    <section className="relative w-full bg-black py-24 px-6 overflow-hidden border-y border-white/[0.04]">
      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/55 mb-5 font-mono uppercase tracking-widest">
            <Globe2 className="w-3.5 h-3.5" />
            Global Community
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium mb-3 text-white">
            The Agentic Economy is Going Global
          </h2>
          <p className="text-white/55 text-[15px] max-w-2xl mx-auto">
            Builders, clients, and agent owners from around the world have already joined zer0Gig.
            Click any country on the globe to see who&apos;s there.
          </p>
        </motion.div>

        {/* Top metric strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          <Stat label="Total Sign-ups"  value={stats.total.toLocaleString()}     accent="white"   />
          <Stat label="Countries"       value={stats.countries.toLocaleString()} accent="cyan"    />
          <Stat label="Clients"         value={stats.clients.toLocaleString()}   accent="cyan"    />
          <Stat label="Agent Owners"    value={stats.agentOwners.toLocaleString()} accent="emerald" />
        </div>

        {/* Globe + side panels */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Globe card */}
          <div
            ref={containerRef}
            className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0f1a2e]/60 to-[#0d1525]/40 overflow-hidden min-h-[420px] flex items-center justify-center p-4"
          >
            <Globe
              ref={globeRef}
              width={size.w}
              height={size.h}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe@2.41.4/example/img/earth-blue-marble.jpg"
              bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe@2.41.4/example/img/earth-topology.png"
              showAtmosphere
              atmosphereColor="#7dd3fc"
              atmosphereAltitude={0.22}
              pointsData={allPoints}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pointAltitude={(d: any) => d.altitude}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pointColor={(d: any) => d.color}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pointRadius={(d: any) => d.radius}
              pointsMerge={false}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pointLabel={(d: any) => {
                if (d.isSeed) {
                  return `<div style="background:#0d1525;border:1px solid rgba(255,255,255,0.12);padding:8px 12px;border-radius:8px;color:#fff;font-family:system-ui;font-size:12px;min-width:160px;">
                      <div style="font-weight:600;">${d.countryName}</div>
                      <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:3px;">Be the first from here</div>
                    </div>`;
                }
                return `<div style="background:#0d1525;border:1px solid rgba(255,255,255,0.12);padding:10px 12px;border-radius:8px;color:#fff;font-family:system-ui;font-size:12px;min-width:180px;">
                    <div style="font-weight:600;font-size:13px;">${d.countryName}</div>
                    <div style="display:flex;gap:10px;margin-top:6px;font-size:11px;">
                      <span style="color:#38bdf8;"><b>${d.clientCount}</b> client${d.clientCount === 1 ? "" : "s"}</span>
                      <span style="color:#34d399;"><b>${d.ownerCount}</b> agent owner${d.ownerCount === 1 ? "" : "s"}</span>
                    </div>
                    <div style="color:rgba(255,255,255,0.35);font-size:10px;margin-top:8px;font-family:monospace;">
                      click to view members
                    </div>
                  </div>`;
              }}
              onPointClick={handlePointClick}
              enablePointerInteraction
              // ── Agent → Client arcs (subtle, animated dash) ──
              arcsData={arcs}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              arcStartLat={(d: any) => d.startLat}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              arcStartLng={(d: any) => d.startLng}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              arcEndLat={(d: any) => d.endLat}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              arcEndLng={(d: any) => d.endLng}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              arcColor={(d: any) => d.color}
              arcStroke={0.18}
              arcAltitudeAutoScale={0.35}
              arcDashLength={0.18}
              arcDashGap={0.6}
              arcDashAnimateTime={3200}
              arcsTransitionDuration={0}
            />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-2 rounded-full bg-[#0d1525]/85 border border-white/10 backdrop-blur-sm text-[11px] text-white/65">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR_CLIENT }} aria-hidden />
                Client
              </span>
              <span className="text-white/15">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR_AGENT_OWNER }} aria-hidden />
                Agent Owner
              </span>
            </div>

            {/* Auto-rotate hint */}
            <div className="absolute bottom-4 right-4 text-[10px] text-white/30 font-mono uppercase tracking-widest">
              auto-rotating · click to inspect
            </div>

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#050810]/40 pointer-events-none">
                <p className="text-white/40 text-[12px] font-mono uppercase tracking-widest">Loading globe…</p>
              </div>
            )}
          </div>

          {/* Side panels */}
          <div className="flex flex-col gap-6">
            <Panel title="Top Countries" icon={<Users className="w-4 h-4 text-white/45" />}>
              {topCountries.length === 0 ? (
                <p className="text-white/40 text-[13px]">No signups yet — be the first.</p>
              ) : (
                <ul className="space-y-2.5">
                  {topCountries.map((c, idx) => {
                    const country = COUNTRIES_BY_CODE[c.country_code];
                    return (
                      <li key={c.country_code}>
                        <button
                          onClick={() => setSelectedCountry(c.country_code)}
                          className="w-full flex items-center justify-between gap-3 hover:bg-white/[0.03] rounded-lg px-1.5 py-1 -mx-1.5 transition-colors"
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span className="text-white/30 text-[11px] font-mono w-5 tabular-nums">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="text-base leading-none">{country?.flag ?? "🌐"}</span>
                            <span className="text-white text-[13px] truncate">{c.country_name}</span>
                          </span>
                          <span className="text-white/55 text-[13px] font-mono tabular-nums shrink-0">
                            {c.signup_count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel title="Preferred Models" icon={<Sparkles className="w-4 h-4 text-white/45" />}>
              {stats.byModel.length === 0 ? (
                <ul className="space-y-2.5">
                  {OG_MODELS.slice(0, 5).map((m, idx) => (
                    <li key={m.id} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="text-white/30 text-[11px] font-mono w-5 tabular-nums">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-white/80 text-[13px] truncate">{m.name}</span>
                      </span>
                      <span className="text-white/30 text-[11px] font-mono shrink-0">{m.tier}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-2.5">
                  {stats.byModel.map((row, idx) => {
                    const m = getModelById(row.preferred_model);
                    return (
                      <li key={row.preferred_model} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className="text-white/30 text-[11px] font-mono w-5 tabular-nums">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-white text-[13px] truncate">
                            {m?.name ?? row.preferred_model}
                          </span>
                        </span>
                        <span className="text-white/55 text-[13px] font-mono tabular-nums shrink-0">
                          {row.signup_count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Link
              href="/onboarding"
              className="group rounded-2xl border border-white/15 bg-white text-black px-5 py-4 hover:bg-white/90 transition-colors flex items-center justify-between gap-3"
            >
              <span>
                <p className="text-[14px] font-semibold">Join the Community</p>
                <p className="text-[11px] text-black/55 mt-0.5">Pin yourself on the globe</p>
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Country members modal */}
      <AnimatePresence>
        {selectedCountry && (
          <CountryMembersModal
            countryCode={selectedCountry}
            members={members}
            loading={membersLoading}
            onClose={() => setSelectedCountry(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ── modal ────────────────────────────────────────────────────────────────────

function CountryMembersModal({
  countryCode, members, loading, onClose,
}: {
  countryCode: string;
  members: MemberRow[] | null;
  loading: boolean;
  onClose: () => void;
}) {
  const country = COUNTRIES_BY_CODE[countryCode];

  // Lock scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="w-full sm:max-w-lg max-h-[85vh] bg-[#0d1525]/95 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl leading-none">{country?.flag ?? "🌐"}</span>
            <div className="min-w-0">
              <p className="text-white font-medium text-[16px] truncate">{country?.name ?? countryCode}</p>
              <p className="text-white/40 text-[12px] font-mono uppercase tracking-widest">
                {loading ? "Loading…" : `${members?.length ?? 0} member${(members?.length ?? 0) === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading && (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-xl border border-white/5 bg-[#050810]/40 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && members && members.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-white/40 text-[13px]">No public members yet from this region.</p>
              <Link
                href="/onboarding"
                onClick={onClose}
                className="text-[#38bdf8] text-[13px] mt-3 inline-block hover:underline"
              >
                Be the first →
              </Link>
            </div>
          )}

          {!loading && members && members.length > 0 && (
            <ul className="space-y-2">
              {members.map((m, i) => {
                const model = getModelById(m.preferred_model);
                const isClient = m.role === "client";
                return (
                  <li
                    key={`${m.wallet_preview}-${i}`}
                    className="rounded-xl border border-white/[0.06] bg-[#050810]/60 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-white font-medium text-[14px] truncate">{m.display_name}</span>
                      <span
                        className={`text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border ${
                          isClient
                            ? "border-cyan-400/40 text-cyan-300 bg-cyan-400/[0.06]"
                            : "border-emerald-400/40 text-emerald-300 bg-emerald-400/[0.06]"
                        }`}
                      >
                        {isClient ? "Client" : "Agent Owner"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/40 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {m.wallet_preview}
                      </span>
                      {model && (
                        <span className="inline-flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          {model.name}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── presentational atoms ─────────────────────────────────────────────────────

function Stat({
  label, value, accent,
}: {
  label: string;
  value: string;
  accent: "white" | "cyan" | "emerald" | "violet";
}) {
  const accentColor =
    accent === "cyan"    ? "text-cyan-300"    :
    accent === "emerald" ? "text-emerald-300" :
    accent === "violet"  ? "text-violet-300"  :
                           "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 px-5 py-4">
      <p className="text-white/35 text-[10px] uppercase tracking-widest mb-1 font-medium">{label}</p>
      <p className={`${accentColor} text-2xl font-semibold tabular-nums`}>{value}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5">
      <div className="flex items-center gap-2 mb-3.5">
        {icon}
        <p className="text-white/85 text-[12px] uppercase tracking-widest font-medium">{title}</p>
      </div>
      {children}
    </div>
  );
}
