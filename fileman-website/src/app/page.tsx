import Features from "@/components/features-1";
import FooterSection from "@/components/footer";
import HeroSection from "@/components/hero-section";
import IntegrationsSection from "@/components/integrations-4";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Features />
      <IntegrationsSection />
      <FooterSection />
    </>
  );
}
