import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FeaturesHero() {
  return (
    <section className="relative overflow-hidden border-b border-default bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, var(--color-primary-subtle) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-8 text-center sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Features
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Work smarter with{" "}
          <span className="text-primary">Bika-File</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-secondary">
          Everything you need to store, organize, share, and find documents
          safely in the cloud — built for teams that outgrew folders and email
          attachments.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-md transition hover:bg-primary-hover hover:no-underline"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex items-center justify-center rounded-lg border border-default bg-surface px-6 py-3 text-sm font-semibold text-foreground no-underline transition hover:bg-[var(--color-bg-secondary)] hover:no-underline"
          >
            Compare plans
          </Link>
        </div>
      </div>
    </section>
  );
}
