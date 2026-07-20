"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/api-client";
import { VisualPanel } from "@/components/auth/Visualpanel";
import { OTPInput } from "@/components/ui/otp-input";
import { useAuth } from "@/lib/auth-context";

const OTP_LENGTH = 6;
const PENDING_TOKEN_KEY = "pending2faToken";

function LoginTwoFactorContent() {
  const router = useRouter();
  const { verifyLoginTwoFactor } = useAuth();
  const [pendingToken, setPendingToken] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem(PENDING_TOKEN_KEY) ?? "";
    if (!token) {
      router.replace("/login");
      return;
    }
    setPendingToken(token);
  }, [router]);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!pendingToken || code.length !== OTP_LENGTH) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }

    try {
      setIsVerifying(true);
      await verifyLoginTwoFactor({ pendingToken, code });
      sessionStorage.removeItem(PENDING_TOKEN_KEY);
      toast.success("Access granted", {
        description: "Welcome back to FileVault.",
      });
      router.replace("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to verify your authentication code.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  if (!pendingToken) {
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
        <div className="mb-8" style={{ animation: "fadeUp 0.5s ease both" }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Two-factor authentication
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Authenticator code
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Enter the 6-digit code from your authenticator app to finish signing
            in.
          </p>
        </div>

        <form
          onSubmit={handleVerify}
          className="flex flex-col gap-6"
          style={{ animation: "fadeUp 0.55s ease 0.08s both" }}
        >
          <OTPInput
            value={code}
            onChange={setCode}
            length={OTP_LENGTH}
            disabled={isVerifying}
            autoFocus
          />

          <button
            type="submit"
            disabled={isVerifying || code.length !== OTP_LENGTH}
            className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVerifying ? "Verifying…" : "Continue"}
          </button>
        </form>

        <p
          className="mt-8 text-center text-sm text-muted-foreground"
          style={{ animation: "fadeUp 0.6s ease 0.16s both" }}
        >
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => sessionStorage.removeItem(PENDING_TOKEN_KEY)}
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginTwoFactorPage() {
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
            <LoginTwoFactorContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
