import {
  ContactHero,
  ContactSection,
  LandingShell,
} from "@/components/landing-pages";

export default function ContactPage() {
  return (
		<LandingShell>
			<ContactHero />
			<div className='bg-background'>
				<ContactSection />
			</div>
		</LandingShell>
  );
}
