"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/api/api-client";
import { isTwoFactorChallenge } from "@/api/auth.api";
import { useAuth } from "@/lib/auth-context";
import type { LoginErrors, LoginFormValues } from "@/types/login";
import { validateLoginForm } from "@/types/schema/login.schema";

import { FormPanel } from "@/components/auth/Formpanel";
import { VisualPanel } from "@/components/auth/Visualpanel";

const defaultValues: LoginFormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [values, setValues] = useState<LoginFormValues>(defaultValues);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(
    () => Object.keys(validateLoginForm(values)).length === 0,
    [values],
  );

  const updateValue = <K extends keyof LoginFormValues>(
    key: K,
    value: LoginFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === "email" || key === "password") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validateLoginForm(values);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await login({
        email: values.email,
        password: values.password,
      });

      if (isTwoFactorChallenge(response)) {
        sessionStorage.setItem("pending2faToken", response.pendingToken);
        toast.success("Enter your authenticator code", {
          description: "Two-factor authentication is required.",
        });
        router.replace("/login/2fa");
        return;
      }

      toast.success("Access granted", {
        description: "Welcome back to FileVault.",
      });
      router.replace("/dashboard");
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 403 &&
        err.message.toLowerCase().includes("verify")
      ) {
        toast.error("Email not verified", {
          description: "Enter the code we sent to your inbox.",
        });
        router.push(
          `/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`,
        );
        return;
      }

      toast.error(
        err instanceof ApiError ? err.message : "Unable to sign in right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Global keyframes – injected once at the page level */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      {/*
        Layout:
          Mobile  → single-column, form fills screen, no visual panel
          lg+     → relative container, VisualPanel fills 100%, FormPanel overlaps
                    with diagonal clip from the left
      */}
      <main className="relative flex h-screen w-screen overflow-hidden bg-background">
        {/* Right visual panel — hidden on mobile, full bleed on lg+ */}
        <div className="absolute inset-0 hidden lg:block">
          <VisualPanel />
        </div>

        {/* Mobile background — simple subtle gradient when visual panel is hidden */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "radial-gradient(ellipse at 60% 10%, var(--color-primary-subtle) 0%, var(--color-bg-secondary) 60%)",
          }}
        />

        {/*
          Form panel:
            Mobile  → full width, scrollable if content overflows
            lg+     → fixed width with diagonal right edge, no scroll
        */}
        <div className="relative z-10 flex h-full w-full overflow-y-auto lg:overflow-hidden">
          <FormPanel
            values={values}
            errors={errors}
            isSubmitting={isSubmitting}
            isValid={isValid}
            onUpdateValue={updateValue}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </>
  );
}
