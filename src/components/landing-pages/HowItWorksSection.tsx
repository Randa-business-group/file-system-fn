import {
  Building2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "./landing-data";
import { AnimatedSection } from "./motion";

const ICONS = {
  building: Building2,
  upload: UploadCloud,
  shield: ShieldCheck,
} as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-default bg-background py-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <AnimatedSection animation="fade-up" delay={100} duration={600}>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Get started in three simple steps
            </h2>
          </AnimatedSection>
          <AnimatedSection animation="fade-up" delay={200} duration={600}>
            <p className="mt-4 text-base leading-relaxed text-secondary">
              No complicated setup. No training required. Your team can be up and running in under 5 minutes.
            </p>
          </AnimatedSection>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((item, index) => {
            const Icon = ICONS[item.icon as keyof typeof ICONS];
            return (
              <AnimatedSection
                key={item.step}
                animation="fade-up"
                delay={150 + index * 100}
                duration={600}
                className="relative"
              >
                <article className="group relative h-full rounded-lg border border-default bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-subtle text-primary transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs font-medium text-muted">{item.step}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary">{item.description}</p>
                  {index < HOW_IT_WORKS_STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute -right-3 top-1/2 hidden h-px w-6 bg-default lg:block"
                    />
                  )}
                </article>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
