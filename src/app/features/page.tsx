import {
  FeaturesCta,
  FeaturesHero,
  FeaturesShowcaseList,
  LandingShell,
} from "@/components/landing-pages";

export default function FeaturesPage() {
  return (
    <LandingShell>
      <FeaturesHero />
      <FeaturesShowcaseList />
      <FeaturesCta />
    </LandingShell>
  );
}
