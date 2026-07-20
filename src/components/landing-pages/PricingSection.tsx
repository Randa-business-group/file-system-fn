import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING_PLANS } from "./landing-data";

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Find the right plan for your team
          </h2>
          <p className="mt-4 text-base text-secondary">
            Mock pricing for now — you can update plans and amounts anytime.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={[
                "relative flex flex-col rounded-2xl border p-6 shadow-sm sm:p-8",
                plan.highlighted
                  ? "border-primary bg-surface shadow-lg ring-1 ring-primary/20"
                  : "border-default bg-surface",
              ].join(" ")}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}

              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-secondary">{plan.description}</p>
              </div>

              <div className="mt-6 flex items-end gap-1">
                {plan.price !== null ? (
                  <>
                    <span className="text-4xl font-semibold tracking-tight text-foreground">
                      ${plan.price}
                    </span>
                    <span className="mb-1 text-sm text-muted">{plan.period}</span>
                  </>
                ) : (
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    {plan.period}
                  </span>
                )}
              </div>

              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-secondary"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.id === "enterprise" ? "/contact" : "/register"}
                className={[
                  "mt-8 inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold no-underline transition hover:no-underline",
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : "border border-default bg-surface text-foreground hover:bg-[var(--color-bg-secondary)]",
                ].join(" ")}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
