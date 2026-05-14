"use client";

import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useWaitForTransactionReceipt } from "wagmi";

type TxStatus = "signing" | "broadcasting" | "confirming" | "confirmed" | "failed";

interface TxRecord {
  id: string;
  label: string;
  status: TxStatus;
  hash?: `0x${string}`;
  error?: string;
  startedAt: number;
}

interface TxToastCtx {
  start: (label: string) => string;
  broadcast: (id: string, hash: `0x${string}`) => void;
  confirm: (id: string) => void;
  fail: (id: string, error: string) => void;
  run: <T>(label: string, action: () => Promise<T>, extractHash?: (result: T) => `0x${string}` | undefined) => Promise<T>;
}

const Ctx = createContext<TxToastCtx | null>(null);

const EXPLORER_BASE = "https://chainscan-galileo.0g.ai/tx/";

// ── Progress ring ────────────────────────────────────────────────────────
function ProgressRing({ progress, color, size = 36 }: { progress: number; color: string; size?: number }) {
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

// ── Spinner icon (for signing/broadcasting where progress is indeterminate) ──
function Spinner({ color }: { color: string }) {
  return (
    <div className="w-9 h-9 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: `${color}33`, borderTopColor: color }} />
    </div>
  );
}

// ── Check / X icons ───────────────────────────────────────────────────────
function CheckIcon({ color }: { color: string }) {
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}22`, border: `1px solid ${color}55` }}>
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}
function XIcon({ color }: { color: string }) {
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}22`, border: `1px solid ${color}55` }}>
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
}

// ── Per-tx watcher — waits for receipt, then calls confirm ───────────────
// 0G testnet RPC can be slow — use generous timeout (5 min) and polling (3s)
function TxWatcher({ hash, onConfirmed, onFailed }: { hash: `0x${string}`; onConfirmed: () => void; onFailed: (err: string) => void }) {
  const { isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash && hash.startsWith("0x"),
      retry: 10,
      retryDelay: 3000,
    },
  });

  useEffect(() => {
    if (isSuccess) onConfirmed();
    else if (isError) {
      const msg = error?.message || "";
      // Viem throws "receipt could not be found" when tx is dropped or RPC lags.
      // For 0G testnet this is common — show a friendlier message.
      if (msg.includes("could not be found")) {
        onFailed(
          "Transaction was broadcast but confirmation timed out. Check the explorer link above. If it succeeded, refresh the page. If it failed, try again."
        );
      } else {
        onFailed(msg.split("\n")[0].slice(0, 140) || "Transaction failed on-chain");
      }
    }
  }, [isSuccess, isError, error, onConfirmed, onFailed]);
  return null;
}

// ── Single toast card ────────────────────────────────────────────────────
function ToastCard({ tx, onDismiss }: { tx: TxRecord; onDismiss: () => void }) {
  const { label, status, hash, error } = tx;

  const statusMeta = useMemo<{ text: string; color: string; progress: number }>(() => {
    switch (status) {
      case "signing":      return { text: "Waiting for signature…", color: "#38bdf8", progress: 0.25 };
      case "broadcasting": return { text: "Broadcasting to chain…", color: "#38bdf8", progress: 0.5 };
      case "confirming":   return { text: "Confirming…",            color: "#a855f7", progress: 0.75 };
      case "confirmed":    return { text: "Confirmed on-chain",      color: "#22c55e", progress: 1 };
      case "failed":       return { text: error || "Transaction failed", color: "#ef4444", progress: 1 };
    }
  }, [status, error]);

  const Icon =
    status === "confirmed" ? <CheckIcon color={statusMeta.color} /> :
    status === "failed"    ? <XIcon color={statusMeta.color} /> :
    status === "signing"   ? <Spinner color={statusMeta.color} /> :
    <div className="relative w-9 h-9 flex items-center justify-center">
      <ProgressRing progress={statusMeta.progress} color={statusMeta.color} />
      <span className="absolute w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: statusMeta.color }} />
    </div>;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="relative w-[340px] rounded-xl bg-[#0d1525]/95 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden"
    >
      {/* Top accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${statusMeta.color} 50%, transparent 100%)`,
          opacity: status === "confirmed" || status === "failed" ? 0.9 : 0.6,
        }}
      />

      <div className="flex items-start gap-3 px-4 py-3.5">
        {Icon}

        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-semibold truncate">{label}</p>
          <p className="text-white/50 text-[11px] mt-0.5">{statusMeta.text}</p>
          {hash && (
            <a
              href={`${EXPLORER_BASE}${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 font-mono text-[10px] uppercase tracking-wider text-[#38bdf8]/70 hover:text-[#38bdf8] transition-colors"
            >
              {hash.slice(0, 8)}…{hash.slice(-6)}
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
              </svg>
            </a>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Step indicator dots */}
      {status !== "failed" && (
        <div className="flex items-center gap-1.5 px-4 pb-3">
          {(["signing", "broadcasting", "confirming", "confirmed"] as TxStatus[]).map((s, i) => {
            const activeOrPast =
              (status === "signing" && i === 0) ||
              (status === "broadcasting" && i <= 1) ||
              (status === "confirming" && i <= 2) ||
              (status === "confirmed" && i <= 3);
            const isCurrent =
              (status === "signing" && i === 0) ||
              (status === "broadcasting" && i === 1) ||
              (status === "confirming" && i === 2) ||
              (status === "confirmed" && i === 3);
            return (
              <div key={s} className="flex-1 h-[2px] rounded-full overflow-hidden bg-white/5">
                {activeOrPast && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${isCurrent && status !== "confirmed" ? "animate-pulse" : ""}`}
                    style={{ backgroundColor: statusMeta.color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ── Provider ─────────────────────────────────────────────────────────────
export function TxToastProvider({ children }: { children: React.ReactNode }) {
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const start = useCallback((label: string) => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setTxs((prev) => [...prev, { id, label, status: "signing", startedAt: Date.now() }]);
    return id;
  }, []);

  const broadcast = useCallback((id: string, hash: `0x${string}`) => {
    setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, status: "confirming", hash } : t)));
  }, []);

  const confirm = useCallback((id: string) => {
    setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, status: "confirmed" } : t)));
    // Auto-dismiss after 6s
    setTimeout(() => setTxs((prev) => prev.filter((t) => t.id !== id)), 6000);
  }, []);

  const fail = useCallback((id: string, error: string) => {
    setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, status: "failed", error } : t)));
    setTimeout(() => setTxs((prev) => prev.filter((t) => t.id !== id)), 8000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setTxs((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const run = useCallback(
    async <T,>(label: string, action: () => Promise<T>, extractHash?: (result: T) => `0x${string}` | undefined): Promise<T> => {
      const id = start(label);
      try {
        const result = await action();
        const hash = extractHash ? extractHash(result) : (typeof result === "string" && (result as string).startsWith("0x") ? (result as `0x${string}`) : undefined);
        if (hash) {
          broadcast(id, hash);
        } else {
          // No hash returned — treat as confirmed immediately
          confirm(id);
        }
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";
        // Trim long viem errors to first line
        fail(id, msg.split("\n")[0].slice(0, 140));
        throw err;
      }
    },
    [start, broadcast, confirm, fail]
  );

  const api = useMemo<TxToastCtx>(() => ({ start, broadcast, confirm, fail, run }), [start, broadcast, confirm, fail, run]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {/* Watchers for in-flight tx hashes */}
      {txs.map((t) =>
        t.hash && t.status === "confirming" ? (
          <TxWatcher
            key={t.id}
            hash={t.hash}
            onConfirmed={() => confirm(t.id)}
            onFailed={(err) => fail(t.id, err)}
          />
        ) : null
      )}
      {/* Toast container portal */}
      {mounted &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence initial={false}>
              {txs.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                  <ToastCard tx={t} onDismiss={() => dismiss(t.id)} />
                </div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </Ctx.Provider>
  );
}

export function useTx(): TxToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTx must be used within TxToastProvider");
  return ctx;
}
