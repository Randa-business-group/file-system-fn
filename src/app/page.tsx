import {
  HeroSection,
  HowItWorksSection,
  LandingShell,
  PricingSection,
} from "@/components/landing-pages";

export default function HomePage() {
  return (
    <LandingShell>
      <HeroSection />
      <HowItWorksSection />
      <PricingSection />
    </LandingShell>
  );
}
