"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING_PLANS } from "./landing-data";
import { AnimatedSection } from "./motion";

function formatPrice(price: number): string {
  return price.toLocaleString("en-RW");
}

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-default bg-background py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <AnimatedSection animation="fade-up" delay={100} duration={600}>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Simple pricing that grows with your team
            </h2>
          </AnimatedSection>
          <AnimatedSection animation="fade-up" delay={200} duration={600}>
            <p className="mt-4 text-base text-secondary">
              Start free, upgrade when you&apos;re ready. No hidden fees, no surprise charges.
            </p>
          </AnimatedSection>

          {/* Billing cycle interactive toggle */}
          <AnimatedSection animation="fade-up" delay={250} duration={600}>
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-default bg-surface p-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  billingCycle === "annual"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>Annual billing</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    billingCycle === "annual"
                      ? "bg-white/20 text-white"
                      : "bg-primary-subtle text-primary"
                  }`}
                >
                  Save 20%
                </span>
              </button>
            </div>
          </AnimatedSection>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan, index) => {
            const calculatedPrice =
              plan.price !== null
                ? billingCycle === "annual"
                  ? Math.round(plan.price * 0.8)
                  : plan.price
                : null;

            return (
              <AnimatedSection
                key={plan.id}
                animation="fade-up"
                delay={150 + index * 100}
                duration={600}
              >
                <article
                  className={[
                    "relative flex h-full flex-col rounded-lg border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-8",
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
                    <p className="mt-2 text-sm text-secondary min-h-[40px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-end gap-1">
                    {calculatedPrice !== null ? (
                      <>
                        <span className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                          {formatPrice(calculatedPrice)}
                        </span>
                        <span className="mb-1 text-sm text-muted">
                          {plan.currency} / {plan.period}
                        </span>
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
                      "mt-8 inline-flex items-center justify-center rounded-md px-4 py-3 text-sm font-semibold no-underline transition hover:no-underline active:translate-y-0",
                      plan.highlighted
                        ? "shimmer-btn-wrapper bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground shadow-sm hover:shadow-md"
                        : "border border-default bg-surface text-foreground hover:bg-[var(--color-bg-secondary)]",
                    ].join(" ")}
                  >
                    {plan.cta}
                  </Link>
                </article>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
