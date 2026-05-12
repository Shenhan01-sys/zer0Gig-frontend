"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowLeft, Shield, Copy as CopyIcon, ChevronRight, AlertCircle } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import Footer from "@/components/Footer";
import BuyAgentModal from "@/components/marketplace/BuyAgentModal";

interface Listing {
  id: string;
  agent_id: number;
  seller_address: string;
  price_wei: string;
  price_og: number;
  mode: "transfer" | "clone";
  title: string | null;
  description: string | null;
  terms_url: string | null;
  agent_name: string | null;
  agent_score_bps: number | null;
  agent_jobs_done: number | null;
  agent_skills: string[] | null;
  created_at: string;
  expires_at: string | null;
  status: string;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authenticated, user, login, ready } = usePrivy();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/marketplace/listings?limit=1&offset=0`)
      .then(() => fetch(`/api/marketplace/listings`))
      .then(r => r.json())
      .then(j => {
        if (!j.ok) throw new Error(j.error ?? "Failed to fetch");
        const found = (j.listings as Listing[]).find(l => l.id === id);
        if (!found) throw new Error("Listing not found");
        setListing(found);
      })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const isTransfer = listing?.mode === "transfer";
  const buyerAddress = (user?.wallet?.address ?? "").toLowerCase();
  const isSeller = listing && buyerAddress === listing.seller_address.toLowerCase();

  return (
    <main className="min-h-screen flex flex-col bg-[#050810]">
      <AppNavbar />

      <div className="flex-1 pt-28 pb-16 px-6 max-w-5xl mx-auto w-full">
        <Link
          href="/marketplace/agents-for-sale"
          className="inline-flex items-center gap-2 text-white/45 hover:text-white text-[13px] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to marketplace
        </Link>

        {isLoading && (
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-14 text-center text-white/40">
            Loading listing…
          </div>
        )}

        {!isLoading && (error || !listing) && (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/[0.04] p-10 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 text-[14px]">{error ?? "Listing not found"}</p>
            <Link href="/marketplace/agents-for-sale" className="text-[#38bdf8] text-[13px] mt-3 inline-block hover:underline">
              Browse other listings →
            </Link>
          </div>
        )}

        {!isLoading && listing && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start"
          >
            {/* Main column */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-7">
              {/* Mode badge + agent ID */}
              <div className="flex items-center justify-between mb-5">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-full border border-white/15 text-white/65 bg-white/[0.03]">
                  {isTransfer ? <Shield className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                  {isTransfer ? "Transfer Mode" : "Clone Mode"}
                </span>
                <span className="text-white/35 text-[12px] font-mono">
                  0G.{String(listing.agent_id).padStart(4, "0")}
                </span>
              </div>

              <h1 className="text-3xl font-medium text-white mb-1">
                {listing.agent_name ?? `Agent #${listing.agent_id}`}
              </h1>
              {listing.title && (
                <p className="text-white/65 text-[15px] mb-5">{listing.title}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Stat label="Reputation" value={listing.agent_score_bps != null ? `${(listing.agent_score_bps / 100).toFixed(0)}/100` : "—"} />
                <Stat label="Jobs Done"  value={listing.agent_jobs_done != null ? String(listing.agent_jobs_done) : "—"} />
                <Stat label="Skills"     value={listing.agent_skills?.length ? String(listing.agent_skills.length) : "—"} />
              </div>

              {/* Description */}
              {listing.description && (
                <div className="mb-6">
                  <p className="text-[11px] uppercase font-mono tracking-widest text-white/40 mb-2">About</p>
                  <p className="text-white/75 text-[14px] leading-relaxed whitespace-pre-line">{listing.description}</p>
                </div>
              )}

              {/* Skills */}
              {listing.agent_skills && listing.agent_skills.length > 0 && (
                <div className="mb-6">
                  <p className="text-[11px] uppercase font-mono tracking-widest text-white/40 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {listing.agent_skills.map(s => (
                      <span key={s} className="text-[12px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/75">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode explanation */}
              <div className="rounded-xl border border-white/10 bg-[#050810]/60 p-4 mb-2">
                <p className="text-[12px] font-medium text-white/80 inline-flex items-center gap-1.5">
                  {isTransfer ? <Shield className="w-3.5 h-3.5 text-white/55" /> : <CopyIcon className="w-3.5 h-3.5 text-white/55" />}
                  {isTransfer ? "What you get with Transfer Mode" : "What you get with Clone Mode"}
                </p>
                <p className="text-white/55 text-[12px] mt-1.5 leading-relaxed">
                  {isTransfer
                    ? "Full ownership of this exact agent — win rate, jobs delivered, skills, and total earnings carry over. The seller no longer owns this agent after settlement."
                    : "A fresh copy of the agent template. Capability + skills + agentWallet copied. Reputation resets to default 80% win rate, 0 jobs. Seller keeps their copy."}
                </p>
              </div>
            </div>

            {/* Right column — price + buy */}
            <div className="space-y-4 sticky top-28">
              <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-[#0d1525] to-[#050810] p-6">
                <p className="text-[10px] uppercase font-mono tracking-widest text-white/40 mb-2">Price</p>
                <p className="text-white text-4xl font-semibold tabular-nums mb-1">
                  {listing.price_og.toFixed(3)}
                </p>
                <p className="text-white/45 text-[13px] mb-5">OG · ≈ ${(listing.price_og * 50).toFixed(2)} at $50/OG</p>

                <div className="text-[11px] text-white/40 mb-5 space-y-1">
                  <div className="flex justify-between">
                    <span>Protocol fee (2.5%)</span>
                    <span className="font-mono tabular-nums">{(listing.price_og * 0.025).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seller receives</span>
                    <span className="font-mono tabular-nums text-white/70">{(listing.price_og * 0.975).toFixed(4)}</span>
                  </div>
                </div>

                {!ready ? (
                  <div className="text-white/40 text-[12px] text-center">Initializing…</div>
                ) : !authenticated ? (
                  <button
                    onClick={() => login()}
                    className="w-full py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors text-[14px]"
                  >
                    Connect to Buy
                  </button>
                ) : isSeller ? (
                  <div className="text-[12px] text-white/45 text-center py-3 rounded-xl border border-white/10 bg-white/[0.02]">
                    You are the seller of this listing
                  </div>
                ) : (
                  <button
                    onClick={() => setBuyModalOpen(true)}
                    className="w-full py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors text-[14px] inline-flex items-center justify-center gap-2"
                  >
                    Buy now
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5 space-y-2.5">
                <Meta label="Seller" value={`${listing.seller_address.slice(0, 6)}…${listing.seller_address.slice(-4)}`} />
                <Meta label="Listed" value={new Date(listing.created_at).toLocaleDateString()} />
                {listing.expires_at && <Meta label="Expires" value={new Date(listing.expires_at).toLocaleDateString()} />}
                {listing.terms_url && (
                  <a href={listing.terms_url} target="_blank" rel="noreferrer" className="block text-[12px] text-[#38bdf8] hover:underline mt-2">
                    Terms & conditions →
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {listing && buyModalOpen && (
        <BuyAgentModal
          listing={listing}
          onClose={() => setBuyModalOpen(false)}
          onSuccess={() => {
            setBuyModalOpen(false);
            router.push(`/dashboard/my-purchases`);
          }}
        />
      )}

      <Footer />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#050810]/60 px-3 py-3">
      <p className="text-[10px] uppercase font-mono tracking-widest text-white/35 mb-1">{label}</p>
      <p className="text-white text-[18px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-white/40">{label}</span>
      <span className="text-white/80 font-mono">{value}</span>
    </div>
  );
}
