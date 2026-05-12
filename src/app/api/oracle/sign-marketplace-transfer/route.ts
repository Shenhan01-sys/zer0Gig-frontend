import { NextResponse } from "next/server";
import { keccak256, toBytes, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/oracle/sign-marketplace-transfer
//
// Body:
//   {
//     agentId:          number | string,
//     currentVersion:   number,            // from AgentRegistry.getAgentProfile.version
//     oldCapabilityHash: 0x...             // bytes32
//     newCapabilityHash: 0x...             // bytes32 — provided by buyer
//     recipient:         0x...             // buyer's wallet address
//   }
//
// Generates an ECDSA signature over the AgentRegistry transferDigest, signed
// by the configured ORACLE_SIGNER_KEY. This is the same signature schema used
// by /api/oracle/sign — but scoped under a marketplace-specific route so we
// can apply different rate limits / business rules later (e.g. require
// payment escrow already on-chain before issuing the signature).
//
// In production: also verify that an active marketplace listing exists for
// (agentId, sellerAddress) and that the buyer paid into AgentMarketplace
// before issuing the signature.
// ─────────────────────────────────────────────────────────────────────────────

// Reuse the same key as /api/oracle/sign (the iTransfer / iClone signer).
// Falls back to PLATFORM_PRIVATE_KEY (used by /api/oracle/sign-alignment) so
// any one of the three existing oracle envs unblocks marketplace settlement.
const ORACLE_KEY =
  process.env.ORACLE_PRIVATE_KEY
  ?? process.env.ORACLE_SIGNER_KEY
  ?? process.env.ALIGNMENT_SIGNER_KEY
  ?? process.env.PLATFORM_PRIVATE_KEY;

export async function POST(req: Request) {
  if (!ORACLE_KEY) {
    return NextResponse.json(
      { ok: false, error: "Oracle signer key not configured on server" },
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
  const oldCapabilityHash = String(body.oldCapabilityHash ?? "").trim() as `0x${string}`;
  const newCapabilityHash = String(body.newCapabilityHash ?? "").trim() as `0x${string}`;
  const recipient         = String(body.recipient ?? "").trim().toLowerCase() as `0x${string}`;

  // ── Validation ─────────────────────────────────────────────────────────────
  if (agentId === 0n)                                     return badReq("agentId required");
  if (!Number.isFinite(currentVersion) || currentVersion <= 0)
                                                          return badReq("currentVersion required");
  if (!/^0x[a-f0-9]{64}$/i.test(oldCapabilityHash))       return badReq("Invalid oldCapabilityHash");
  if (!/^0x[a-f0-9]{64}$/i.test(newCapabilityHash))       return badReq("Invalid newCapabilityHash");
  if (!/^0x[a-f0-9]{40}$/.test(recipient))                return badReq("Invalid recipient");

  const account = privateKeyToAccount(ORACLE_KEY as `0x${string}`);

  // Mirror AgentRegistry.transferDigest signature:
  //   keccak256(abi.encode(agentId, version, oldHash, newHash, to))
  // and then EIP-191 personal_sign envelope.
  const digest = keccak256(
    encodePacked(
      ["uint256", "uint64", "bytes32", "bytes32", "address"],
      [agentId, BigInt(currentVersion), oldCapabilityHash, newCapabilityHash, recipient],
    ),
  );

  const signature = await account.signMessage({ message: { raw: toBytes(digest) } });

  return NextResponse.json({
    ok: true,
    digest,
    signature,
    signerAddress: account.address,
  });
}

function badReq(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
