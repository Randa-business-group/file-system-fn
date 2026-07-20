import { apiClient } from "@/api/api-client";
import type {
  AuthSuccessResponse,
  AuthUser,
  DisableTotpPayload,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
  MessageResponse,
  RegisterPayload,
  RegisterResponse,
  ResendVerificationPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
  UpdateOrganizationPayload,
  UpdateProfilePayload,
  VerifyEmailPayload,
  VerifyLoginTotpPayload,
  VerifyTotpCodePayload,
} from "@/types/auth";
import type { ApiSuccessEnvelope } from "@/types/http";

type MeUserRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
  role: string;
  organizationId: string;
  branchId?: string | null;
  departmentId?: string | null;
  totpEnabled?: boolean;
  totpEnabledAt?: string | null;
  organization?: {
    name?: string | null;
    logo?: string | null;
    email?: string | null;
  } | null;
};

type MeResponse = ApiSuccessEnvelope<MeUserRecord> | MeUserRecord | null;

function unwrapAuthResponse(
  response: AuthSuccessResponse | ApiSuccessEnvelope<AuthSuccessResponse>,
): AuthSuccessResponse {
  return "data" in response ? response.data : response;
}

function unwrapLoginResponse(
  response: LoginResponse | ApiSuccessEnvelope<LoginResponse>,
): LoginResponse {
  return "data" in response ? response.data : response;
}

function normalizeAuthUser(response: MeResponse): AuthUser | null {
  if (!response) return null;

  const rawUser = "data" in response ? response.data : response;

  return {
    id: rawUser.id,
    name: rawUser.name,
    email: rawUser.email,
    phone: rawUser.phone ?? null,
    profileImage: rawUser.profileImage ?? null,
    role: rawUser.role as AuthUser["role"],
    branchId: rawUser.branchId ?? null,
    departmentId: rawUser.departmentId ?? null,
    organizationId: rawUser.organizationId,
    organizationName:
      "organization" in rawUser
        ? rawUser.organization?.name ?? null
        : "organizationName" in rawUser
          ? ((rawUser as { organizationName?: string | null }).organizationName ??
            null)
          : null,
    organizationLogo:
      "organization" in rawUser
        ? rawUser.organization?.logo ?? null
        : "organizationLogo" in rawUser
          ? ((rawUser as { organizationLogo?: string | null }).organizationLogo ??
            null)
          : null,
    organizationEmail:
      "organization" in rawUser
        ? rawUser.organization?.email ?? null
        : "organizationEmail" in rawUser
          ? (rawUser as { organizationEmail?: string | null }).organizationEmail ??
            null
          : null,
    totpEnabled: "totpEnabled" in rawUser ? Boolean(rawUser.totpEnabled) : false,
    totpEnabledAt:
      "totpEnabledAt" in rawUser
        ? ((rawUser as { totpEnabledAt?: string | null }).totpEnabledAt ?? null)
        : null,
  };
}

export function isTwoFactorChallenge(
  response: LoginResponse,
): response is import("@/types/auth").TwoFactorChallengeResponse {
  return "requiresTwoFactor" in response && response.requiresTwoFactor === true;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await apiClient.post<
      LoginResponse | ApiSuccessEnvelope<LoginResponse>,
      LoginPayload
    >("/auth/login", payload, { withCredentials: true });
    return unwrapLoginResponse(response);
  },

  async verifyLoginTwoFactor(
    payload: VerifyLoginTotpPayload,
  ): Promise<AuthSuccessResponse> {
    const response = await apiClient.post<
      AuthSuccessResponse | ApiSuccessEnvelope<AuthSuccessResponse>,
      VerifyLoginTotpPayload
    >("/auth/login/2fa", payload, { withCredentials: true });
    return unwrapAuthResponse(response);
  },

  async getTwoFactorStatus(): Promise<TwoFactorStatusResponse> {
    const response = await apiClient.get<
      TwoFactorStatusResponse | ApiSuccessEnvelope<TwoFactorStatusResponse>
    >("/auth/2fa/status");
    return "data" in response ? response.data : response;
  },

  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    const response = await apiClient.post<
      TwoFactorSetupResponse | ApiSuccessEnvelope<TwoFactorSetupResponse>
    >("/auth/2fa/setup");
    return "data" in response ? response.data : response;
  },

  async verifyTwoFactorSetup(
    payload: VerifyTotpCodePayload,
  ): Promise<MessageResponse & { enabled: boolean }> {
    const response = await apiClient.post<
      (MessageResponse & { enabled: boolean }) | ApiSuccessEnvelope<MessageResponse & { enabled: boolean }>,
      VerifyTotpCodePayload
    >("/auth/2fa/verify-setup", payload);
    return "data" in response ? response.data : response;
  },

  async disableTwoFactor(
    payload: DisableTotpPayload,
  ): Promise<MessageResponse & { enabled: boolean }> {
    const response = await apiClient.post<
      (MessageResponse & { enabled: boolean }) | ApiSuccessEnvelope<MessageResponse & { enabled: boolean }>,
      DisableTotpPayload
    >("/auth/2fa/disable", payload);
    return "data" in response ? response.data : response;
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const formData = new FormData();
    formData.append("organizationName", payload.organizationName);
    formData.append("type", payload.type);
    formData.append("name", payload.name);
    formData.append("email", payload.email);
    formData.append("password", payload.password);
    if (payload.organizationLogo) {
      formData.append("organizationLogo", payload.organizationLogo);
    }
    const response = await apiClient.postFormData<
      RegisterResponse | ApiSuccessEnvelope<RegisterResponse>
    >("/auth/register", formData);
    return "data" in response ? response.data : response;
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<AuthSuccessResponse> {
    const response = await apiClient.post<
      AuthSuccessResponse | ApiSuccessEnvelope<AuthSuccessResponse>,
      VerifyEmailPayload
    >("/auth/verify-email", payload, { withCredentials: true });
    return unwrapAuthResponse(response);
  },

  async resendVerification(
    payload: ResendVerificationPayload,
  ): Promise<MessageResponse> {
    const response = await apiClient.post<
      MessageResponse | ApiSuccessEnvelope<MessageResponse>,
      ResendVerificationPayload
    >("/auth/resend-verification", payload);
    return "data" in response ? response.data : response;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
    const response = await apiClient.post<
      MessageResponse | ApiSuccessEnvelope<MessageResponse>,
      ForgotPasswordPayload
    >("/auth/forgot-password", payload);
    return "data" in response ? response.data : response;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const response = await apiClient.post<
      MessageResponse | ApiSuccessEnvelope<MessageResponse>
    >("/auth/reset-password", payload);
    return "data" in response ? response.data : response;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
    const response = await apiClient.patch<
      MessageResponse | ApiSuccessEnvelope<MessageResponse>,
      ChangePasswordPayload
    >("/auth/change-password", payload);
    return "data" in response ? response.data : response;
  },

  async me(): Promise<AuthUser | null> {
    const response = await apiClient.get<MeResponse>("/auth/me");
    return normalizeAuthUser(response);
  },

  async logout(): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>("/auth/logout", undefined, {
      withCredentials: true,
    });
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser | null> {
    const response = await apiClient.patch<MeResponse>("/auth/profile", payload);
    return normalizeAuthUser(response);
  },

  async updateOrganization(
    payload: UpdateOrganizationPayload,
  ): Promise<AuthUser | null> {
    const response = await apiClient.patch<MeResponse>(
      "/auth/organization",
      payload,
    );
    return normalizeAuthUser(response);
  },
};
