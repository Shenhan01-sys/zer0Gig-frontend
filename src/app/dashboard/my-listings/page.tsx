"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { Tag, X as XIcon, ExternalLink } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import Footer from "@/components/Footer";

interface Listing {
  id: string;
  agent_id: number;
  seller_address: string;
  price_og: number;
  mode: "transfer" | "clone";
  title: string | null;
  agent_name: string | null;
  agent_score_bps: number | null;
  agent_jobs_done: number | null;
  status: string;
  created_at: string;
  sold_at: string | null;
  buyer_address: string | null;
}

export default function MyListingsPage() {
  const { authenticated, user, ready } = usePrivy();
  const wallet = (user?.wallet?.address ?? "").toLowerCase();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) return;
    setIsLoading(true);
    fetch(`/api/marketplace/listings?seller=${wallet}&limit=100`)
      .then(r => r.json())
      .then(j => { if (j.ok) setListings(j.listings); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [wallet]);

  const cancelListing = async (id: string) => {
    if (!confirm("Cancel this listing?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/marketplace/list?id=${id}&seller=${wallet}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed");
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setCancellingId(null);
    }
  };

  const grouped = useMemo(() => {
    const active: Listing[] = [];
    const sold:   Listing[] = [];
    const other:  Listing[] = [];
    listings.forEach(l => {
      if (l.status === "active")    active.push(l);
      else if (l.status === "sold") sold.push(l);
      else                          other.push(l);
    });
    return { active, sold, other };
  }, [listings]);

  return (
    <main className="min-h-screen flex flex-col bg-[#050810]">
      <AppNavbar />

      <div className="flex-1 pt-28 pb-16 px-6 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[12px] text-white/55 mb-4 font-mono uppercase tracking-widest">
            <Tag className="w-3.5 h-3.5" />
            My Listings
          </div>
          <h1 className="text-4xl font-medium text-white mb-2">Your Agent Listings</h1>
          <p className="text-white/55 text-[14px]">Manage agents you've put up for sale.</p>
        </motion.div>

        {!ready || !authenticated ? (
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-14 text-center text-white/40">
            Connect wallet to view your listings.
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl border border-white/10 bg-[#0d1525]/90 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-14 text-center">
            <p className="text-white/55 text-[14px]">No listings yet.</p>
            <Link href="/dashboard/agents" className="text-[#38bdf8] text-[13px] mt-3 inline-block hover:underline">
              List one of your agents →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.active.length > 0 && (
              <Section title={`Active (${grouped.active.length})`} listings={grouped.active} onCancel={cancelListing} cancellingId={cancellingId} />
            )}
            {grouped.sold.length > 0 && (
              <Section title={`Sold (${grouped.sold.length})`} listings={grouped.sold} />
            )}
            {grouped.other.length > 0 && (
              <Section title={`Other (${grouped.other.length})`} listings={grouped.other} />
            )}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

function Section({
  title, listings, onCancel, cancellingId,
}: {
  title: string;
  listings: Listing[];
  onCancel?: (id: string) => void;
  cancellingId?: string | null;
}) {
  return (
    <div>
      <h2 className="text-[12px] font-medium text-white/50 uppercase tracking-widest mb-3">{title}</h2>
      <div className="space-y-2">
        {listings.map(l => (
          <Row key={l.id} listing={l} onCancel={onCancel} isCancelling={cancellingId === l.id} />
        ))}
      </div>
    </div>
  );
}

function Row({ listing, onCancel, isCancelling }: { listing: Listing; onCancel?: (id: string) => void; isCancelling: boolean }) {
  const isTransfer = listing.mode === "transfer";
  // Status colors stay minimal — only emerald for "sold" (success outcome).
  // Active / cancelled / other render in neutral white tints.
  const statusColor =
    listing.status === "active"     ? "text-white/75 border-white/20 bg-white/[0.05]" :
    listing.status === "sold"        ? "text-emerald-300 border-emerald-400/40 bg-emerald-400/[0.06]" :
    listing.status === "cancelled"   ? "text-white/40 border-white/10 bg-white/[0.02]" :
                                       "text-white/55 border-white/15 bg-white/[0.04]";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0d1525]/90 p-4">
      <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border border-white/15 text-white/55 bg-white/[0.03] shrink-0">
        {isTransfer ? "TRANSFER" : "CLONE"}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-[14px] truncate">
          {listing.agent_name ?? `Agent #${listing.agent_id}`}
          {listing.title && <span className="text-white/45 font-normal ml-2">· {listing.title}</span>}
        </p>
        <p className="text-white/35 text-[11px] font-mono mt-0.5">
          0G.{String(listing.agent_id).padStart(4, "0")} ·
          {listing.agent_score_bps != null && ` Score ${(listing.agent_score_bps / 100).toFixed(0)}/100`}
          {listing.agent_jobs_done != null && ` · ${listing.agent_jobs_done} jobs`}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-white text-[14px] font-semibold tabular-nums">{listing.price_og.toFixed(3)} OG</p>
        <span className={`text-[10px] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded border ${statusColor}`}>
          {listing.status}
        </span>
      </div>

      <div className="flex gap-1.5 shrink-0">
        <Link
          href={`/marketplace/agents-for-sale/${listing.id}`}
          className="p-2 rounded-lg border border-white/10 hover:border-white/25 transition-colors text-white/60 hover:text-white"
          title="View listing"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        {onCancel && listing.status === "active" && (
          <button
            onClick={() => onCancel(listing.id)}
            disabled={isCancelling}
            className="p-2 rounded-lg border border-red-400/30 hover:border-red-400/60 transition-colors text-red-400 hover:text-red-300 disabled:opacity-50"
            title="Cancel listing"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
