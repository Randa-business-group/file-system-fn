import {
  ContactHero,
  ContactSection,
  LandingShell,
} from "@/components/landing-pages";

export default function ContactPage() {
  return (
    <LandingShell>
      <ContactHero />
      <div className="bg-[var(--color-bg-secondary)]">
        <ContactSection />
      </div>
    </LandingShell>
  );
}
