import { z } from "zod";
import type {
  ChangePasswordErrors,
  ChangePasswordFormValues,
  ForgotPasswordErrors,
  ForgotPasswordFormValues,
  ResetPasswordErrors,
  ResetPasswordFormValues,
} from "@/types/password-reset";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
});

export function validateForgotPasswordForm(
  values: ForgotPasswordFormValues,
): ForgotPasswordErrors {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (parsed.success) return {};

  const fieldErrors = parsed.error.flatten().fieldErrors;
  return {
    email: fieldErrors.email?.[0],
  };
}

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        "Password must contain at least one letter and one number.",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export function validateResetPasswordForm(
  values: ResetPasswordFormValues,
): ResetPasswordErrors {
  const parsed = resetPasswordSchema.safeParse(values);
  if (parsed.success) return {};

  const fieldErrors = parsed.error.flatten().fieldErrors;
  return {
    newPassword: fieldErrors.newPassword?.[0],
    confirmPassword: fieldErrors.confirmPassword?.[0],
  };
}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        "Password must contain at least one letter and one number.",
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from your current password.",
  });

export function validateChangePasswordForm(
  values: ChangePasswordFormValues,
): ChangePasswordErrors {
  const parsed = changePasswordSchema.safeParse(values);
  if (parsed.success) return {};

  const fieldErrors = parsed.error.flatten().fieldErrors;
  return {
    currentPassword: fieldErrors.currentPassword?.[0],
    newPassword: fieldErrors.newPassword?.[0],
    confirmPassword: fieldErrors.confirmPassword?.[0],
  };
}
