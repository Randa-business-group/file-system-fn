"use client";

import { FormEvent, useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Message sent", {
        description: "We'll get back to you shortly.",
      });
      form.reset();
    }, 600);
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Contact
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Let&apos;s talk about your document workflow
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-secondary">
              Questions about pricing, enterprise rollout, or a custom demo?
              Reach out and our team will respond within one business day.
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3 text-sm text-secondary">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                  <Mail className="h-4 w-4" />
                </span>
                hello@bikafile.app
              </li>
              <li className="flex items-center gap-3 text-sm text-secondary">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                  <Phone className="h-4 w-4" />
                </span>
                +1 (555) 012-3456
              </li>
              <li className="flex items-center gap-3 text-sm text-secondary">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                Kigali, Rwanda · Remote-first team
              </li>
            </ul>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-default bg-surface p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                Full name
                <input
                  required
                  name="name"
                  type="text"
                  placeholder="Jane Doe"
                  className="rounded-lg border border-default bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                Work email
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="jane@company.com"
                  className="rounded-lg border border-default bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-foreground">
              Company
              <input
                name="company"
                type="text"
                placeholder="Acme Inc."
                className="rounded-lg border border-default bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-foreground">
              Message
              <textarea
                required
                name="message"
                rows={5}
                placeholder="Tell us about your team and document needs..."
                className="resize-none rounded-lg border border-default bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? "Sending…" : "Send message"}
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
