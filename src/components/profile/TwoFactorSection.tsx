"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/api-client";
import { UnderlineField } from "@/components/auth/Underlinefield";
import { OTPInput } from "@/components/ui/otp-input";
import { useAuth } from "@/lib/auth-context";
import {
  useDisableTwoFactor,
  useSetupTwoFactor,
  useTwoFactorStatus,
  useVerifyTwoFactorSetup,
} from "@/lib/hooks/useProfile";

const OTP_LENGTH = 6;

export function TwoFactorSection() {
  const { user, refreshUser } = useAuth();
  const { data: status, isLoading, refetch } = useTwoFactorStatus();
  const setupTwoFactor = useSetupTwoFactor();
  const verifySetup = useVerifyTwoFactorSetup();
  const disableTwoFactor = useDisableTwoFactor();

  const [setupData, setSetupData] = useState<{
    qrCodeDataUrl: string;
    secret: string;
  } | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const isEnabled = status?.enabled ?? user?.totpEnabled ?? false;

  useEffect(() => {
    if (!isEnabled) {
      setSetupData(null);
      setSetupCode("");
    }
  }, [isEnabled]);

  const handleStartSetup = async () => {
    try {
      const result = await setupTwoFactor.mutateAsync();
      setSetupData({
        qrCodeDataUrl: result.qrCodeDataUrl,
        secret: result.secret,
      });
      setSetupCode("");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to start two-factor setup.",
      );
    }
  };

  const handleVerifySetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (setupCode.length !== OTP_LENGTH) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }

    try {
      const result = await verifySetup.mutateAsync({ code: setupCode });
      setSetupData(null);
      setSetupCode("");
      await refetch();
      await refreshUser();
      toast.success("Two-factor enabled", { description: result.message });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to verify your authenticator code.",
      );
    }
  };

  const handleDisable = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!disablePassword || disableCode.length !== OTP_LENGTH) {
      toast.error("Enter your password and authenticator code.");
      return;
    }

    try {
      const result = await disableTwoFactor.mutateAsync({
        password: disablePassword,
        code: disableCode,
      });
      setDisablePassword("");
      setDisableCode("");
      await refetch();
      await refreshUser();
      toast.success("Two-factor disabled", { description: result.message });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Unable to disable two-factor authentication.",
      );
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-default bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {isEnabled ? (
            <ShieldCheck className="h-5 w-5" />
          ) : (
            <ShieldOff className="h-5 w-5" />
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Two-factor authentication
          </h2>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security with Google Authenticator, Authy, or
            any TOTP app.
          </p>
          {!isLoading && (
            <p className="text-xs font-medium text-primary">
              Status: {isEnabled ? "Enabled" : "Disabled"}
            </p>
          )}
        </div>
      </div>

      {isEnabled ? (
        <form onSubmit={handleDisable} className="space-y-6">
          <p className="text-sm text-muted-foreground">
            To turn off 2FA, confirm your password and enter a current
            authenticator code.
          </p>

          <UnderlineField
            id="disable-2fa-password"
            label="Current password"
            type="password"
            value={disablePassword}
            onChange={setDisablePassword}
            autoComplete="current-password"
            disabled={disableTwoFactor.isPending}
          />

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Authenticator code
            </label>
            <OTPInput
              value={disableCode}
              onChange={setDisableCode}
              length={OTP_LENGTH}
              disabled={disableTwoFactor.isPending}
            />
          </div>

          <div className="flex justify-end border-t border-default pt-6">
            <button
              type="submit"
              disabled={disableTwoFactor.isPending}
              className="inline-flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {disableTwoFactor.isPending ? "Disabling…" : "Disable 2FA"}
            </button>
          </div>
        </form>
      ) : setupData ? (
        <form onSubmit={handleVerifySetup} className="space-y-6">
          <div className="rounded-xl border border-default bg-muted/20 p-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Scan this QR code with your authenticator app, then enter the
              6-digit code to finish setup.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="rounded-lg border border-default bg-white p-3">
                <Image
                  src={setupData.qrCodeDataUrl}
                  alt="Authenticator QR code"
                  width={180}
                  height={180}
                  unoptimized
                />
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">Manual entry key</p>
                <code className="block break-all rounded-md bg-background px-3 py-2 text-xs text-foreground">
                  {setupData.secret}
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Verification code
            </label>
            <OTPInput
              value={setupCode}
              onChange={setSetupCode}
              length={OTP_LENGTH}
              disabled={verifySetup.isPending}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-default pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setSetupData(null);
                setSetupCode("");
              }}
              className="inline-flex items-center justify-center rounded-lg border border-default px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                verifySetup.isPending || setupCode.length !== OTP_LENGTH
              }
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifySetup.isPending ? "Verifying…" : "Enable 2FA"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 border-t border-default pt-6">
          <p className="text-sm text-muted-foreground">
            When enabled, you will enter a code from your authenticator app each
            time you sign in.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleStartSetup}
              disabled={setupTwoFactor.isPending}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {setupTwoFactor.isPending ? "Preparing…" : "Set up 2FA"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
