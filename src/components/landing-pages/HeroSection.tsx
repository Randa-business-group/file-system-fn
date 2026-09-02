import Link from "next/link";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { HeroDashboardMock } from "./HeroDashboardMock";
import { HERO_STATS } from "./landing-data";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Gradient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, var(--color-primary-subtle) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8 lg:pb-16 lg:pt-12">
        {/* Text content — centered above the dashboard */}
        <div className="mx-auto max-w-3xl text-center">

          {/* Headline — focused on the end result */}
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            Document.{" "}
            <span className="text-primary">
              Organized, secure, and found in seconds.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-secondary">
            Stop losing files in email threads and scattered folders.
            Bika-File gives your team one secure vault to upload, organize,
            share, and find any document powered by AI.
          </p>

          {/* Fear-removal bullets */}
          <ul className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-5">
            {["No credit card required", "Setup in 2 minutes", "Cancel anytime"].map(
              (item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-secondary"
                >
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ),
            )}
          </ul>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-md transition hover:bg-primary-hover hover:no-underline"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-default bg-surface px-6 py-3 text-sm font-semibold text-foreground no-underline transition hover:bg-[var(--color-bg-secondary)] hover:no-underline"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-12 sm:mt-14 lg:mt-16">
          <HeroDashboardMock />
        </div>

        {/* Social proof stats bar */}
        <div className="mt-12 rounded-2xl border border-default bg-surface p-6 shadow-sm sm:mt-14 sm:p-8">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
