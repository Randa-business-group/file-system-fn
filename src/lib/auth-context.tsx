"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { authApi, isTwoFactorChallenge } from "@/api/auth.api";
import { Role } from "@/types/enum";
import { ApiError, TOKEN_EVENT, tokenStorage } from "@/api/api-client";
import type {
  AuthSuccessResponse,
  AuthUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  VerifyEmailPayload,
  VerifyLoginTotpPayload,
} from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
  isBranchManager: boolean;
  isDeptManager: boolean;
  isMember: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<AuthSuccessResponse>;
  verifyLoginTwoFactor: (
    payload: VerifyLoginTotpPayload,
  ) => Promise<AuthSuccessResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(() => Boolean(tokenStorage.get()));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setHasToken(false);
      setUser(null);
      return;
    }

    setHasToken(true);

    try {
      const me = await authApi.me();
      setUser(me);
    } catch (error) {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        tokenStorage.remove();
        setHasToken(false);
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    };

    void init();
  }, [refreshUser]);

  useEffect(() => {
    const handleTokenChange = (event: Event) => {
      const hasCurrentToken = (event as CustomEvent<boolean>).detail;
      setHasToken(hasCurrentToken);

      if (!hasCurrentToken) {
        setUser(null);
        return;
      }

      void refreshUser();
    };

    window.addEventListener(TOKEN_EVENT, handleTokenChange as EventListener);
    return () => {
      window.removeEventListener(TOKEN_EVENT, handleTokenChange as EventListener);
    };
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload);

    if (isTwoFactorChallenge(response)) {
      return response;
    }

    tokenStorage.set(response.accessToken);

    flushSync(() => {
      setHasToken(true);
      setUser(response.user ?? null);
    });

    if (!response.user) {
      await refreshUser();
    }

    return response;
  }, [refreshUser]);

  const verifyLoginTwoFactor = useCallback(
    async (payload: VerifyLoginTotpPayload) => {
      const response = await authApi.verifyLoginTwoFactor(payload);
      tokenStorage.set(response.accessToken);

      flushSync(() => {
        setHasToken(true);
        setUser(response.user ?? null);
      });

      if (!response.user) {
        await refreshUser();
      }

      return response;
    },
    [refreshUser],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    return authApi.register(payload);
  }, []);

  const verifyEmail = useCallback(async (payload: VerifyEmailPayload) => {
    const response = await authApi.verifyEmail(payload);
    tokenStorage.set(response.accessToken);

    flushSync(() => {
      setHasToken(true);
      setUser(response.user ?? null);
    });

    if (!response.user) {
      await refreshUser();
    }

    return response;
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStorage.remove();
      setHasToken(false);
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: hasToken || Boolean(user),
      isLoading,
      isOwner: user?.role === Role.OWNER,
      isBranchManager: user?.role === Role.BRANCH_MANAGER,
      isDeptManager: user?.role === Role.DEPT_MANAGER,
      isMember: user?.role === Role.MEMBER,
      login,
      register,
      verifyEmail,
      verifyLoginTwoFactor,
      logout,
      refreshUser,
    }),
    [user, hasToken, isLoading, login, register, verifyEmail, verifyLoginTwoFactor, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
