import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FeaturesCta() {
  return (
    <section className="border-t border-default bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Start your free trial today
        </h2>
        <p className="mt-4 text-base text-secondary">
          Get secure document management for your team — set up in minutes.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-md transition hover:bg-primary-hover hover:no-underline"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
