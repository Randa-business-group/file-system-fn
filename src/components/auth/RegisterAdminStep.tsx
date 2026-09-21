"use client";

import type { RegisterErrors, RegisterFormValues } from "@/types/register";
import { UnderlineField } from "./Underlinefield";

interface RegisterAdminStepProps {
  values: RegisterFormValues;
  errors: RegisterErrors;
  onUpdateValue: <K extends keyof RegisterFormValues>(
    key: K,
    value: RegisterFormValues[K],
  ) => void;
  onBlurField?: (key: keyof RegisterFormValues) => void;
}

function PasswordCheck({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-[10.5px] transition-colors duration-200 ${
        met
          ? "text-emerald-600 dark:text-emerald-400 font-medium"
          : "text-muted"
      }`}
    >
      <span
        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold transition-all duration-200 ${
          met
            ? "bg-emerald-500 text-white shadow-xs"
            : "border border-[var(--color-border,#d1d5db)] text-transparent"
        }`}
      >
        ✓
      </span>
      <span>{label}</span>
    </div>
  );
}

export function RegisterAdminStep({
  values,
  errors,
  onUpdateValue,
  onBlurField,
}: RegisterAdminStepProps) {
  const minLengthMet = values.password.length >= 8;
  const letterMet = /[a-zA-Z]/.test(values.password);
  const numberMet = /\d/.test(values.password);

  const passwordsMatch =
    values.confirmPassword.length > 0 &&
    values.password === values.confirmPassword;

  return (
    <div className="flex flex-col gap-6">
      <UnderlineField
        id="fullName"
        label="Full name"
        type="text"
        value={values.fullName}
        onChange={(value) => onUpdateValue("fullName", value)}
        onBlur={() => onBlurField?.("fullName")}
        error={errors.fullName}
        autoComplete="name"
        placeholder="Your full name"
      />

      <UnderlineField
        id="adminEmail"
        label="Email address"
        type="email"
        value={values.adminEmail}
        onChange={(value) => onUpdateValue("adminEmail", value)}
        onBlur={() => onBlurField?.("adminEmail")}
        error={errors.adminEmail}
        autoComplete="email"
        placeholder="admin@workspace.com"
      />

      <div>
        <UnderlineField
          id="password"
          label="Password"
          type="password"
          value={values.password}
          onChange={(value) => onUpdateValue("password", value)}
          onBlur={() => onBlurField?.("password")}
          error={errors.password}
          autoComplete="new-password"
          placeholder="Create password"
        />

        {values.password.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 animate-[fadeUp_0.15s_ease_both]">
            <PasswordCheck met={minLengthMet} label="8+ characters" />
            <PasswordCheck met={letterMet} label="1 letter" />
            <PasswordCheck met={numberMet} label="1 number" />
          </div>
        )}
      </div>

      <div>
        <UnderlineField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          value={values.confirmPassword}
          onChange={(value) => onUpdateValue("confirmPassword", value)}
          onBlur={() => onBlurField?.("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
          placeholder="Confirm password"
        />

        {passwordsMatch && !errors.confirmPassword && (
          <p className="mt-1 text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 tracking-wide animate-[fadeUp_0.15s_ease_both]">
            ✓ Passwords match
          </p>
        )}
      </div>
    </div>
  );
}
