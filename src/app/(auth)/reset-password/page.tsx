"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/api/auth.api";
import { ApiError } from "@/api/api-client";
import { UnderlineField } from "@/components/auth/Underlinefield";
import { VisualPanel } from "@/components/auth/Visualpanel";
import type {
  ResetPasswordErrors,
  ResetPasswordFormValues,
} from "@/types/password-reset";
import { validateResetPasswordForm } from "@/types/schema/password-reset.schema";

const defaultValues: ResetPasswordFormValues = {
  newPassword: "",
  confirmPassword: "",
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [values, setValues] = useState<ResetPasswordFormValues>(defaultValues);
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(
    () => Object.keys(validateResetPasswordForm(values)).length === 0,
    [values],
  );

  useEffect(() => {
    if (!token) {
      toast.error("Reset link is invalid or missing.");
      router.replace("/forgot-password");
    }
  }, [token, router]);

  const updateValue = (
    key: keyof ResetPasswordFormValues,
    value: string,
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error("Reset link is invalid or missing.");
      return;
    }

    const validationErrors = validateResetPasswordForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await authApi.resetPassword({
        token,
        newPassword: values.newPassword,
      });
      toast.success("Password updated", { description: result.message });
      router.replace("/login");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to reset your password right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return null;
  }

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
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center lg:max-w-[360px]">
        <div
          className="mb-9"
          style={{ animation: "fadeUp 0.35s ease both" }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            New password
          </p>
          <h1 className="mb-2 font-light leading-[1.12] tracking-tight text-foreground">
            Reset password
          </h1>
          <p className="text-[13px] text-muted">
            Choose a strong password with at least 8 characters, including a
            letter and a number.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
          style={{ animation: "fadeUp 0.4s ease 0.08s both" }}
        >
          <UnderlineField
            id="newPassword"
            label="New password"
            type="password"
            value={values.newPassword}
            onChange={(value) => updateValue("newPassword", value)}
            error={errors.newPassword}
            autoComplete="new-password"
          />

          <UnderlineField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={values.confirmPassword}
            onChange={(value) => updateValue("confirmPassword", value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
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
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>

        <p
          className="mt-7 text-center text-[12px] text-muted"
          style={{ animation: "fadeUp 0.4s ease 0.16s both" }}
        >
          Link expired?{" "}
          <Link
            href="/forgot-password"
            className="font-semibold text-primary/85 no-underline transition-opacity hover:opacity-100"
          >
            Request a new one →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={null}>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
