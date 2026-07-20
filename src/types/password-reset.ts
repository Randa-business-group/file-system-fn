export interface ForgotPasswordFormValues {
  email: string;
}

export type ForgotPasswordErrors = Partial<Record<"email", string>>;

export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type ResetPasswordErrors = Partial<
  Record<"newPassword" | "confirmPassword", string>
>;

export type ChangePasswordErrors = Partial<
  Record<"currentPassword" | "newPassword" | "confirmPassword", string>
>;
