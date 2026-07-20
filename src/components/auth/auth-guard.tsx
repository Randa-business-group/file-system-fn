"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/types/enum";

const AUTH_PAGES = new Set([
  "/login",
  "/login/2fa",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/accept-invitation",
]);

const ROUTE_ROLE_ACCESS: Record<string, Role[]> = {
  "/dashboard/branches": [Role.OWNER],
  "/dashboard/departments": [Role.OWNER, Role.BRANCH_MANAGER],
  "/dashboard/categories": [Role.OWNER, Role.BRANCH_MANAGER],
  "/dashboard/members": [Role.OWNER, Role.BRANCH_MANAGER, Role.DEPT_MANAGER],
  "/dashboard/company": [Role.OWNER],
};

function getRequiredRoles(pathname: string): Role[] | null {
  const match = Object.entries(ROUTE_ROLE_ACCESS).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );
  return match ? match[1] : null;
}

const PUBLIC_MARKETING_PAGES = new Set(["/", "/features", "/contact"]);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, isOwner, isBranchManager, isDeptManager, isMember } =
    useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = AUTH_PAGES.has(pathname);

    if (isAuthenticated && isAuthPage) {
      router.replace("/dashboard");
      return;
    }

    if (!isAuthenticated && pathname.startsWith("/dashboard")) {
      router.replace("/login");
      return;
    }

    if (!isAuthenticated || !user) {
      return;
    }

    const requiredRoles = getRequiredRoles(pathname);
    if (!requiredRoles) {
      return;
    }

    const hasAccess =
      (isOwner && requiredRoles.includes(Role.OWNER)) ||
      (isBranchManager && requiredRoles.includes(Role.BRANCH_MANAGER)) ||
      (isDeptManager && requiredRoles.includes(Role.DEPT_MANAGER)) ||
      (isMember && requiredRoles.includes(Role.MEMBER));

    if (!hasAccess) {
      router.replace("/dashboard");
    }
  }, [
    isAuthenticated,
    isLoading,
    pathname,
    router,
    user,
    isOwner,
    isBranchManager,
    isDeptManager,
    isMember,
  ]);

  if (isLoading && !PUBLIC_MARKETING_PAGES.has(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-secondary">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
