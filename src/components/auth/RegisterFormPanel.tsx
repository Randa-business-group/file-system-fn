"use client";

import Link from "next/link";
import { RegisterAdminStep } from "./RegisterAdminStep";
import { RegisterOrganizationStep } from "./RegisterOrganizationStep";
import { RegisterStepIndicator } from "./RegisterStepIndicator";
import type { RegisterErrors, RegisterFormValues } from "@/types/register";

interface RegisterFormPanelProps {
  values: RegisterFormValues;
  errors: RegisterErrors;
  currentStep: 1 | 2;
  isSubmitting: boolean;
  isValid: boolean;
  onUpdateValue: <K extends keyof RegisterFormValues>(
    key: K,
    value: RegisterFormValues[K],
  ) => void;
  onBlurField?: (key: keyof RegisterFormValues) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function RegisterFormPanel({
  values,
  errors,
  currentStep,
  isSubmitting,
  isValid,
  onUpdateValue,
  onBlurField,
  onNextStep,
  onPreviousStep,
  onSubmit,
}: RegisterFormPanelProps) {
  return (
    <div
      className={[
        "relative z-10",
        "w-full lg:w-[68%] lg:min-w-[620px] lg:max-w-[760px]",
        "bg-surface",
        "lg:[box-shadow:20px_0_70px_rgba(0,0,0,0.12)]",
        "lg:[clip-path:polygon(0_0,100%_0,80%_100%,0_100%)]",
        "flex flex-col justify-center",
        "px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12",
      ].join(" ")}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-20 hidden h-72 w-72 rounded-full lg:block"
        style={{
          background:
            "radial-gradient(circle, rgba(74,180,120,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="mx-auto flex w-full max-w-sm flex-col justify-center lg:max-w-[360px]">
        <div
          className="mb-6 animate-[fadeUp_0.35s_ease_both]"
          style={{ animationDelay: "0.08s" }}
        >
          <h1 className="mb-2 font-light leading-[1.12] tracking-tight text-foreground">
            Create account
          </h1>
          <p className="text-[13px] text-muted">
            Set up your workspace and administrator access
          </p>
        </div>

        <div
          className="mb-7 animate-[fadeUp_0.38s_ease_both]"
          style={{ animationDelay: "0.14s" }}
        >
          <RegisterStepIndicator currentStep={currentStep} />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div
            className="animate-[fadeUp_0.4s_ease_both]"
            style={{ animationDelay: "0.20s" }}
          >
            {currentStep === 1 ? (
              <RegisterOrganizationStep
                values={values}
                errors={errors}
                onUpdateValue={onUpdateValue}
                onBlurField={onBlurField}
              />
            ) : (
              <RegisterAdminStep
                values={values}
                errors={errors}
                onUpdateValue={onUpdateValue}
                onBlurField={onBlurField}
              />
            )}
          </div>

          <div
            className="animate-[fadeUp_0.4s_ease_both]"
            style={{ animationDelay: "0.30s" }}
          >
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={onNextStep}
                className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-primary py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-foreground transition-all duration-200 hover:-translate-y-px hover:brightness-105 hover:shadow-lg cursor-pointer"
              >
                Continue
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onPreviousStep}
                  className="flex items-center justify-center gap-2 rounded-[3px] border border-[var(--color-border)] py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-secondary transition-all duration-200 hover:border-[var(--color-primary)] hover:text-primary cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={[
                    "flex items-center justify-center gap-2 rounded-[3px] py-3.5",
                    "text-[11px] font-bold uppercase tracking-[0.14em]",
                    "transition-all duration-200",
                    isSubmitting
                      ? "bg-primary/40 text-primary-foreground/70 cursor-wait"
                      : isValid
                      ? "bg-primary text-primary-foreground hover:-translate-y-px hover:brightness-105 hover:shadow-lg cursor-pointer"
                      : "bg-primary/80 text-primary-foreground hover:bg-primary cursor-pointer",
                  ].join(" ")}
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </button>
              </div>
            )}
          </div>
        </form>

        <p
          className="mt-7 text-center text-[12px] text-muted animate-[fadeUp_0.4s_ease_both]"
          style={{ animationDelay: "0.40s" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary/85 no-underline transition-opacity hover:opacity-100"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
