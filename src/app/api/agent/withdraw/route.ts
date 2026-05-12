import { NextResponse } from "next/server";

/**
 * POST /api/agent/withdraw
 *
 * Phase-1 stub for the agent wallet withdrawal flow. Accepts a signed
 * intent message from the iNFT owner and returns a fake tx hash after a
 * simulated processing delay.
 *
 * Phase-2 (production) will:
 *   1. Recover the message signer and verify against AgentRegistry.ownerOf(agentId)
 *   2. Validate timestamp freshness (replay protection — 5 minute window)
 *   3. Validate amount <= eth_getBalance(agent.agentWallet) - gasReserve
 *   4. POST to agent-runtime's /v1/agents/{id}/withdraw to dispatch the
 *      real native OG transfer signed by the agent's key
 *   5. Return the real on-chain tx hash
 *
 * See Docs/Frontend/Components/Page/WithdrawalFlow.md for the full design.
 */

interface WithdrawRequest {
  agentId:     string;
  amount:      string;   // OG, decimal string
  destination: string;   // 0x EOA address
  signature:   string;   // owner signature over `message`
  message:     string;   // canonical message body
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<WithdrawRequest>;
    const { agentId, amount, destination, signature, message } = body;

    if (!agentId || !amount || !destination || !signature || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: agentId, amount, destination, signature, message" },
        { status: 400 },
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(destination)) {
      return NextResponse.json(
        { ok: false, error: "Invalid destination address" },
        { status: 400 },
      );
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid amount" },
        { status: 400 },
      );
    }

    // Simulate processing delay so the multi-state button UX renders the
    // 'Processing On-Chain' state for a beat. Real impl: actual broadcast time.
    await new Promise(resolve => setTimeout(resolve, 1800));

    // Phase-1 mock tx hash — a 32-byte hex that's clearly not a real chain hash.
    // Phase-2 returns the real result from agent-runtime.
    const mockSuffix = Date.now().toString(16);
    const txHash = ("0x" + "00".repeat(32 - Math.ceil(mockSuffix.length / 2)) + mockSuffix).slice(0, 66);

    return NextResponse.json({
      ok:     true,
      txHash,
      mock:   true,
      hint:   "Stubbed — see Docs/Frontend/Components/Page/WithdrawalFlow.md for Phase-2 plan.",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Withdraw failed" },
      { status: 500 },
    );
  }
}
