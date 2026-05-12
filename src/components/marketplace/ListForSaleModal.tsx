"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, AlertCircle } from "lucide-react";
import { parseEther } from "viem";

interface Props {
  agentId: number;
  sellerAddress: string;
  agentSnapshot: {
    name?: string;
    scoreBps?: number;
    jobsDone?: number;
    skills?: string[];
  };
  onClose: () => void;
  onSuccess: (listingId: string) => void;
}

export default function ListForSaleModal({
  agentId, sellerAddress, agentSnapshot, onClose, onSuccess,
}: Props) {
  const [mode, setMode] = useState<"transfer" | "clone">("transfer");
  const [priceOG, setPriceOG] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!priceOG && Number(priceOG) > 0 && !submitting;

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const priceWei = parseEther(priceOG).toString();
      const res = await fetch("/api/marketplace/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          sellerAddress: sellerAddress.toLowerCase(),
          priceWei,
          mode,
          title: title.trim() || null,
          description: description.trim() || null,
          agentSnapshot,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Listing failed");
      onSuccess(json.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Listing failed");
    } finally {
      setSubmitting(false);
    }
  }

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
        className="w-full sm:max-w-md bg-[#0d1525] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <p className="text-white font-semibold text-[15px]">
            List Agent #{agentId} for Sale
          </p>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/[0.06] transition-colors" aria-label="Close">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Mode */}
          <div>
            <label className="block text-[11px] uppercase font-mono tracking-widest text-white/40 mb-2">Sale mode</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "transfer" as const, label: "Transfer", hint: "Carry reputation" },
                { val: "clone"    as const, label: "Clone",    hint: "Reset reputation" },
              ].map(m => {
                const active = mode === m.val;
                return (
                  <button
                    key={m.val}
                    onClick={() => setMode(m.val)}
                    className={`text-left rounded-xl border px-4 py-3 transition-all ${
                      active
                        ? "border-white/30 bg-white/[0.05]"
                        : "border-white/10 bg-[#050810]/60 hover:border-white/20"
                    }`}
                  >
                    <p className="text-white text-[13px] font-medium">{m.label}</p>
                    <p className="text-white/45 text-[11px] mt-0.5">{m.hint}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-white/35 mt-2">
              {mode === "transfer"
                ? "Buyer takes full ownership. Your reputation + jobs history transfer over."
                : "A fresh clone is minted for buyer. You keep your agent. Reputation resets."}
            </p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-[11px] uppercase font-mono tracking-widest text-white/40 mb-2">Price (OG)</label>
            <input
              type="number"
              value={priceOG}
              onChange={e => setPriceOG(e.target.value)}
              placeholder="e.g. 5.000"
              step="0.001"
              min="0"
              className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-[15px] focus:border-white/30 focus:outline-none transition-colors"
            />
            {priceOG && Number(priceOG) > 0 && (
              <p className="text-[11px] text-white/40 mt-1.5">
                Protocol fee 2.5% = {(Number(priceOG) * 0.025).toFixed(4)} OG · You receive {(Number(priceOG) * 0.975).toFixed(4)} OG
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] uppercase font-mono tracking-widest text-white/40 mb-2">Title (optional)</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 120))}
              placeholder="e.g. Solidity dev with 50 jobs delivered"
              className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-[14px] focus:border-white/30 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] uppercase font-mono tracking-widest text-white/40 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 2000))}
              placeholder="What makes this agent valuable…"
              rows={4}
              className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-[14px] focus:border-white/30 focus:outline-none transition-colors resize-y"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/[0.06] px-4 py-3 flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-[12px]">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-white/[0.06]">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[14px] inline-flex items-center justify-center gap-2"
          >
            {submitting ? "Listing…" : (
              <>
                <Check className="w-4 h-4" />
                List for {priceOG || "0"} OG
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
