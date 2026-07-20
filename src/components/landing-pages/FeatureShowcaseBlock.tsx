import { Check } from "lucide-react";
import Image from "next/image";
import type { FeatureShowcase } from "./landing-data";
import { FEATURE_SHOWCASES } from "./landing-data";

function FeatureImageMock({ image, label }: { image: string; label: string }) {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="relative overflow-hidden rounded-2xl border border-default bg-surface shadow-lg">
        <div
          className="relative flex aspect-[4/3] items-center justify-center bg-[var(--color-bg-secondary)] p-4"
        >
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

export function FeatureShowcaseBlock({
  feature,
  index,
}: {
  feature: FeatureShowcase;
  index: number;
}) {
  const imageFirst = feature.imageSide === "left";
  const isAlt = index % 2 === 1;

  return (
    <section
      id={feature.id}
      className={[
        "scroll-mt-20 pb-10 sm:pb-12 lg:pb-14",
        index === 0 ? "pt-0" : "pt-10 sm:pt-12 lg:pt-14",
        isAlt ? "bg-[var(--color-bg-secondary)]" : "bg-background",
      ].join(" ")}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <div className={imageFirst ? "lg:order-2" : "lg:order-1"}>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {feature.title}
          </h2>
          {feature.subtitle && (
            <p className="mt-4 text-base leading-relaxed text-secondary">
              {feature.subtitle}
            </p>
          )}
          <ul className="mt-8 space-y-4">
            {feature.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 text-sm leading-relaxed text-secondary sm:text-base"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={imageFirst ? "lg:order-1" : "lg:order-2"}>
          <FeatureImageMock image={feature.image} label={feature.imageLabel} />
        </div>
      </div>
    </section>
  );
}

export function FeaturesShowcaseList() {
  return (
    <>
      {FEATURE_SHOWCASES.map((feature, index) => (
        <FeatureShowcaseBlock key={feature.id} feature={feature} index={index} />
      ))}
    </>
  );
}
