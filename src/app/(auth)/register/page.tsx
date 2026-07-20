"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/api/api-client";
import { RegisterFormPanel } from "@/components/auth/RegisterFormPanel";
import { useAuth } from "@/lib/auth-context";
import type { RegisterErrors, RegisterFormValues } from "@/types/register";
import { validateRegisterForm } from "@/types/schema/register.schema";
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
    setValues((previous) => {
      const nextValues = { ...previous, [key]: value };

      if (key === "organizationType" && value === OrganizationType.INDIVIDUAL) {
        nextValues.organizationEmail = "";
      }

      return nextValues;
    });

    setErrors((previous) => {
      const nextErrors = { ...previous, [key]: undefined };
      if (key === "organizationType" && value === OrganizationType.INDIVIDUAL) {
        nextErrors.organizationEmail = undefined;
      }
      return nextErrors;
    });
  };

  const getStepErrors = (
    step: 1 | 2,
    validationErrors: RegisterErrors,
  ): RegisterErrors => {
    if (step === 1) {
      return {
        organizationName: validationErrors.organizationName,
        organizationType: validationErrors.organizationType,
        organizationEmail: validationErrors.organizationEmail,
      };
    }

    return {
      fullName: validationErrors.fullName,
      adminEmail: validationErrors.adminEmail,
      password: validationErrors.password,
      confirmPassword: validationErrors.confirmPassword,
    };
  };

  const handleNextStep = () => {
    const validationErrors = validateRegisterForm(values);
    const stepErrors = getStepErrors(1, validationErrors);
    setErrors((previous) => ({ ...previous, ...stepErrors }));

    if (Object.values(stepErrors).some(Boolean)) {
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

    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
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
      setCurrentStep(1);
      router.replace(
        `/verify-email?email=${encodeURIComponent(result.email)}`,
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to create the account right now.",
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
          <RegisterFormPanel
            values={values}
            errors={errors}
            currentStep={currentStep}
            isSubmitting={isSubmitting}
            isValid={isValid}
            onUpdateValue={updateValue}
            onNextStep={handleNextStep}
            onPreviousStep={handlePreviousStep}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </>
  );
}
