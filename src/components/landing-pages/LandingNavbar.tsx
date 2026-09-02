"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { LandingBrandLogo } from "./LandingBrandLogo";
import { LANDING_NAV_LINKS } from "./landing-data";
import { LandingNavLink } from "./LandingNavLink";

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ProfileAvatar({
  name,
  profileImage,
}: {
  name?: string | null;
  profileImage?: string | null;
}) {
  return (
    <span className="relative inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary-subtle font-semibold text-primary">
      {profileImage ? (
        <Image
          src={profileImage}
          alt={name ?? "Profile"}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs">
          {getInitials(name)}
        </span>
      )}
    </span>
  );
}

export function LandingNavbar() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.replace("/");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const closeMobile = () => setMobileOpen(false);

  return (
		<header className='sticky top-0 z-50 border-b border-default bg-white'>
			<div className='mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8'>
				<LandingBrandLogo />

				<nav className='hidden flex-1 items-center justify-center gap-8 md:flex'>
					{LANDING_NAV_LINKS.map((link) => (
						<LandingNavLink
							key={link.href}
							href={link.href}
							label={link.label}
							variant='desktop'
						/>
					))}
				</nav>

				<div className='ml-auto hidden items-center gap-3 md:flex'>
					{!isLoading && isAuthenticated && user ? (
						<DropdownMenu>
							<DropdownMenuTrigger
								asChild
								ariaLabel='Account menu'
							>
								<button
									type='button'
									className='flex items-center gap-2 rounded-full border border-default bg-surface py-1 pl-1 pr-3 transition hover:bg-[var(--color-bg-secondary)]'
								>
									<ProfileAvatar
										name={user.name}
										profileImage={user.profileImage}
									/>
									<span className='max-w-[8rem] truncate text-sm font-medium text-foreground'>
										{user.name}
									</span>
									<ChevronDown className='h-4 w-4 text-muted' />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='end'
								className='min-w-[11rem]'
							>
								<DropdownMenuItem onClick={() => router.push("/dashboard")}>
									<LayoutDashboard className='h-4 w-4' />
									Dashboard
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
									<Settings className='h-4 w-4' />
									Settings
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleLogout}>
									<LogOut className='h-4 w-4' />
									Logout
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<>
							<Link
								href='/login'
								className='rounded-md px-4 py-2 text-sm font-medium text-secondary no-underline transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground hover:no-underline'
							>
								Sign in
							</Link>
							<Link
								href='/register'
								className='rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground no-underline shadow-sm transition hover:text-primary-foreground hover:bg-primary-hover hover:no-underline'
							>
								Sign up
							</Link>
						</>
					)}
				</div>

				<button
					type='button'
					className='ml-auto rounded-lg p-2 text-secondary transition hover:bg-[var(--color-bg-secondary)] md:hidden'
					aria-label={mobileOpen ? "Close menu" : "Open menu"}
					onClick={() => setMobileOpen((open) => !open)}
				>
					{mobileOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
				</button>
			</div>

			{mobileOpen && (
				<div className='border-t border-default bg-white px-4 py-4 md:hidden'>
					<nav className='flex flex-col gap-1'>
						{LANDING_NAV_LINKS.map((link) => (
							<LandingNavLink
								key={link.href}
								href={link.href}
								label={link.label}
								onClick={closeMobile}
								variant='mobile'
							/>
						))}
					</nav>
					<div className='mt-4 flex flex-col gap-2 border-t border-default pt-4'>
						{!isLoading && isAuthenticated && user ? (
							<>
								<div className='flex items-center gap-3 px-3 py-2'>
									<ProfileAvatar
										name={user.name}
										profileImage={user.profileImage}
									/>
									<div className='min-w-0'>
										<p className='truncate text-sm font-medium text-foreground'>{user.name}</p>
										<p className='truncate text-xs text-muted'>{user.email}</p>
									</div>
								</div>
								<Link
									href='/dashboard'
									onClick={closeMobile}
									className='rounded-lg px-3 py-2.5 text-sm font-medium text-secondary no-underline hover:bg-[var(--color-bg-secondary)] hover:no-underline'
								>
									Dashboard
								</Link>
								<Link
									href='/dashboard/profile'
									onClick={closeMobile}
									className='rounded-lg px-3 py-2.5 text-sm font-medium text-secondary no-underline hover:bg-[var(--color-bg-secondary)] hover:no-underline'
								>
									Settings
								</Link>
								<button
									type='button'
									onClick={() => {
										closeMobile();
										void handleLogout();
									}}
									className='rounded-lg px-3 py-2.5 text-left text-sm font-medium text-error'
								>
									Logout
								</button>
							</>
						) : (
							<>
								<Link
									href='/login'
									onClick={closeMobile}
									className='rounded-lg border border-default px-3 py-2.5 text-center text-sm font-medium text-foreground no-underline hover:no-underline'
								>
									Sign in
								</Link>
								<Link
									href='/register'
									onClick={closeMobile}
									className='rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground no-underline hover:no-underline'
								>
									Sign up
								</Link>
							</>
						)}
					</div>
				</div>
			)}
		</header>
  );
}
