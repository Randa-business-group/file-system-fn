"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/api-client";
import { UnderlineField } from "@/components/auth/Underlinefield";
import { useChangePassword } from "@/lib/hooks/useProfile";
import type { ChangePasswordErrors, ChangePasswordFormValues } from "@/types/password-reset";
import { validateChangePasswordForm } from "@/types/schema/password-reset.schema";

const defaultValues: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordSection() {
  const { mutate: changePassword, isLoading } = useChangePassword();

  const [values, setValues] = useState<ChangePasswordFormValues>(defaultValues);
  const [errors, setErrors] = useState<ChangePasswordErrors>({});

  const isValid = useMemo(
    () => Object.keys(validateChangePasswordForm(values)).length === 0,
    [values],
  );

  const updateValue = (key: keyof ChangePasswordFormValues, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateChangePasswordForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    changePassword(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: (result) => {
          setValues(defaultValues);
          setErrors({});
          toast.success("Password updated", { description: result.message });
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Unable to update your password right now.",
          );
        },
      },
    );
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-default bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Password</h2>
          <p className="text-sm text-muted-foreground">
            Update your password while signed in, or use email recovery if you
            forgot it.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <UnderlineField
          id="current-password"
          label="Current password"
          type="password"
          value={values.currentPassword}
          onChange={(value) => updateValue("currentPassword", value)}
          error={errors.currentPassword}
          autoComplete="current-password"
          disabled={isLoading}
        />

        <UnderlineField
          id="new-password"
          label="New password"
          type="password"
          value={values.newPassword}
          onChange={(value) => updateValue("newPassword", value)}
          error={errors.newPassword}
          autoComplete="new-password"
          disabled={isLoading}
        />

        <UnderlineField
          id="confirm-new-password"
          label="Confirm new password"
          type="password"
          value={values.confirmPassword}
          onChange={(value) => updateValue("confirmPassword", value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          disabled={isLoading}
        />

        <p className="text-xs leading-relaxed text-muted-foreground">
          Use at least 8 characters with one letter and one number.
        </p>

        <div className="flex flex-col gap-4 border-t border-default pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
          >
            <Mail className="h-4 w-4" />
            Forgot your current password?
          </Link>

          <button
            type="submit"
            disabled={isLoading || !isValid}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </section>
  );
}
