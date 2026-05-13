"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, Mail, Phone, Globe2, Briefcase, Users, Sparkles,
  ArrowRight, CheckCircle2, AlertCircle, ChevronRight, Handshake,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// /partnership — PT / company partnership application form.
//
// Sits in front of /onboarding for first-time visitors. Two paths:
//   1. Company representative: fills the form, submits to
//      /api/partnership/submit, sets the partnership-passed sessionStorage
//      flag, then continues to /onboarding to register as the individual rep.
//   2. Individual user: clicks 'Continue as Individual' which sets the same
//      sessionStorage flag and routes straight to /onboarding.
//
// Palette matches /marketplace/agents-for-sale per founder direction:
// bg-[#050810] outer, bg-[#0d1525]/90 cards, white-tint borders, white
// primary button with black text, cyan accents reserved for active states.
// ─────────────────────────────────────────────────────────────────────────────

const COMPANY_SIZES = [
  { value: "1-10",     label: "1 – 10 employees" },
  { value: "11-50",    label: "11 – 50 employees" },
  { value: "51-200",   label: "51 – 200 employees" },
  { value: "201-1000", label: "201 – 1,000 employees" },
  { value: "1000+",    label: "1,000+ employees" },
];

const PARTNERSHIP_TYPES = [
  { value: "agent-ops",   label: "Agent operations · we want to run agents internally" },
  { value: "custom-dev",  label: "Custom dev · we want zer0Gig to build agents for us" },
  { value: "integration", label: "Integration · embed zer0Gig agents in our product" },
  { value: "reseller",    label: "Reseller / channel partner" },
  { value: "other",       label: "Other / not sure yet" },
];

type State = "idle" | "submitting" | "success" | "error";

const FLAG_KEY = "zerogig:partnership:passed";

function markPassed() {
  try { sessionStorage.setItem(FLAG_KEY, "1"); } catch {}
}

export default function PartnershipPage() {
  const router = useRouter();

  // Form state
  const [companyName,     setCompanyName]     = useState("");
  const [companyWebsite,  setCompanyWebsite]  = useState("");
  const [industry,        setIndustry]        = useState("");
  const [companySize,     setCompanySize]     = useState("");
  const [contactName,     setContactName]     = useState("");
  const [contactEmail,    setContactEmail]    = useState("");
  const [contactPhone,    setContactPhone]    = useState("");
  const [partnershipType, setPartnershipType] = useState("");
  const [useCase,         setUseCase]         = useState("");

  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail);
  const canSubmit =
    companyName.trim().length >= 2 &&
    contactName.trim().length >= 2 &&
    emailOk &&
    state === "idle";

  async function submit() {
    if (!canSubmit) return;
    setError(null);
    setState("submitting");
    try {
      const res = await fetch("/api/partnership/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          companyName, companyWebsite, industry, companySize,
          contactName, contactEmail, contactPhone,
          partnershipType, useCase,
          source: "landing",
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Submission failed");
      markPassed();
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  function continueAsIndividual() {
    markPassed();
    router.push("/onboarding");
  }

  function continueToOnboarding() {
    router.push("/onboarding");
  }

  return (
    <main className="min-h-screen bg-[#050810] text-white font-sans flex flex-col">
      {/* Subtle ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(56,189,248,0.06) 0%, transparent 55%)",
        }}
        aria-hidden
      />

      {/* Top bar */}
      <header className="relative z-10 px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <Link href="/" className="text-white/80 hover:text-white text-sm tracking-wide transition-colors">
          ← zer0Gig
        </Link>
        <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Partnership</p>
      </header>

      <div className="relative z-10 flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-3xl">

          {/* SUCCESS STATE ───────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {state === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
                className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-10 sm:p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-8 h-8 text-cyan-300" />
                </motion.div>
                <h1 className="text-3xl sm:text-4xl font-medium text-white mb-3">
                  Application received.
                </h1>
                <p className="text-white/55 text-[15px] max-w-xl mx-auto mb-8 leading-relaxed">
                  We&apos;ll review your submission and reach out within{" "}
                  <span className="text-white">7 days</span>. Welcome to the coalition.
                  In the meantime, complete your individual onboarding so you can access the platform right away.
                </p>
                <button
                  onClick={continueToOnboarding}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-[14px] font-medium hover:bg-white/90 transition-colors"
                >
                  Continue to Onboarding
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header ───────────────────────────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-10"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/55 mb-4 font-mono uppercase tracking-widest">
                    <Handshake className="w-3.5 h-3.5" />
                    Partnership Program
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white mb-3 tracking-tight">
                    Partner with zer0Gig.
                  </h1>
                  <p className="text-white/55 text-[15px] max-w-2xl leading-relaxed">
                    Coalition for Indonesian PTs onboarding to the agentic economy on 0G.
                    Apply for partnership or, if you&apos;re just signing up as
                    an individual builder, skip ahead to onboarding.
                  </p>
                </motion.div>

                {/* Individual skip path ─────────────────────────────────── */}
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  onClick={continueAsIndividual}
                  className="group w-full mb-8 flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-[#0d1525]/60 hover:bg-[#0d1525]/90 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-white/55" />
                    </div>
                    <div>
                      <p className="text-white text-[14px] font-medium">I&apos;m signing up as an individual</p>
                      <p className="text-white/45 text-[12px]">Skip the partnership form and continue to personal onboarding.</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/35 group-hover:text-white/75 transition-colors shrink-0" />
                </motion.button>

                {/* Divider with label ──────────────────────────────────── */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-[0.3em]">
                    <span className="px-3 bg-[#050810] text-white/40">Or apply as a company</span>
                  </div>
                </div>

                {/* Form ────────────────────────────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 sm:p-8"
                >

                  {/* Company section */}
                  <SectionLabel icon={<Building2 className="w-3.5 h-3.5" />}>Company</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
                    <Field label="Company / PT name" required>
                      <Input value={companyName} onChange={setCompanyName} placeholder="PT Sinar Mas, Inc., etc." />
                    </Field>
                    <Field label="Website / LinkedIn">
                      <Input value={companyWebsite} onChange={setCompanyWebsite} placeholder="https://…" />
                    </Field>
                    <Field label="Industry">
                      <Input value={industry} onChange={setIndustry} placeholder="Fintech, F&amp;B, Logistics…" />
                    </Field>
                    <Field label="Company size">
                      <Select value={companySize} onChange={setCompanySize} placeholder="Select size">
                        {COMPANY_SIZES.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  {/* Contact section */}
                  <SectionLabel icon={<Users className="w-3.5 h-3.5" />}>Contact</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
                    <Field label="Your name" required>
                      <Input value={contactName} onChange={setContactName} placeholder="Hans Gunawan" />
                    </Field>
                    <Field label="Email" required>
                      <Input value={contactEmail} onChange={setContactEmail} placeholder="you@company.com" type="email" />
                      {contactEmail && !emailOk && (
                        <p className="text-amber-400/80 text-[11px] mt-1">Email format looks off.</p>
                      )}
                    </Field>
                    <Field label="Phone (optional)">
                      <Input value={contactPhone} onChange={setContactPhone} placeholder="+62 …" />
                    </Field>
                    <Field label="Country">
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-[#050810]/80 text-white/65 text-[14px]">
                        <Globe2 className="w-3.5 h-3.5 text-white/45" />
                        Indonesia (default)
                      </div>
                    </Field>
                  </div>

                  {/* Intent section */}
                  <SectionLabel icon={<Sparkles className="w-3.5 h-3.5" />}>Intent</SectionLabel>
                  <div className="space-y-4 mb-8">
                    <Field label="Partnership type">
                      <Select value={partnershipType} onChange={setPartnershipType} placeholder="Pick the closest fit">
                        {PARTNERSHIP_TYPES.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="What's the use case?">
                      <textarea
                        value={useCase}
                        onChange={e => setUseCase(e.target.value.slice(0, 2000))}
                        rows={4}
                        placeholder="What's the problem you'd solve with autonomous AI agents? What's the scale you're thinking about?"
                        className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none"
                      />
                      <p className="text-white/30 text-[11px] mt-1">{useCase.length} / 2000</p>
                    </Field>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={submit}
                    disabled={!canSubmit}
                    className="w-full px-6 py-3.5 rounded-full bg-white text-black text-[14px] font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                  >
                    {state === "submitting" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Submitting…
                      </>
                    ) : state === "error" ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        Retry
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {error && (
                    <p className="text-red-400/80 text-[12px] text-center mt-3">{error}</p>
                  )}

                  <p className="text-white/30 text-[11px] text-center mt-4 leading-relaxed">
                    By submitting you agree to be contacted about partnership opportunities. We&apos;ll never share your details.
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

// ─── presentational atoms ─────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-white/55">{icon}</span>
      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/55">
        {children}
      </span>
    </div>
  );
}

function Field({
  label, required, children,
}: {
  label:    string;
  required?: boolean;
  children:  React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-widest text-white/40 mb-1.5 font-medium">
        {label}{required && <span className="text-cyan-400/80 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text",
}: {
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
  type?:       string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
    />
  );
}

function Select({
  value, onChange, placeholder, children,
}: {
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
  children:    React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
    >
      <option value="" disabled className="text-white/25">{placeholder}</option>
      {children}
    </select>
  );
}

// Silence unused-import warnings for icons reserved for the next iteration.
void Mail; void Phone;
