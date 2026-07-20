import { Role } from './enum';
import { OrganizationType } from './enum';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
  role: Role;
  organizationId: string;
  branchId?: string | null;
  departmentId?: string | null;
  organizationName?: string | null;
  organizationLogo?: string | null;
  organizationEmail?: string | null;
  totpEnabled?: boolean;
  totpEnabledAt?: string | null;
}

export interface TwoFactorChallengeResponse {
  requiresTwoFactor: true;
  pendingToken: string;
}

export type LoginResponse = AuthSuccessResponse | TwoFactorChallengeResponse;

export interface TwoFactorStatusResponse {
  enabled: boolean;
  enabledAt?: string | null;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpAuthUrl: string;
  qrCodeDataUrl: string;
}

export interface VerifyTotpCodePayload {
  code: string;
}

export interface VerifyLoginTotpPayload {
  pendingToken: string;
  code: string;
}

export interface DisableTotpPayload {
  password: string;
  code: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  profileImage?: string | null;
}

export interface UpdateOrganizationPayload {
  name?: string;
  logo?: string | null;
}

export interface AuthSuccessResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  email: string;
  requiresVerification: boolean;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface LogoutResponse {
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  organizationName: string;
  type: OrganizationType;
  name: string;
  email: string;
  password: string;
  organizationLogo?: File | null;
}
