import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { keccak256, encodeAbiParameters, parseAbiParameters } from "viem";

/**
 * POST /api/oracle/sign-alignment
 *
 * Signs an alignment result for ProgressiveEscrow.releaseMilestone().
 * Uses PLATFORM_PRIVATE_KEY — must match the alignmentNodeVerifier set
 * in the deployed ProgressiveEscrow constructor.
 *
 * Body: { jobId: string, milestoneIndex: number, alignmentScore: number, outputHash: `0x${string}` }
 * Returns: { signature: `0x${string}`, alignmentScore: number, messageHash: `0x${string}` }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, milestoneIndex, alignmentScore, outputHash } = body as {
      jobId: string;
      milestoneIndex: number;
      alignmentScore: number;
      outputHash: `0x${string}`;
    };

    if (!jobId || milestoneIndex === undefined || !alignmentScore || !outputHash) {
      return NextResponse.json({ error: "Missing required fields: jobId, milestoneIndex, alignmentScore, outputHash" }, { status: 400 });
    }
    if (!outputHash.startsWith("0x") || outputHash.length !== 66) {
      return NextResponse.json({ error: "outputHash must be a 32-byte hex string (0x + 64 chars)" }, { status: 400 });
    }

    const rawKey = process.env.PLATFORM_PRIVATE_KEY;
    if (!rawKey) {
      return NextResponse.json({ error: "PLATFORM_PRIVATE_KEY not configured on server" }, { status: 503 });
    }
    const pk = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;

    // Must match ProgressiveEscrow.releaseMilestone line 372:
    // keccak256(abi.encode(jobId, milestoneIndex, alignmentScore, outputHash))
    const messageHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters("uint256, uint8, uint16, bytes32"),
        [BigInt(jobId), milestoneIndex, alignmentScore, outputHash]
      )
    );

    const account = privateKeyToAccount(pk);
    // EIP-191 prefix applied by signMessage — matches \x19Ethereum Signed Message:\n32 in contract
    const signature = await account.signMessage({ message: { raw: messageHash } });

    return NextResponse.json({ signature, alignmentScore, messageHash });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Signing failed" },
      { status: 500 }
    );
  }
}
