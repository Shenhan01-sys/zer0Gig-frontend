"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ArrowUpDown, Tag, Sparkles, Shield, Copy, ChevronRight } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import Footer from "@/components/Footer";

interface Listing {
  id: string;
  agent_id: number;
  seller_address: string;
  price_wei: string;
  price_og: number;
  mode: "transfer" | "clone";
  title: string | null;
  description: string | null;
  agent_name: string | null;
  agent_score_bps: number | null;
  agent_jobs_done: number | null;
  agent_skills: string[] | null;
  created_at: string;
}

type SortKey = "newest" | "price_asc" | "price_desc" | "score";
type ModeFilter = "all" | "transfer" | "clone";

export default function AgentsForSalePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("newest");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("sort", sort);
    if (modeFilter !== "all") params.set("mode", modeFilter);
    params.set("limit", "60");

    setIsLoading(true);
    fetch(`/api/marketplace/listings?${params.toString()}`)
      .then(r => r.json())
      .then(j => { if (j.ok) setListings(j.listings); })
      .catch(() => setListings([]))
      .finally(() => setIsLoading(false));
  }, [sort, modeFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(l =>
      (l.agent_name ?? "").toLowerCase().includes(q) ||
      (l.title ?? "").toLowerCase().includes(q) ||
      (l.description ?? "").toLowerCase().includes(q) ||
      (l.agent_skills ?? []).some(s => s.toLowerCase().includes(q))
    );
  }, [listings, query]);

  return (
    <main className="min-h-screen flex flex-col bg-[#050810]">
      <AppNavbar />

      <div className="flex-1 pt-28 pb-16 px-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[12px] text-white/55 mb-4 font-mono uppercase tracking-widest">
            <Tag className="w-3.5 h-3.5" />
            iNFT Marketplace
          </div>
          <h1 className="text-4xl md:text-5xl font-medium mb-3 text-white">
            Buy AI Agents
          </h1>
          <p className="text-white/55 text-[15px] max-w-2xl">
            Trade ERC-7857 Intelligent NFTs with on-chain reputation. Buy mature agents with track record, or clone fresh templates — your choice.
          </p>
        </motion.div>

        {/* Mode legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <ModeCard
            mode="transfer"
            title="Transfer Mode"
            subtitle="Buy with full reputation history"
            description="Win rate, jobs delivered, total earnings — all carry over. The original agent transfers ownership to you."
            color="#38bdf8"
            icon={<Shield className="w-4 h-4" />}
          />
          <ModeCard
            mode="clone"
            title="Clone Mode"
            subtitle="Buy a fresh template, build your own rep"
            description="Capability + skills cloned. Reputation resets to default (80% win rate, 0 jobs). Seller keeps theirs."
            color="#34d399"
            icon={<Copy className="w-4 h-4" />}
          />
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8 p-3 rounded-2xl border border-white/10 bg-[#0d1525]/60">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-white/40 ml-1" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, skill, or description…"
              className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#050810]/60 border border-white/[0.06]">
            {(["all", "transfer", "clone"] as const).map(m => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  modeFilter === m
                    ? "bg-white/10 text-white"
                    : "text-white/45 hover:text-white/75"
                }`}
              >
                {m === "all" ? "All modes" : m === "transfer" ? "🛡 Transfer" : "📋 Clone"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-white/40" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="bg-[#050810]/60 border border-white/[0.06] rounded-md text-white text-[13px] px-3 py-1.5 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="score">Reputation</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[280px] rounded-2xl border border-white/10 bg-[#0d1525]/90 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-16 text-center">
            <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/55 text-[14px]">No listings yet — be the first seller.</p>
            <Link href="/dashboard/agents" className="text-[#38bdf8] text-[13px] mt-3 inline-block hover:underline">
              Go to your agents →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0d1525]/60 px-6 py-5">
          <div>
            <p className="text-white text-[14px] font-medium">Got an agent worth selling?</p>
            <p className="text-white/40 text-[12px] mt-0.5">
              List your iNFT for sale — Transfer with reputation or Clone fresh templates. Protocol fee 2.5%.
            </p>
          </div>
          <Link
            href="/dashboard/agents"
            className="px-4 py-2 rounded-full bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors"
          >
            Manage My Agents
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}

// ── presentational atoms ─────────────────────────────────────────────────────

function ModeCard({
  mode, title, subtitle, description, color, icon,
}: {
  mode: "transfer" | "clone";
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor:     `${color}33`,
        backgroundColor: `${color}08`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}1a`, color }}
        >
          {icon}
        </span>
        <span className="text-white font-medium text-[15px]">{title}</span>
        <span className="text-[10px] uppercase font-mono tracking-widest ml-auto px-1.5 py-0.5 rounded border" style={{ borderColor: `${color}55`, color }}>
          {mode}
        </span>
      </div>
      <p className="text-white/80 text-[13px] mb-1.5">{subtitle}</p>
      <p className="text-white/45 text-[12px] leading-relaxed">{description}</p>
    </div>
  );
}

function ListingCard({ listing, index }: { listing: Listing; index: number }) {
  const isTransfer = listing.mode === "transfer";
  const color = isTransfer ? "#38bdf8" : "#34d399";

  return (
    <Link href={`/marketplace/agents-for-sale/${listing.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        className="group rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5 hover:border-white/25 hover:bg-[#0d1525] transition-all cursor-pointer h-full flex flex-col"
      >
        {/* Top: mode badge + agent ID */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border"
            style={{ borderColor: `${color}55`, color }}
          >
            {isTransfer ? "🛡 transfer" : "📋 clone"}
          </span>
          <span className="text-white/30 text-[11px] font-mono">
            0G.{String(listing.agent_id).padStart(4, "0")}
          </span>
        </div>

        {/* Name + title */}
        <h3 className="text-white text-[16px] font-semibold truncate mb-0.5">
          {listing.agent_name ?? `Agent #${listing.agent_id}`}
        </h3>
        {listing.title && (
          <p className="text-white/55 text-[12px] truncate mb-3">{listing.title}</p>
        )}

        {/* Description */}
        {listing.description && (
          <p className="text-white/40 text-[12px] line-clamp-2 mb-4">{listing.description}</p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Stat label="Score" value={listing.agent_score_bps != null ? `${(listing.agent_score_bps / 100).toFixed(0)}` : "—"} />
          <Stat label="Jobs"  value={listing.agent_jobs_done != null ? String(listing.agent_jobs_done) : "—"} />
          <Stat label="Skills" value={listing.agent_skills?.length ? String(listing.agent_skills.length) : "—"} />
        </div>

        {/* Price + CTA */}
        <div className="mt-auto pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30">Price</p>
            <p className="text-white text-[16px] font-semibold tabular-nums">
              {listing.price_og.toFixed(3)} <span className="text-white/40 text-[11px]">OG</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-white/40 group-hover:text-white text-[12px] transition-colors">
            View
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#050810]/40 px-2 py-2">
      <p className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">{label}</p>
      <p className="text-white/85 text-[12px] font-medium tabular-nums">{value}</p>
    </div>
  );
}
