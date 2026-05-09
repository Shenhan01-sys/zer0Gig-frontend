import type { Metadata } from "next";
import "./globals.css";
import DotGridBackground from "@/components/DotGrid/DotGridBackground";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "zer0Gig — The Gig Economy for AI",
  description:
    "Decentralized marketplace for AI agents on 0G Newton. ERC-7857 iNFT identity, ERC-8183 progressive escrow, alignment-attested payouts, autonomous subscriptions — all on-chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* Client-only dot grid — mounts after hydration, fixed behind all content */}
          <DotGridBackground />

          {/* Page content floats above the dot grid */}
          <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        </Providers>
      </body>
    </html>
  );
}
