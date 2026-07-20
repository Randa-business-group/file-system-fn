"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, LogOut, Menu, User } from "lucide-react";
import { toast } from "sonner";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  pageTitle: string;
  onMenuClick?: () => void;
  onUploadClick?: () => void;
}

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AccountAvatar({
  name,
  profileImage,
  size = "sm",
}: {
  name?: string | null;
  profileImage?: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full bg-primary-subtle font-semibold text-primary ${dim}`}
    >
      {profileImage ? (
        <Image
          src={profileImage}
          alt={name ?? "Profile"}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {getInitials(name)}
        </span>
      )}
    </span>
  );
}

export function TopBar({ pageTitle, onMenuClick }: TopBarProps) {
  const router = useRouter();
  const { user, logout, isOwner } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.replace("/login");
    } catch (error) {
      toast.error("Failed to logout");
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-default bg-surface sm:gap-4 sm:px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="hidden truncate text-sm font-semibold text-foreground md:block lg:max-w-[180px] lg:text-base">
          {pageTitle}
        </h1>
      </div>

      <div className="flex min-w-0 flex-1 justify-center px-0 sm:px-2">
        <div className="w-full max-w-xl">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild ariaLabel="Account menu">
            <button
              type="button"
              className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-[var(--color-bg-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 aria-expanded:bg-[var(--color-bg-secondary)] sm:pr-2.5 [&[aria-expanded=true]_svg:last-child]:rotate-180"
            >
              <AccountAvatar
                name={user?.name}
                profileImage={user?.profileImage}
              />
              <span className="hidden max-w-[7.5rem] truncate text-sm font-medium text-foreground lg:inline">
                {user?.name ?? "Account"}
              </span>
              <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted transition-transform duration-200 sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" width={272} className="p-1.5">
            <div className="flex items-center gap-3 rounded-lg px-2.5 py-2.5">
              <AccountAvatar
                name={user?.name}
                profileImage={user?.profileImage}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user?.name ?? "Guest User"}
                </p>
                <p className="truncate text-xs text-muted">
                  {user?.email ?? "No email"}
                </p>
                {user?.organizationName ? (
                  <p className="mt-0.5 truncate text-xs text-secondary">
                    {user.organizationName}
                  </p>
                ) : null}
              </div>
            </div>

            {user?.role ? (
              <div className="px-2.5 pb-2">
                <span className="inline-flex rounded-md bg-primary-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {user.role.replace(/_/g, " ")}
                </span>
              </div>
            ) : null}

            <div className="my-1 border-t border-default" />

            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User className="h-4 w-4 shrink-0 text-muted" />
              Settings
            </DropdownMenuItem>

            {isOwner ? (
              <DropdownMenuItem onClick={() => router.push("/dashboard/company")}>
                <Building2 className="h-4 w-4 shrink-0 text-muted" />
                Company Settings
              </DropdownMenuItem>
            ) : null}

            <div className="my-1 border-t border-default" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
