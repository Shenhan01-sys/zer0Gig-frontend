import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

export async function POST(req: NextRequest) {
  try {
    const { digest } = await req.json();
    if (!digest || !String(digest).startsWith("0x")) {
      return NextResponse.json({ error: "Invalid digest" }, { status: 400 });
    }

    const pk = process.env.ORACLE_PRIVATE_KEY as `0x${string}`;
    if (!pk?.startsWith("0x")) {
      return NextResponse.json({ error: "Oracle not configured on server" }, { status: 503 });
    }

    const account = privateKeyToAccount(pk);
    // signMessage applies EIP-191 prefix (\x19Ethereum Signed Message:\n32)
    // — same as what _verifyOracleProof expects in AgentRegistry
    const signature = await account.signMessage({
      message: { raw: digest as `0x${string}` },
    });

    return NextResponse.json({ signature });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Signing failed" },
      { status: 500 }
    );
  }
}
