"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/api/auth.api";
import { ApiError } from "@/api/api-client";
import { VisualPanel } from "@/components/auth/Visualpanel";
import { OTPInput } from "@/components/ui/otp-input";
import { useAuth } from "@/lib/auth-context";

const OTP_LENGTH = 6;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuth();

  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace("/register");
    }
  }, [email, router]);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }

    try {
      setIsVerifying(true);
      await verifyEmail({ email, otp });
      toast.success("Email verified", {
        description: "Welcome to Bika-File.",
      });
      router.replace("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to verify your email right now.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (!email) return;

    try {
      setIsResending(true);
      const result = await authApi.resendVerification({ email });
      toast.success(result.message);
      setOtp("");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to resend the verification code.",
      );
    } finally {
      setIsResending(false);
    }
  }, [email]);

  if (!email) {
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
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center lg:max-w-[400px]">
        <div
          className="mb-8"
          style={{ animation: "fadeUp 0.5s ease both" }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Email verification
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Check your inbox
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email}</span>. Enter it
            below to verify your account.
          </p>
        </div>

        <form
          onSubmit={handleVerify}
          className="flex flex-col gap-6"
          style={{ animation: "fadeUp 0.55s ease 0.08s both" }}
        >
          <div className="flex flex-col gap-3">
            <label className="text-center text-sm font-medium text-foreground">
              Verification code
            </label>
            <OTPInput
              value={otp}
              onChange={setOtp}
              length={OTP_LENGTH}
              disabled={isVerifying}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || otp.length !== OTP_LENGTH}
            className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVerifying ? "Verifying…" : "Verify email"}
          </button>
        </form>

        <div
          className="mt-8 space-y-3 text-center text-sm text-muted-foreground"
          style={{ animation: "fadeUp 0.6s ease 0.16s both" }}
        >
          <p>
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResending ? "Sending…" : "Resend code"}
            </button>
          </p>
          <p>
            Wrong email?{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Register again
            </Link>
          </p>
          <p>
            Already verified?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
            <VerifyEmailContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
