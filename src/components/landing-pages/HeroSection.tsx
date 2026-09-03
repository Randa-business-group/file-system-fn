import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { HeroDashboardMock } from "./HeroDashboardMock";
import { HERO_STATS } from "./landing-data";
import { AnimatedSection, CountUp } from "./motion";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Gradient background — original exact radial gradient */}
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
          {/* Headline */}
          <AnimatedSection animation="fade-up" delay={150} duration={700}>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
              Document.{" "}
              <span className="text-gradient-shimmer">
                Organized, secure, and found in seconds.
              </span>
            </h1>
          </AnimatedSection>

          {/* Subheadline */}
          <AnimatedSection animation="fade-up" delay={250} duration={700}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-secondary">
              Stop losing files in email threads and scattered folders. Bika-File gives your team one secure
              vault to upload, organize, share, and find any document powered by AI.
            </p>
          </AnimatedSection>

          {/* Fear-removal bullets */}
          <AnimatedSection animation="fade-up" delay={350} duration={700}>
            <ul className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-5">
              {["No credit card required", "Setup in 2 minutes", "Cancel anytime"].map((item) => (
                <li
                  key={item}
                  className="group flex items-center gap-2 text-sm text-secondary transition-transform duration-200 hover:scale-105"
                >
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:scale-110" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </AnimatedSection>

          {/* CTA buttons */}
          <AnimatedSection animation="fade-up" delay={450} duration={700}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group shimmer-btn-wrapper relative inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:text-primary-foreground hover:shadow-lg hover:no-underline active:translate-y-0"
              >
                <span>Start free trial</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
              </Link>
              <a
                href="/#how-it-works"
                className="inline-flex items-center justify-center rounded-md border border-default bg-surface px-6 py-3 text-sm font-semibold text-foreground no-underline shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-[var(--color-bg-secondary)] hover:shadow-md hover:no-underline active:translate-y-0"
              >
                See how it works
              </a>
            </div>
          </AnimatedSection>
        </div>

        {/* Dashboard mockup */}
        <AnimatedSection animation="zoom-in" delay={250} duration={800} className="mt-12 sm:mt-14 lg:mt-16">
          <HeroDashboardMock />
        </AnimatedSection>

        {/* Social proof stats bar — exact original background & padding preserved */}
        <AnimatedSection animation="fade-up" delay={350} duration={800} className="mt-12 sm:mt-14">
          <div className="rounded-2xl border border-default bg-surface p-6 shadow-sm sm:p-8">
            <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
              {HERO_STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className="text-center transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <p className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                    <CountUp value={stat.value} duration={1600 + i * 200} />
                  </p>
                  <p className="mt-1 text-sm text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
