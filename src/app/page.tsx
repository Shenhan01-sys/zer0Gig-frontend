import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LogoMarquee from "@/components/LogoMarquee";
import HowItWorks from "@/components/HowItWorks";
import FeaturesGrid from "@/components/FeaturesGrid";
import GameTheory from "@/components/GameTheory";
import AgentShowcase from "@/components/AgentShowcase";
import ArchitectureSection from "@/components/ArchitectureSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-black min-h-screen">
      <Navbar />
      <HeroSection />
      <LogoMarquee />
      <HowItWorks />
      <FeaturesGrid />
      <GameTheory />
      <AgentShowcase />
      <ArchitectureSection />
      <CTASection />
      <Footer />
    </main>
  );
}
