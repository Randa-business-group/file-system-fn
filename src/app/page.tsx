import {
  FAQSection,
  HeroSection,
  HowItWorksSection,
  LandingShell,
  PricingSection,
  ProblemSection,
  SolutionSection,
} from "@/components/landing-pages";

export default function HomePage() {
  return (
    <LandingShell>
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <PricingSection />
      <HowItWorksSection />
      <FAQSection />
    </LandingShell>
  );
}
