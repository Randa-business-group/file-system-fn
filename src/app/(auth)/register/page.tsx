"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/api/api-client";
import { RegisterFormPanel } from "@/components/auth/RegisterFormPanel";
import { useAuth } from "@/lib/auth-context";
import type { RegisterErrors, RegisterFormValues } from "@/types/register";
import {
  validateOrganizationStep,
  validateRegisterField,
  validateRegisterForm,
} from "@/types/schema/register.schema";
import { VisualPanel } from "@/components/auth/Visualpanel";
import { OrganizationType } from "@/types/enum";

const defaultValues: RegisterFormValues = {
  organizationName: "",
  organizationType: OrganizationType.COMPANY,
  organizationEmail: "",
  fullName: "",
  adminEmail: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [values, setValues] = useState<RegisterFormValues>(defaultValues);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof RegisterFormValues, boolean>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const isValid = useMemo(
    () => Object.keys(validateRegisterForm(values)).length === 0,
    [values],
  );

  const updateValue = <K extends keyof RegisterFormValues>(
    key: K,
    value: RegisterFormValues[K],
  ) => {
    const nextValues: RegisterFormValues = { ...values, [key]: value };

    if (key === "organizationType" && value === OrganizationType.INDIVIDUAL) {
      nextValues.organizationEmail = "";
    }

    setValues(nextValues);
    setTouched((prev) => ({ ...prev, [key]: true }));

    // Real-time validation displayed on type
    setErrors((previous) => {
      const nextErrors = { ...previous };

      // Validate the field being edited
      const fieldError = validateRegisterField(key, value, nextValues);
      nextErrors[key] = fieldError;

      // Handle organization type switch
      if (key === "organizationType") {
        if (value === OrganizationType.INDIVIDUAL) {
          nextErrors.organizationEmail = undefined;
        } else if (touched.organizationEmail || nextValues.organizationEmail) {
          nextErrors.organizationEmail = validateRegisterField(
            "organizationEmail",
            nextValues.organizationEmail,
            nextValues,
          );
        }
      }

      // Re-validate confirmPassword in real-time when password changes
      if (
        key === "password" &&
        (touched.confirmPassword || nextValues.confirmPassword)
      ) {
        nextErrors.confirmPassword = validateRegisterField(
          "confirmPassword",
          nextValues.confirmPassword,
          nextValues,
        );
      }

      return nextErrors;
    });
  };

  const handleBlur = (key: keyof RegisterFormValues) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((previous) => {
      const error = validateRegisterField(key, values[key], values);
      return { ...previous, [key]: error };
    });
  };

  const handleNextStep = () => {
    setTouched((prev) => ({
      ...prev,
      organizationName: true,
      organizationType: true,
      organizationEmail:
        values.organizationType === OrganizationType.COMPANY
          ? true
          : prev.organizationEmail,
    }));

    const stepErrors = validateOrganizationStep(values);
    setErrors((previous) => ({ ...previous, ...stepErrors }));

    if (Object.keys(stepErrors).length > 0) {
      toast.error("Complete the organization details before continuing.");
      return;
    }

    setCurrentStep(2);
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      organizationName: true,
      organizationType: true,
      organizationEmail: true,
      fullName: true,
      adminEmail: true,
      password: true,
      confirmPassword: true,
    });

    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const step1Errors = validateOrganizationStep(values);
      if (Object.keys(step1Errors).length > 0) {
        setCurrentStep(1);
        toast.error("Complete the organization details before continuing.");
        return;
      }

      toast.error("Please correct the highlighted fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await register({
        organizationName: values.organizationName.trim(),
        type:
          values.organizationType === OrganizationType.COMPANY
            ? OrganizationType.COMPANY
            : OrganizationType.INDIVIDUAL,
        name: values.fullName.trim(),
        email: values.adminEmail.trim().toLowerCase(),
        password: values.password,
      });

      toast.success("Check your email", {
        description: result.message,
      });

      setValues(defaultValues);
      setErrors({});
      setTouched({});
      setCurrentStep(1);
      router.replace(
        `/verify-email?email=${encodeURIComponent(result.email)}`,
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to create the account right now.";

      if (
        message.toLowerCase().includes("email") ||
        message.toLowerCase().includes("account with this email")
      ) {
        setErrors((previous) => ({
          ...previous,
          adminEmail: message,
        }));
      }

      toast.error(message);
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
          <RegisterFormPanel
            values={values}
            errors={errors}
            currentStep={currentStep}
            isSubmitting={isSubmitting}
            isValid={isValid}
            onUpdateValue={updateValue}
            onBlurField={handleBlur}
            onNextStep={handleNextStep}
            onPreviousStep={handlePreviousStep}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </>
  );
}
