"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscriptionEscrow";
import { useAgentProfile } from "@/hooks/useAgentProfile";
import { formatOG } from "@/lib/utils";
import { MOCK_SUBSCRIPTIONS } from "@/lib/mockData";
import CornerBrackets from "../ui/CornerBrackets";

interface SubscriptionCardProps {
  subscriptionId: number;
  index: number;
}

function intervalModeLabel(mode: number): string {
  return ["Client-Set", "Agent-Proposed", "Agent-Auto"][mode] ?? "Unknown";
}

function SubscriptionStatusBadge({ status }: { status: number }) {
  const styles: Record<number, string> = {
    0: "px-2.5 py-1 rounded-full bg-white/10 text-white/60 text-[12px]",
    1: "px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[12px]",
    2: "px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-[12px]",
    3: "px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[12px]",
  };
  const labels: Record<number, string> = {
    0: "Pending",
    1: "Active",
    2: "Paused",
    3: "Cancelled",
  };

  return (
    <span className={styles[status] ?? styles[0]}>
      {labels[status] ?? "Unknown"}
    </span>
  );
}

export default function SubscriptionCard({ subscriptionId, index }: SubscriptionCardProps) {
  const { data: sub, isLoading, isError } = useSubscription(subscriptionId);

  // Get agent name for display (call before any early returns to keep hook order stable)
  const agentIdNum = sub && (sub as any)?.agentId ? Number((sub as any).agentId) : 0;
  const { profile: agentProfile } = useAgentProfile(agentIdNum > 0 ? agentIdNum : undefined);

  // Quick Telegram access — if the client has wired a bot for this sub, surface
  // its @username on the row so they can jump straight to the chat.
  const [botUsername, setBotUsername] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfgRes = await fetch(`/api/client-bot-config?subscription_id=${subscriptionId}`);
        const { data } = await cfgRes.json();
        const token = data?.bot_token;
        if (!token) return;
        const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
          signal: AbortSignal.timeout(6000),
        });
        if (!tgRes.ok) return;
        const j = await tgRes.json();
        if (!cancelled && j?.ok && j?.result?.username) setBotUsername(j.result.username);
      } catch { /* silent — row falls back to no quick-access button */ }
    })();
    return () => { cancelled = true; };
  }, [subscriptionId]);

  // DEMO MODE: Fall back to mock data when real subscription doesn't exist on-chain.
  // Check for `agentId` which exists in the new struct (subscriptionId was removed).
  const hasRealSub = sub && (sub as any)?.agentId !== undefined;
  const mockSub = MOCK_SUBSCRIPTIONS.find(s => s.subscriptionId === subscriptionId);
  
  // Real contract returns an object with named fields; mock is an array
  const isMockFormat = mockSub && !("taskDescription" in (mockSub as any));
  const displayData = (!hasRealSub && mockSub) ? (isMockFormat ? [
    BigInt(mockSub.subscriptionId),   // 0: subscriptionId
    BigInt(0),                        // 1: (unused)
    BigInt(mockSub.agentId),           // 2: agentId
    mockSub.client,                   // 3: agentWallet
    mockSub.taskDescription,          // 4: taskDescription
    mockSub.intervalSeconds,          // 5: intervalSeconds
    mockSub.intervalMode,             // 6: intervalMode
    mockSub.checkInRate,              // 7: checkInRate
    mockSub.alertRate,                 // 8: alertRate
    mockSub.balance,                   // 9: balance
    mockSub.totalDrained,             // 10: totalDrained
    mockSub.status,                   // 11: status
    mockSub.lastCheckIn,             // 12: lastCheckIn
    BigInt(0),                        // 13: (unused)
    mockSub.gracePeriodEnds,          // 14: gracePeriodEnds
    mockSub.gracePeriodSeconds,       // 15: gracePeriodSeconds
    mockSub.proposedInterval,         // 16: proposedInterval
    mockSub.sessionVoucherEnabled,    // 17: sessionVoucherEnabled (OKX APP session voucher)
    mockSub.voucherMode,              // 18: voucherMode (0 = Delegated, 1 = Explicit Confirm)
    BigInt(0),                        // 19: (unused)
    mockSub.webhookUrl,               // 20: webhookUrl
  ] : mockSub) : (hasRealSub ? sub : undefined) as unknown;

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#0d1525]/90 px-4 py-3.5">
        <div className="w-16 h-5 bg-white/5 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="w-3/4 h-4 bg-white/5 rounded animate-pulse" />
          <div className="w-1/2 h-3 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="w-16 h-4 bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  if (isError || !displayData) {
    return null;
  }

  const isMockArrayData = displayData && Array.isArray(displayData);
  
  let taskDescription: string;
  let intervalMode: number;
  let balance: bigint;
  let status: number;
  let agentId: bigint;

  if (isMockArrayData) {
    const subData = displayData as unknown[];
    taskDescription = (subData[4] as string) || "Unknown Task";
    intervalMode = Number(subData[6] || 0);
    balance = (subData[9] as bigint) || BigInt(0);
    status = Number(subData[11] || 0);
    agentId = (subData[2] as bigint) || BigInt(0);
  } else {
    const subObj = displayData as any;
    taskDescription = `Subscription #${subscriptionId}`; void subObj;
    intervalMode = Number(subObj?.intervalMode ?? 0);
    balance = subObj?.balance || BigInt(0);
    status = Number(subObj?.status ?? 0);
    agentId = subObj?.agentId || BigInt(0);
  }

  const agentDisplayName = agentProfile?.display_name || (agentIdNum > 0 ? `Agent #${agentIdNum}` : "Unassigned");

  return (
    <Link href={`/dashboard/subscriptions/${subscriptionId}`}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="group relative flex items-center gap-4 rounded-xl border border-white/10 bg-[#0d1525]/90 px-4 py-3.5 hover:border-white/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.08)] transition-all duration-200 cursor-pointer"
      >
        {/* Terminal corner brackets — subtle on rest, crisper on hover */}
        <CornerBrackets
          size="sm"
          weight="hair"
          accent="rgba(168,85,247,0.5)"
          inset={6}
          className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />

        {/* Hover scanline — horizontal sweep left→right (violet for subscriptions) */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          aria-hidden
        >
          <div
            className="absolute top-0 bottom-0 w-px group-hover:animate-[cardScanX_2s_linear_infinite]"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(168,85,247,0.7) 50%, transparent 100%)",
            }}
          />
        </div>

        {/* Status badge */}
        <SubscriptionStatusBadge status={status} />

        {/* Description + agent */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[14px] font-medium truncate">
            {taskDescription.length > 40
              ? taskDescription.slice(0, 40) + "..."
              : taskDescription}
          </p>
          <p className="text-white/40 text-[12px]">
            {agentDisplayName} · {intervalModeLabel(intervalMode)}
          </p>
        </div>

        {/* Balance */}
        <div className="text-right flex-shrink-0">
          <p className="text-white text-[13px]">{formatOG(balance)}</p>
          <p className="text-white/40 text-[11px]">balance</p>
        </div>

        {/* Quick Telegram access — only if a bot is wired for this subscription */}
        {botUsername && (
          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Chat with @${botUsername} on Telegram`}
            className="relative z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#38bdf8]/25 bg-[#38bdf8]/10 text-[#38bdf8] hover:bg-[#38bdf8]/20 hover:border-[#38bdf8]/40 transition-colors flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
            </svg>
            <span className="text-[11px] font-medium">Telegram</span>
          </a>
        )}

        {/* Arrow */}
        <svg
          className="text-white/30 flex-shrink-0"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </motion.div>
    </Link>
  );
}

export { SubscriptionStatusBadge };
