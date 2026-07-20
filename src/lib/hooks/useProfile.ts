"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth.api";
import type {
  ChangePasswordPayload,
  DisableTotpPayload,
  UpdateOrganizationPayload,
  UpdateProfilePayload,
  VerifyTotpCodePayload,
} from "@/types/auth";

export function useUpdateProfile() {
  const mutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => authApi.updateProfile(payload),
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useUpdateOrganization() {
  const mutation = useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) =>
      authApi.updateOrganization(payload),
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useChangePassword() {
  const mutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      authApi.changePassword(payload),
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export function useTwoFactorStatus() {
  return useQuery({
    queryKey: ["two-factor-status"],
    queryFn: () => authApi.getTwoFactorStatus(),
  });
}

export function useSetupTwoFactor() {
  return useMutation({
    mutationFn: () => authApi.setupTwoFactor(),
  });
}

export function useVerifyTwoFactorSetup() {
  return useMutation({
    mutationFn: (payload: VerifyTotpCodePayload) =>
      authApi.verifyTwoFactorSetup(payload),
  });
}

export function useDisableTwoFactor() {
  return useMutation({
    mutationFn: (payload: DisableTotpPayload) =>
      authApi.disableTwoFactor(payload),
  });
}
