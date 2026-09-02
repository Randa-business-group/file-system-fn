import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ContactHero() {
  return (
    <section className="relative overflow-hidden border-default bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, var(--color-primary-subtle) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Let&apos;s talk about your workflow
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-secondary">
          Questions about pricing, enterprise rollout, or a custom demo? Our
          team typically responds within one business day.
        </p>
      </div>
    </section>
  );
}
