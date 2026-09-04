import { z } from "zod";
import type { RegisterErrors, RegisterFormValues } from "@/types/register";
import { OrganizationType } from "@/types/enum";

const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function validateEmailSyntax(email: string, prefix = "Email"): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return `${prefix} is required.`;
  if (trimmed.length > 255) return `${prefix} cannot exceed 255 characters.`;
  if (/\s/.test(trimmed)) return `${prefix} cannot contain spaces.`;
  if (!trimmed.includes("@")) return `${prefix} must contain an '@' symbol.`;
  if (trimmed.indexOf("@") !== trimmed.lastIndexOf("@")) {
    return `${prefix} cannot contain more than one '@' symbol.`;
  }

  const [local, domain] = trimmed.split("@");
  if (!local) return `${prefix} must have a name before '@'.`;
  if (!domain) return `Please enter a domain after '@' (e.g. example.com).`;
  if (domain.startsWith(".") || domain.endsWith(".")) {
    return `Domain name cannot start or end with a dot.`;
  }
  if (!domain.includes(".")) {
    return `Domain must include a valid extension (e.g. .com, .org).`;
  }

  const parts = domain.split(".");
  const tld = parts[parts.length - 1];
  if (tld.length < 2) {
    return `Domain extension must be at least 2 characters (e.g. .com).`;
  }

  if (!emailRegex.test(trimmed)) {
    return `Please enter a valid ${prefix.toLowerCase()} (e.g. name@domain.com).`;
  }

  return undefined;
}

export function validateRegisterField<K extends keyof RegisterFormValues>(
  field: K,
  value: RegisterFormValues[K],
  allValues: RegisterFormValues,
): string | undefined {
  switch (field) {
    case "organizationType": {
      if (
        !value ||
        (value !== OrganizationType.COMPANY &&
          value !== OrganizationType.INDIVIDUAL)
      ) {
        return "Please select an organization type.";
      }
      return undefined;
    }

    case "organizationName": {
      const isCompany = allValues.organizationType === OrganizationType.COMPANY;
      const label = isCompany ? "Organization name" : "Professional identity";
      const trimmed = (typeof value === "string" ? value : "").trim();

      if (!trimmed) return `${label} is required.`;
      if (trimmed.length < 2) return `${label} must be at least 2 characters.`;
      if (trimmed.length > 100) return `${label} cannot exceed 100 characters.`;
      if (!/[a-zA-Z]/.test(trimmed)) {
        return `${label} must contain at least one letter.`;
      }
      if (!/^[\p{L}0-9\s.,&'()/-]+$/u.test(trimmed)) {
        return `${label} contains invalid characters.`;
      }
      return undefined;
    }

    case "organizationEmail": {
      if (allValues.organizationType === OrganizationType.INDIVIDUAL) {
        return undefined;
      }
      return validateEmailSyntax(
        typeof value === "string" ? value : "",
        "Organization email",
      );
    }

    case "fullName": {
      const trimmed = (typeof value === "string" ? value : "").trim();
      if (!trimmed) return "Full name is required.";
      if (trimmed.length < 2) return "Full name must be at least 2 characters.";
      if (trimmed.length > 70) return "Full name cannot exceed 70 characters.";
      if (!/\p{L}/u.test(trimmed)) {
        return "Full name must contain at least one letter.";
      }
      if (!/^[\p{L}\s'.-]+$/u.test(trimmed)) {
        return "Full name can only contain letters, spaces, hyphens, and apostrophes.";
      }
      return undefined;
    }

    case "adminEmail": {
      return validateEmailSyntax(
        typeof value === "string" ? value : "",
        "Email address",
      );
    }

    case "password": {
      const str = typeof value === "string" ? value : "";
      if (!str) return "Password is required.";
      if (str.length < 8) return "Password must be at least 8 characters.";
      if (str.length > 128) return "Password cannot exceed 128 characters.";
      if (!/[a-zA-Z]/.test(str)) {
        return "Password must contain at least one letter.";
      }
      if (!/\d/.test(str)) {
        return "Password must contain at least one number.";
      }
      return undefined;
    }

    case "confirmPassword": {
      const str = typeof value === "string" ? value : "";
      if (!str) return "Please confirm your password.";
      if (str !== allValues.password) {
        return "Passwords do not match.";
      }
      return undefined;
    }

    default:
      return undefined;
  }
}

export function validateOrganizationStep(
  values: RegisterFormValues,
): RegisterErrors {
  const errors: RegisterErrors = {};

  const orgTypeError = validateRegisterField(
    "organizationType",
    values.organizationType,
    values,
  );
  if (orgTypeError) errors.organizationType = orgTypeError;

  const orgNameError = validateRegisterField(
    "organizationName",
    values.organizationName,
    values,
  );
  if (orgNameError) errors.organizationName = orgNameError;

  if (values.organizationType === OrganizationType.COMPANY) {
    const orgEmailError = validateRegisterField(
      "organizationEmail",
      values.organizationEmail,
      values,
    );
    if (orgEmailError) errors.organizationEmail = orgEmailError;
  }

  return errors;
}

export function validateAdminStep(
  values: RegisterFormValues,
): RegisterErrors {
  const errors: RegisterErrors = {};

  const fullNameError = validateRegisterField("fullName", values.fullName, values);
  if (fullNameError) errors.fullName = fullNameError;

  const adminEmailError = validateRegisterField(
    "adminEmail",
    values.adminEmail,
    values,
  );
  if (adminEmailError) errors.adminEmail = adminEmailError;

  const passwordError = validateRegisterField("password", values.password, values);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validateRegisterField(
    "confirmPassword",
    values.confirmPassword,
    values,
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  return errors;
}

export const registerSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(2, "Organization name must have at least 2 characters.")
      .max(100, "Organization name cannot exceed 100 characters.")
      .regex(/[a-zA-Z]/, "Organization name must contain at least one letter.")
      .regex(/^[\p{L}0-9\s.,&'()/-]+$/u, "Organization name contains invalid characters."),
    organizationType: z.nativeEnum(OrganizationType),
    organizationEmail: z
      .string()
      .trim()
      .optional()
      .transform((value) => value ?? ""),
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must have at least 2 characters.")
      .max(70, "Full name cannot exceed 70 characters.")
      .regex(/\p{L}/u, "Full name must contain at least one letter.")
      .regex(/^[\p{L}\s'.-]+$/u, "Full name can only contain letters, spaces, hyphens, and apostrophes."),
    adminEmail: z
      .string()
      .trim()
      .min(1, "Email address is required.")
      .max(255, "Email address cannot exceed 255 characters.")
      .refine((val) => !validateEmailSyntax(val, "Email address"), {
        message: "Please enter a valid email address.",
      }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password cannot exceed 128 characters.")
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Password must contain at least one letter and one number."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .superRefine((value, ctx) => {
    if (value.organizationType === OrganizationType.COMPANY) {
      const emailError = validateEmailSyntax(
        value.organizationEmail,
        "Organization email",
      );
      if (emailError) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["organizationEmail"],
          message: emailError,
        });
      }
    }
  });

export function validateRegisterForm(
  values: RegisterFormValues,
): RegisterErrors {
  return {
    ...validateOrganizationStep(values),
    ...validateAdminStep(values),
  };
}

