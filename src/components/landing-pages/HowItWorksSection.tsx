import {
  BarChart3,
  Building2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "./landing-data";

const ICONS = {
  building: Building2,
  upload: UploadCloud,
  shield: ShieldCheck,
  chart: BarChart3,
} as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-default bg-[var(--color-bg-secondary)] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            From upload to insight in four simple steps
          </h2>
          <p className="mt-4 text-base leading-relaxed text-secondary">
            FileVault brings your documents, teams, and workflows together — so
            you spend less time searching and more time delivering results.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((item, index) => {
            const Icon = ICONS[item.icon];
            return (
              <article
                key={item.step}
                className="group relative rounded-2xl border border-default bg-surface p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs font-medium text-muted">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  {item.description}
                </p>
                {index < HOW_IT_WORKS_STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -right-3 top-1/2 hidden h-px w-6 bg-default lg:block"
                  />
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
