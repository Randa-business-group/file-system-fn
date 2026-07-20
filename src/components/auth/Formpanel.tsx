"use client";

import Link from "next/link";
import { UnderlineField } from "./Underlinefield";
import type { LoginErrors, LoginFormValues } from "@/types/login";

interface FormPanelProps {
  values: LoginFormValues;
  errors: LoginErrors;
  isSubmitting: boolean;
  isValid: boolean;
  onUpdateValue: <K extends keyof LoginFormValues>(
    key: K,
    value: LoginFormValues[K],
  ) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function FormPanel({
  values,
  errors,
  isSubmitting,
  isValid,
  onUpdateValue,
  onSubmit,
}: FormPanelProps) {
  return (
    <div
      className={[
        /* Positioning & stacking */
        "relative z-10",
        /* On mobile: full width, normal flow. On lg+: fixed width with diagonal clip */
        "w-full lg:w-[68%] lg:min-w-[620px] lg:max-w-[760px]",
        /* Background */
        "bg-surface",
        /* Shadow only on lg+ where the diagonal overlaps the visual panel */
        "lg:[box-shadow:20px_0_70px_rgba(0,0,0,0.12)]",
        /* Diagonal right edge only on large screens */
        "lg:[clip-path:polygon(0_0,100%_0,80%_100%,0_100%)]",
        /* Layout */
        "flex flex-col justify-center",
        /* Spacing: generous on desktop, compact on mobile */
        "px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12",
      ].join(" ")}
    >
      {/* Subtle ambient glow (desktop only) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 hidden h-72 w-72 rounded-full lg:block"
        style={{
          background:
            "radial-gradient(circle, rgba(74,180,120,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── Main form area ───────────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center lg:max-w-[360px]">
        {/* Heading */}
        <div
          className="mb-9 animate-[fadeUp_0.35s_ease_both]"
          style={{ animationDelay: "0.08s" }}
        >
          <h1 className="mb-2 font-light leading-[1.12] tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="text-[13px] text-muted">
            Enter your credentials to access your vault
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          {/* Email */}
          <div
            className="animate-[fadeUp_0.4s_ease_both]"
            style={{ animationDelay: "0.16s" }}
          >
            <UnderlineField
              id="email"
              label="Email address"
              type="email"
              value={values.email}
              onChange={(v) => onUpdateValue("email", v)}
              error={errors.email}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div
            className="animate-[fadeUp_0.4s_ease_both]"
            style={{ animationDelay: "0.24s" }}
          >
            <UnderlineField
              id="password"
              label="Password"
              type="password"
              value={values.password}
              onChange={(v) => onUpdateValue("password", v)}
              error={errors.password}
              autoComplete="current-password"
            />
          </div>

          {/* Remember me + Forgot password */}
          <div
            className="flex items-center justify-between animate-[fadeUp_0.4s_ease_both]"
            style={{ animationDelay: "0.32s" }}
          >
            <label className="flex cursor-pointer select-none items-center gap-2 text-[12px] text-secondary">
              <input
                type="checkbox"
                checked={values.rememberMe}
                onChange={(e) => onUpdateValue("rememberMe", e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer rounded accent-[var(--color-primary)]"
              />
              Keep me signed in
            </label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium text-primary/75 no-underline transition-opacity hover:opacity-100"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <div
            className="animate-[fadeUp_0.4s_ease_both]"
            style={{ animationDelay: "0.40s" }}
          >
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-[3px] py-3.5",
                "text-[11px] font-bold uppercase tracking-[0.14em]",
                "transition-all duration-200",

                isValid && !isSubmitting
                  ? "bg-primary text-primary-foreground hover:-translate-y-px hover:brightness-105 hover:shadow-lg"
                  : "bg-primary/20 text-gray-400 cursor-not-allowed",
              ].join(" ")}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin"
                    style={{ width: 13, height: 13 }}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      opacity="0.25"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        {/* Register link */}
        <p
          className="mt-7 text-center text-[12px] text-muted animate-[fadeUp_0.4s_ease_both]"
          style={{ animationDelay: "0.50s" }}
        >
          No account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary/85 no-underline transition-opacity hover:opacity-100"
          >
            Sign Up →
          </Link>
        </p>
      </div>
    </div>
  );
}
