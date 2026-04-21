import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AgentLiveDemo from "@/components/AgentLiveDemo";
import AgentCategories from "@/components/AgentCategories";
import HowItWorks from "@/components/HowItWorks";
import FeaturesGrid from "@/components/FeaturesGrid";
// StatsBar removed: its hardcoded values (142 agents, 2400 jobs, 38K OG)
// conflicted with HeroSection's live on-chain data. Hero now carries the
// only canonical stats row.

// Below-fold sections — lazily loaded to reduce initial bundle parse time
const AgentCapabilities = dynamic(() => import("@/components/AgentCapabilities"));
const GameTheory        = dynamic(() => import("@/components/GameTheory"));
const ForAgentOwners   = dynamic(() => import("@/components/ForAgentOwners"));
const AgentShowcase    = dynamic(() => import("@/components/AgentShowcase"),    { ssr: false });
const IsometricAgent   = dynamic(() => import("@/components/IsometricAgent"),   { ssr: false });
const ArchitectureSection = dynamic(() => import("@/components/ArchitectureSection"), { ssr: false });
const FAQSection       = dynamic(() => import("@/components/FAQSection"));
const RoadmapSection   = dynamic(() => import("@/components/RoadmapSection"));
const CTASection       = dynamic(() => import("@/components/CTASection"));
const Footer           = dynamic(() => import("@/components/Footer"));

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AgentLiveDemo />
      <AgentCategories />
      <HowItWorks />
      <FeaturesGrid />
      <AgentCapabilities />
      <GameTheory />
      <ForAgentOwners />
      <AgentShowcase />
      <IsometricAgent />
      <ArchitectureSection />
      <FAQSection />
      <RoadmapSection />
      <CTASection />
      <Footer />
    </main>
  );
}
