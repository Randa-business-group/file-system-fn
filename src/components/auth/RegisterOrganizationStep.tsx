"use client";

import type { RegisterErrors, RegisterFormValues } from "@/types/register";
import { UnderlineField } from "./Underlinefield";
import { UnderlineSelectField } from "./UnderlineSelectField";
import { OrganizationType } from "@/types/enum";

interface RegisterOrganizationStepProps {
  values: RegisterFormValues;
  errors: RegisterErrors;
  onUpdateValue: <K extends keyof RegisterFormValues>(
    key: K,
    value: RegisterFormValues[K],
  ) => void;
  onBlurField?: (key: keyof RegisterFormValues) => void;
}

const organizationPlaceholders = {
  [OrganizationType.COMPANY]: "businesses, banks, etc",
  [OrganizationType.INDIVIDUAL]: "notaire, therapist, freelancer, etc",
} as const;

export function RegisterOrganizationStep({
  values,
  errors,
  onUpdateValue,
  onBlurField,
}: RegisterOrganizationStepProps) {
  const isCompany = values.organizationType === OrganizationType.COMPANY;

  return (
    <div className="flex flex-col gap-6">
      <UnderlineSelectField
        id="organizationType"
        label="Organization Type"
        error={errors.organizationType}
        value={values.organizationType}
        onChange={(value) => onUpdateValue("organizationType", value)}
        onBlur={() => onBlurField?.("organizationType")}
      />

      <UnderlineField
        id="organizationName"
        label={isCompany ? "Organization Name" : "Professional Identity"}
        type="text"
        value={values.organizationName}
        onChange={(value) => onUpdateValue("organizationName", value)}
        onBlur={() => onBlurField?.("organizationName")}
        error={errors.organizationName}
        autoComplete="organization"
        placeholder={organizationPlaceholders[values.organizationType]}
      />

      {isCompany ? (
        <UnderlineField
          id="organizationEmail"
          label="Organization Email"
          type="email"
          value={values.organizationEmail}
          onChange={(value) => onUpdateValue("organizationEmail", value)}
          onBlur={() => onBlurField?.("organizationEmail")}
          error={errors.organizationEmail}
          autoComplete="email"
          placeholder="contact@organization.com"
        />
      ) : null}
    </div>
  );
}
