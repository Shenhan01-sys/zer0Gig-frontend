import dynamic from "next/dynamic";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import FeaturesGrid from "@/components/FeaturesGrid";
import OnboardingGate from "@/components/OnboardingGate";
// StatsBar removed: its hardcoded values (142 agents, 2400 jobs, 38K OG)
// conflicted with HeroSection's live on-chain data. Hero now carries the
// only canonical stats row.
//
// Sections retained in /components but unwired from page.tsx (kept for
// possible reintroduction): AgentLiveDemo, AgentCategories, GameTheory,
// AgentShowcase, ArchitectureSection, RoadmapSection.

// Below-fold sections — lazily loaded to reduce initial bundle parse time
const CommunityGlobe   = dynamic(() => import("@/components/CommunityGlobe"),   { ssr: false });
const MarketReadiness  = dynamic(() => import("@/components/MarketReadiness"));
const IndonesiaBridge  = dynamic(() => import("@/components/IndonesiaBridge"));
const FullStackLive    = dynamic(() => import("@/components/FullStackLive"));
const AgentCapabilities = dynamic(() => import("@/components/AgentCapabilities"));
const ForAgentOwners   = dynamic(() => import("@/components/ForAgentOwners"));
const IsometricAgent   = dynamic(() => import("@/components/IsometricAgent"),   { ssr: false });
const AutonomousProof  = dynamic(() => import("@/components/AutonomousProof"));
const PartnershipTrust = dynamic(() => import("@/components/PartnershipTrust"));
const FAQSection       = dynamic(() => import("@/components/FAQSection"));
const CTASection       = dynamic(() => import("@/components/CTASection"));
const Footer           = dynamic(() => import("@/components/Footer"));

export default function Home() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <OnboardingGate />
      </Suspense>
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <CommunityGlobe />
      <FeaturesGrid />
      <MarketReadiness />
      <IndonesiaBridge />
      <FullStackLive />
      <AgentCapabilities />
      <AutonomousProof />
      <ForAgentOwners />
      <IsometricAgent />
      <PartnershipTrust />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
