import { NextResponse } from "next/server";
import { keccak256, toBytes, encodeAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/oracle/sign-marketplace-transfer
//
// Body:
//   {
//     agentId:           number | string,
//     currentVersion:    number,             // from AgentRegistry.getAgentProfile.version
//     oldCapabilityHash: 0x...               // bytes32
//     newCapabilityHash: 0x...               // bytes32 — provided by buyer
//     recipient:         0x...               // buyer's wallet address
//   }
//
// Generates an ECDSA signature over the AgentRegistry transferDigest.
//
// The on-chain transferDigest is built with `abi.encode` (NOT abi.encodePacked):
//   keccak256(abi.encode(agentId, version, oldHash, newHash, to))
//
// So we mirror it via viem's encodeAbiParameters. The signature is then
// produced over the EIP-191 personal_sign envelope of that digest, matching
// how AgentRegistry._verifyOracleProof recovers the signer.
// ─────────────────────────────────────────────────────────────────────────────

// Reuse the same key as /api/oracle/sign (the iTransfer / iClone signer).
// Falls back to PLATFORM_PRIVATE_KEY (used by /api/oracle/sign-alignment) so
// any one of the four existing oracle envs unblocks marketplace settlement.
const ORACLE_KEY =
  process.env.ORACLE_PRIVATE_KEY
  ?? process.env.ORACLE_SIGNER_KEY
  ?? process.env.ALIGNMENT_SIGNER_KEY
  ?? process.env.PLATFORM_PRIVATE_KEY;

export async function POST(req: Request) {
  try {
    if (!ORACLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Oracle signer key not configured on server (set ORACLE_PRIVATE_KEY)" },
        { status: 500 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const agentId           = BigInt(String(body.agentId ?? "0"));
    const currentVersion    = Number(body.currentVersion ?? 0);
    const oldCapabilityHash = String(body.oldCapabilityHash ?? "").trim();
    const newCapabilityHash = String(body.newCapabilityHash ?? "").trim();
    const recipient         = String(body.recipient ?? "").trim().toLowerCase();

    if (agentId === 0n)                                     return bad("agentId required");
    if (!Number.isFinite(currentVersion) || currentVersion <= 0)
                                                            return bad("currentVersion required");
    if (!/^0x[a-f0-9]{64}$/i.test(oldCapabilityHash))       return bad("Invalid oldCapabilityHash");
    if (!/^0x[a-f0-9]{64}$/i.test(newCapabilityHash))       return bad("Invalid newCapabilityHash");
    if (!/^0x[a-f0-9]{40}$/.test(recipient))                return bad("Invalid recipient");

    // Sanity check the oracle key format before passing to privateKeyToAccount,
    // which throws on malformed input.
    const oracleKeyHex = String(ORACLE_KEY).trim().startsWith("0x")
      ? String(ORACLE_KEY).trim()
      : `0x${String(ORACLE_KEY).trim()}`;
    if (!/^0x[a-f0-9]{64}$/i.test(oracleKeyHex)) {
      return NextResponse.json(
        { ok: false, error: "ORACLE_PRIVATE_KEY format invalid (must be 64-char hex, optionally 0x-prefixed)" },
        { status: 500 },
      );
    }

    const account = privateKeyToAccount(oracleKeyHex as `0x${string}`);

    // Mirror AgentRegistry.transferDigest:
    //   keccak256(abi.encode(agentId, version, oldHash, newHash, to))
    const digest = keccak256(
      encodeAbiParameters(
        [
          { type: "uint256" },
          { type: "uint64"  },
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "address" },
        ],
        [
          agentId,
          BigInt(currentVersion),
          oldCapabilityHash as `0x${string}`,
          newCapabilityHash as `0x${string}`,
          recipient as `0x${string}`,
        ],
      ),
    );

    const signature = await account.signMessage({ message: { raw: toBytes(digest) } });

    return NextResponse.json({
      ok: true,
      digest,
      signature,
      signerAddress: account.address,
    });
  } catch (err) {
    // Last-resort catch — guarantee a JSON body so the caller never sees
    // "Unexpected end of JSON input" on a 500.
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `Oracle signing failed: ${message}` }, { status: 500 });
  }
}

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
