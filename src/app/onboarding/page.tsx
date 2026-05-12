"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { Check, ChevronRight, ChevronLeft, Wallet, Globe2, Cpu, Sparkles, ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import { OG_MODELS, DEFAULT_MODEL_ID, type OGModel } from "@/lib/og-models";
import { COUNTRIES, type Country } from "@/lib/countries";

type Role = "client" | "agent_owner";

const STEPS = [
  { id: 0, label: "Connect",  icon: Wallet  },
  { id: 1, label: "Profile",  icon: Globe2  },
  { id: 2, label: "AI Model", icon: Cpu     },
  { id: 3, label: "Confirm",  icon: Sparkles },
] as const;

// Clients don't need to pick an AI model — that's an agent-owner concern.
// They get DEFAULT_MODEL_ID under the hood so the Supabase row stays
// well-formed, but the picker is hidden from the flow.
function visibleStepsFor(role: Role | null) {
  return role === "client" ? STEPS.filter(s => s.id !== 2) : STEPS;
}
function nextStepFrom(current: number, role: Role | null): number {
  const v = visibleStepsFor(role);
  const i = v.findIndex(s => s.id === current);
  return v[Math.min(i + 1, v.length - 1)].id;
}
function prevStepFrom(current: number, role: Role | null): number {
  const v = visibleStepsFor(role);
  const i = v.findIndex(s => s.id === current);
  return v[Math.max(i - 1, 0)].id;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { ready, authenticated, user, login } = usePrivy();
  const walletAddress = (user?.wallet?.address ?? "").toLowerCase();

  const [step, setStep] = useState(0);

  // Form state
  const [displayName,   setDisplayName]   = useState("");
  const [role,          setRole]          = useState<Role | null>(null);
  const [countryCode,   setCountryCode]   = useState("");
  const [countryQuery,  setCountryQuery]  = useState("");
  const [modelId,       setModelId]       = useState<string>(DEFAULT_MODEL_ID);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-advance once wallet connects on step 0. If the wallet already has a
  // Supabase signup row, bypass the entire flow and drop the user straight
  // onto the landing page — they've already onboarded.
  useEffect(() => {
    if (step !== 0 || !ready || !authenticated || !walletAddress) return;
    (async () => {
      try {
        const res = await fetch(`/api/onboarding/signup?wallet=${walletAddress}`);
        const json = await res.json();
        if (json.ok && json.exists) {
          router.replace("/?welcome=1");
          return;
        }
      } catch {
        // Network failure — fall through to step 1 so the user can still onboard.
      }
      setStep(1);
    })();
  }, [step, ready, authenticated, walletAddress, router]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [countryQuery]);

  const canNextFromProfile = displayName.trim().length >= 2 && !!role && !!countryCode;
  const canSubmit = canNextFromProfile && !!modelId;

  async function submit() {
    if (!canSubmit || !walletAddress) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          walletAddress,
          role,
          preferredModel: modelId,
          countryCode,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Submission failed");
      // Success → redirect to landing with welcome flag
      router.push("/?welcome=1");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#050810] text-white font-sans">
      {/* Top bar */}
      <header className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <Link href="/" className="text-white/80 hover:text-white text-sm tracking-wide">
          ← zer0Gig
        </Link>
        <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Community Onboarding</p>
      </header>

      {/* Step indicator */}
      <div className="px-6 py-8 flex items-center justify-center">
        <ol className="flex items-center gap-2 sm:gap-3">
          {(() => {
            const visible = visibleStepsFor(role);
            const currentIdx = visible.findIndex(s => s.id === step);
            return visible.map((s, i) => {
              const Icon   = s.icon;
              const active = s.id === step;
              const done   = currentIdx !== -1 && i < currentIdx;
              return (
                <li key={s.id} className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all
                      ${active ? "bg-white text-black border-white" :
                        done   ? "bg-emerald-500/10 text-emerald-400 border-emerald-400/40" :
                                 "bg-[#0d1525]/90 text-white/40 border-white/10"}
                    `}
                  >
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`hidden sm:inline text-[12px] font-medium tracking-wide
                    ${active ? "text-white" : done ? "text-emerald-400" : "text-white/35"}`}>
                    {s.label}
                  </span>
                  {i < visible.length - 1 && (
                    <span className={`w-6 sm:w-10 h-px ${done ? "bg-emerald-400/40" : "bg-white/10"}`} aria-hidden />
                  )}
                </li>
              );
            });
          })()}
        </ol>
      </div>

      {/* Step container */}
      <div className="flex-1 px-6 pb-16 flex items-start justify-center">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <StepCard key="0">
                <h1 className="text-3xl sm:text-4xl font-medium mb-2">Welcome to zer0Gig.</h1>
                <p className="text-white/55 text-[15px] mb-8 max-w-xl">
                  Join the community of AI agent builders and clients shaping the agentic economy on 0G.
                  We'll record your identity, role, and preferred 0G Compute model — and pin you on the global map.
                </p>

                <button
                  onClick={() => login()}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
                  disabled={!ready}
                >
                  <Wallet className="w-4 h-4" />
                  {ready ? "Connect Wallet to Continue" : "Loading…"}
                </button>

                {!ready && <p className="text-white/30 text-xs mt-3">Initializing Privy…</p>}
                {ready && authenticated && (
                  <p className="text-emerald-400 text-xs mt-3">Connected as {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</p>
                )}
              </StepCard>
            )}

            {step === 1 && (
              <StepCard key="1">
                <h1 className="text-3xl sm:text-4xl font-medium mb-2">Tell us about you.</h1>
                <p className="text-white/55 text-[15px] mb-8">
                  Initials are fine. We use this on the leaderboard and the community globe.
                </p>

                <Field label="Display name or initials">
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value.slice(0, 64))}
                    placeholder="e.g. Hans, or HG"
                    className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-[15px] focus:border-white/30 focus:outline-none transition-colors"
                  />
                  <p className="text-white/30 text-[11px] mt-1.5">Wallet: {walletAddress.slice(0, 10)}…{walletAddress.slice(-6)}</p>
                </Field>

                <Field label="Role">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <RoleCard
                      active={role === "client"}
                      onClick={() => setRole("client")}
                      title="Client"
                      subtitle="I want to hire AI agents"
                      meta="post jobs · create subscriptions"
                    />
                    <RoleCard
                      active={role === "agent_owner"}
                      onClick={() => setRole("agent_owner")}
                      title="Agent Owner"
                      subtitle="I own AI agents"
                      meta="mint iNFTs · earn from work"
                    />
                  </div>
                </Field>

                <Field label="Country / Region">
                  <input
                    value={countryQuery}
                    onChange={e => setCountryQuery(e.target.value)}
                    placeholder="Search countries…"
                    className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-[15px] focus:border-white/30 focus:outline-none transition-colors mb-3"
                  />
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0d1525]/90 divide-y divide-white/[0.04]">
                    {filteredCountries.map(c => (
                      <CountryRow
                        key={c.code}
                        country={c}
                        active={countryCode === c.code}
                        onClick={() => setCountryCode(c.code)}
                      />
                    ))}
                    {filteredCountries.length === 0 && (
                      <p className="px-4 py-3 text-white/40 text-[13px]">No matches</p>
                    )}
                  </div>
                </Field>

                <Nav
                  onBack={() => setStep(prevStepFrom(1, role))}
                  onNext={() => setStep(nextStepFrom(1, role))}
                  canNext={canNextFromProfile}
                />
              </StepCard>
            )}

            {step === 2 && (
              <StepCard key="2">
                <h1 className="text-3xl sm:text-4xl font-medium mb-2">Pick your AI model.</h1>
                <p className="text-white/55 text-[15px] mb-8">
                  Live on the 0G Compute testnet. You can change this later — it's a preference, not a commitment.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {OG_MODELS.map(m => (
                    <ModelCard
                      key={m.id}
                      model={m}
                      active={modelId === m.id}
                      onClick={() => setModelId(m.id)}
                    />
                  ))}
                </div>

                <Nav
                  onBack={() => setStep(prevStepFrom(2, role))}
                  onNext={() => setStep(nextStepFrom(2, role))}
                  canNext={!!modelId}
                />
              </StepCard>
            )}

            {step === 3 && (
              <StepCard key="3">
                <h1 className="text-3xl sm:text-4xl font-medium mb-2">Looks good?</h1>
                <p className="text-white/55 text-[15px] mb-8">
                  We'll save this to Supabase and pin you on the globe. You can update anytime by re-running onboarding.
                </p>

                <SummaryGrid
                  walletAddress={walletAddress}
                  displayName={displayName}
                  role={role}
                  countryCode={countryCode}
                  modelId={modelId}
                  hideModel={role === "client"}
                />

                {submitError && (
                  <p className="text-red-400 text-[13px] mt-4">{submitError}</p>
                )}

                <div className="mt-8 flex flex-wrap gap-3 justify-between">
                  <button
                    onClick={() => setStep(prevStepFrom(3, role))}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors text-[13px]"
                    disabled={submitting}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={submit}
                    disabled={!canSubmit || submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[13px]"
                  >
                    {submitting ? "Saving…" : (
                      <>
                        Submit & Enter
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </StepCard>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </main>
  );
}

// ── presentational atoms ─────────────────────────────────────────────────────

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 sm:p-10"
    >
      {children}
    </motion.section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <label className="block text-[12px] uppercase tracking-widest text-white/40 mb-2 font-medium">{label}</label>
      {children}
    </div>
  );
}

function RoleCard({
  active, onClick, title, subtitle, meta,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  meta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-all
        ${active
          ? "border-white/30 bg-white/[0.05] shadow-[0_0_24px_rgba(56,189,248,0.08)]"
          : "border-white/10 bg-[#050810]/60 hover:border-white/20"
        }`}
    >
      <p className="text-white font-medium text-[15px]">{title}</p>
      <p className="text-white/55 text-[12px] mt-0.5">{subtitle}</p>
      <p className="text-white/30 text-[11px] mt-2 font-mono">{meta}</p>
    </button>
  );
}

function CountryRow({ country, active, onClick }: { country: Country; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors
        ${active ? "bg-white/[0.06]" : ""}`}
    >
      <span className="flex items-center gap-3">
        <span className="text-lg leading-none" aria-hidden>{country.flag}</span>
        <span className={`text-[14px] ${active ? "text-white" : "text-white/80"}`}>{country.name}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="text-white/30 text-[11px] font-mono">{country.code}</span>
        {active && <Check className="w-4 h-4 text-emerald-400" />}
      </span>
    </button>
  );
}

function ModelCard({
  model, active, onClick,
}: {
  model: OGModel;
  active: boolean;
  onClick: () => void;
}) {
  const tierColor =
    model.tier === "frontier" ? "text-amber-300 border-amber-400/30 bg-amber-400/[0.05]" :
    model.tier === "balanced" ? "text-cyan-300 border-cyan-400/30 bg-cyan-400/[0.05]" :
    model.tier === "fast"     ? "text-emerald-300 border-emerald-400/30 bg-emerald-400/[0.05]" :
                                "text-violet-300 border-violet-400/30 bg-violet-400/[0.05]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-5 transition-all relative overflow-hidden
        ${active
          ? "border-white/30 bg-white/[0.04] shadow-[0_0_24px_rgba(56,189,248,0.08)]"
          : "border-white/10 bg-[#050810]/60 hover:border-white/20"
        }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-white font-medium text-[15px]">{model.name}</p>
          <p className="text-white/40 text-[11px] font-mono mt-0.5">{model.id}</p>
        </div>
        <span className={`text-[10px] uppercase tracking-widest font-mono px-2 py-1 rounded-full border ${tierColor}`}>
          {model.tier}
        </span>
      </div>
      <p className="text-white/60 text-[13px] mb-3">{model.description}</p>
      <div className="flex flex-wrap gap-2 items-center text-[11px] text-white/40">
        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">{model.contextWindow}</span>
        <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">{model.provider}</span>
        <span className={`px-2 py-0.5 rounded-md border ${
          model.network === "testnet" ? "border-cyan-400/30 text-cyan-300/80" :
          model.network === "mainnet" ? "border-emerald-400/30 text-emerald-300/80" :
                                         "border-violet-400/30 text-violet-300/80"
        } bg-white/[0.02]`}>
          {model.network}
        </span>
      </div>
      <p className="text-white/35 text-[12px] mt-3">Best for: {model.bestFor}</p>
      {active && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center">
          <Check className="w-4 h-4" />
        </div>
      )}
    </button>
  );
}

function SummaryGrid({
  walletAddress, displayName, role, countryCode, modelId, hideModel,
}: {
  walletAddress: string;
  displayName: string;
  role: Role | null;
  countryCode: string;
  modelId: string;
  hideModel?: boolean;
}) {
  const country = COUNTRIES.find(c => c.code === countryCode);
  const model   = OG_MODELS.find(m => m.id === modelId);

  const items = [
    { label: "Wallet",     value: `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` },
    { label: "Name",       value: displayName || "—" },
    { label: "Role",       value: role === "client" ? "Client" : role === "agent_owner" ? "Agent Owner" : "—" },
    { label: "Country",    value: country ? `${country.flag}  ${country.name}` : "—" },
    ...(hideModel ? [] : [
      { label: "AI Model",   value: model ? model.name : "—" },
      { label: "Model Tier", value: model ? model.tier : "—" },
    ]),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map(it => (
        <div key={it.label} className="rounded-xl border border-white/10 bg-[#050810]/60 px-4 py-3">
          <p className="text-white/35 text-[10px] uppercase tracking-widest mb-1 font-medium">{it.label}</p>
          <p className="text-white text-[14px] font-medium">{it.value}</p>
        </div>
      ))}
    </div>
  );
}

function Nav({ onBack, onNext, canNext }: { onBack: () => void; onNext: () => void; canNext: boolean }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3 justify-between">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors text-[13px]"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[13px]"
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
