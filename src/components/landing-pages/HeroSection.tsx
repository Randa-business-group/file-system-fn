import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroVideoPlayer } from "./HeroVideoPlayer";
import { HERO_VIDEO } from "./landing-data";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, var(--color-primary-subtle) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:pb-20 lg:pt-12">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-default bg-surface px-3 py-1 text-xs font-medium text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Secure document management for modern teams
          </div>

          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            The better way to{" "}
            <span className="text-primary">manage your files</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-secondary">
            Join organizations that run on FileVault — upload, organize, share,
            and find documents faster with AI-powered workflows built for
            security and scale.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-md transition hover:bg-primary-hover hover:no-underline"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-default bg-surface px-6 py-3 text-sm font-semibold text-foreground no-underline transition hover:bg-[var(--color-bg-secondary)] hover:no-underline"
            >
              Contact sales
            </a>
          </div>

          <p className="mt-6 text-sm text-muted">
            No credit card required · Set up in under 5 minutes
          </p>
        </div>

        <HeroVideoPlayer
          url={HERO_VIDEO.url}
          title={HERO_VIDEO.title}
          posterUrl={HERO_VIDEO.posterUrl}
        />
      </div>
    </section>
  );
}
