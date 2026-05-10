"use client";
import AgentPortfolio from "@/components/agents/AgentPortfolio";

// Mock the fetch so we don't need a real DB
const MOCK_ENTRIES = [
  {
    id: 1, category: "content_creation",
    summary: "5 short-form videos created for social media campaigns using Qwen-2.5-7B",
    platforms: ["youtube", "tiktok", "instagram"], output_types: ["mp4", "mp3"],
    compute_model: "qwen-2.5-7b", zg_res_key: "0xabc123...",
    proof_bundle_cid: "0x7f3a9b2c1d4e5f6a7b8c9d0e1f2a3b4c",
    tx_hash: "0xdeadbeef", created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2, category: "research",
    summary: "Competitive market analysis report with 30-page findings",
    platforms: [], output_types: ["pdf", "text"],
    compute_model: "qwen-2.5-7b", zg_res_key: "0xdef456...",
    proof_bundle_cid: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    tx_hash: "0xcafebabe", created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 3, category: "coding",
    summary: "Smart contract audit and gas optimization for ERC-20 token",
    platforms: [], output_types: ["text"],
    compute_model: "gemma-3-27b", zg_res_key: null,
    proof_bundle_cid: null, tx_hash: "0x11223344",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 4, category: "trading",
    summary: "Automated trading strategy backtested on 90-day BTC/USDT data",
    platforms: [], output_types: ["pdf", "text"],
    compute_model: "qwen-2.5-7b", zg_res_key: "0xghi789...",
    proof_bundle_cid: "0x9z8y7x6w5v4u3t2s1r0q",
    tx_hash: "0xfeedface", created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 5, category: "writing",
    summary: "10 SEO-optimized blog articles on DeFi and Web3 topics",
    platforms: [], output_types: ["text"],
    compute_model: "qwen-2.5-7b", zg_res_key: "0xjkl012...",
    proof_bundle_cid: "0xaabbccddeeff001122",
    tx_hash: "0xabcdef01", created_at: new Date(Date.now() - 86400000 * 21).toISOString(),
  },
];

// Patch global fetch for this test page only
if (typeof window !== "undefined") {
  const _origFetch = window.fetch;
  (window as any).fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString();
    if (url.includes("/api/agent-portfolio")) {
      return Promise.resolve(new Response(JSON.stringify(MOCK_ENTRIES), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    }
    return _origFetch(input, init);
  };
}

export default function TestPortfolio() {
  return (
    <main className="min-h-screen bg-[#050810] p-8">
      <div className="max-w-[1000px] mx-auto space-y-6">
        <p className="text-white/30 text-xs font-mono">test-portfolio — mock data, no auth</p>

        {/* Portfolio card (same structure as in agent detail page) */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#060913] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-[12px] font-mono font-bold text-white/70 uppercase tracking-widest">
                Portfolio
              </h3>
              <p className="text-[10px] text-white/25 mt-0.5">
                Completed tasks · verified by 0G Compute
              </p>
            </div>
            <div
              className="px-2 py-0.5 rounded text-[9px] font-mono"
              style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}
            >
              ON-CHAIN PROOF
            </div>
          </div>
          <AgentPortfolio agentId={1} />
        </div>

        {/* Empty state test */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#060913] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-[12px] font-mono font-bold text-white/40 uppercase tracking-widest">
              Empty state
            </h3>
          </div>
          <AgentPortfolio agentId={9999} />
        </div>
      </div>
    </main>
  );
}
