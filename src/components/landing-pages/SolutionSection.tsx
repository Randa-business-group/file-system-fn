import { Check } from "lucide-react";
import Image from "next/image";
import type { FeatureShowcase } from "./landing-data";
import { LANDING_FEATURES } from "./landing-data";
import { AnimatedSection } from "./motion";

function FeatureImage({ image, label }: { image: string; label: string }) {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="relative overflow-hidden rounded-lg border border-default bg-surface shadow-lg transition-transform duration-300 hover:scale-[1.01]">
        <div className="relative flex aspect-[4/3] items-center justify-center bg-background p-4">
          <Image
            src={image}
            alt={label}
            width={640}
            height={480}
            className="h-full w-full rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: FeatureShowcase;
  index: number;
}) {
  const imageFirst = feature.imageSide === "left";
  const isAlt = index % 2 === 1;

  return (
    <div className={["py-10 sm:py-12 lg:py-14", isAlt ? "bg-background" : "bg-background"].join(" ")}>
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <div className={imageFirst ? "lg:order-2" : "lg:order-1"}>
          <AnimatedSection
            animation={imageFirst ? "fade-left" : "fade-right"}
            delay={100}
            duration={600}
          >
            {/* Benefit badge */}
            <span className="mb-3 inline-flex items-center rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
              {feature.benefit}
            </span>

            <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {feature.title}
            </h3>
            {feature.subtitle && (
              <p className="mt-4 text-base leading-relaxed text-secondary">{feature.subtitle}</p>
            )}
            <ul className="mt-8 space-y-4">
              {feature.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 text-sm leading-relaxed text-secondary sm:text-base"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary transition-transform duration-200 hover:scale-110">
                    <Check
                      className="h-3.5 w-3.5"
                      strokeWidth={3}
                    />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </AnimatedSection>
        </div>

        <div className={imageFirst ? "lg:order-1" : "lg:order-2"}>
          <AnimatedSection
            animation={imageFirst ? "fade-right" : "fade-left"}
            delay={150}
            duration={600}
          >
            <FeatureImage
              image={feature.image}
              label={feature.imageLabel}
            />
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}

export function SolutionSection() {
  return (
    <section id="features" className="scroll-mt-20">
      {/* Section header */}
      <div className="bg-background pb-4 pt-20 sm:pt-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up" delay={100} duration={600}>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              A better way to manage your documents
            </h2>
          </AnimatedSection>
          <AnimatedSection animation="fade-up" delay={200} duration={600}>
            <p className="mt-4 text-base leading-relaxed text-secondary">
              Bika-File replaces your scattered files with one AI-powered vault
              — so your team can focus on what matters.
            </p>
          </AnimatedSection>
        </div>
      </div>

      {/* Feature blocks */}
      {LANDING_FEATURES.map((feature, index) => (
        <FeatureCard key={feature.id} feature={feature} index={index} />
      ))}
    </section>
  );
}
