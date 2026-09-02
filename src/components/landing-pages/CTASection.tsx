import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="border-t border-default bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center shadow-xl sm:px-12 sm:py-20">
          {/* Decorative gradient */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 110%, rgba(255,255,255,0.12) 0%, transparent 70%)",
            }}
          />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
              Stop losing documents. Start running your team smarter.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-primary-foreground/80">
              Join hundreds of organizations that use Bika-File to keep every
              document organized, secure, and instantly accessible.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary no-underline shadow-md transition hover:bg-gray-50 hover:no-underline"
              >
                Contact us
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-primary-foreground no-underline transition hover:bg-white/10 hover:no-underline"
              >
                Start free trial
              </Link>
            </div>

            <p className="mt-6 text-sm text-primary-foreground/60">
              No credit card required · Setup in 2 minutes · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
