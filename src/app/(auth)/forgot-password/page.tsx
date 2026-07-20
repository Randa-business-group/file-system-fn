"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/api/auth.api";
import { ApiError } from "@/api/api-client";
import { UnderlineField } from "@/components/auth/Underlinefield";
import { VisualPanel } from "@/components/auth/Visualpanel";
import type {
  ForgotPasswordErrors,
  ForgotPasswordFormValues,
} from "@/types/password-reset";
import { validateForgotPasswordForm } from "@/types/schema/password-reset.schema";

const defaultValues: ForgotPasswordFormValues = {
  email: "",
};

export default function ForgotPasswordPage() {
  const [values, setValues] = useState<ForgotPasswordFormValues>(defaultValues);
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isValid = useMemo(
    () => Object.keys(validateForgotPasswordForm(values)).length === 0,
    [values],
  );

  const updateValue = (value: string) => {
    setValues({ email: value });
    setErrors((previous) => ({ ...previous, email: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateForgotPasswordForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await authApi.forgotPassword({
        email: values.email.trim().toLowerCase(),
      });
      setIsSubmitted(true);
      toast.success("Check your email", { description: result.message });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to send the reset link right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      <main className="relative flex h-screen w-screen overflow-hidden bg-background">
        <div className="absolute inset-0 hidden lg:block">
          <VisualPanel />
        </div>

        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "radial-gradient(ellipse at 60% 10%, var(--color-primary-subtle) 0%, var(--color-bg-secondary) 60%)",
          }}
        />

        <div className="relative z-10 flex h-full w-full overflow-y-auto lg:overflow-hidden">
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
            <div className="mx-auto flex w-full max-w-sm flex-col justify-center lg:max-w-[360px]">
              <div
                className="mb-9"
                style={{ animation: "fadeUp 0.35s ease both" }}
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Password recovery
                </p>
                <h1 className="mb-2 font-light leading-[1.12] tracking-tight text-foreground">
                  Forgot password?
                </h1>
                <p className="text-[13px] text-muted">
                  {isSubmitted
                    ? "If an account exists for that email, we sent a reset link. Check your inbox and spam folder."
                    : "Enter your email and we will send you a link to reset your password."}
                </p>
              </div>

              {!isSubmitted ? (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-6"
                  style={{ animation: "fadeUp 0.4s ease 0.08s both" }}
                >
                  <UnderlineField
                    id="email"
                    label="Email address"
                    type="email"
                    value={values.email}
                    onChange={updateValue}
                    error={errors.email}
                    autoComplete="email"
                  />

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
                    {isSubmitting ? "Sending…" : "Send reset link"}
                  </button>
                </form>
              ) : (
                <div
                  className="rounded-lg border border-border bg-muted/30 px-4 py-4 text-sm text-muted-foreground"
                  style={{ animation: "fadeUp 0.4s ease 0.08s both" }}
                >
                  We sent instructions to{" "}
                  <span className="font-medium text-foreground">
                    {values.email.trim().toLowerCase()}
                  </span>
                  . The link expires after a short time.
                </div>
              )}

              <p
                className="mt-7 text-center text-[12px] text-muted"
                style={{ animation: "fadeUp 0.4s ease 0.16s both" }}
              >
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary/85 no-underline transition-opacity hover:opacity-100"
                >
                  Sign in →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
