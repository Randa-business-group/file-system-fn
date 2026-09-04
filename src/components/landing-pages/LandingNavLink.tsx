"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function isInternalRoute(href: string) {
  return href.startsWith("/") && !href.includes("#");
}

function parseHref(href: string) {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) {
    return { path: href, hash: "" };
  }
  return {
    path: href.slice(0, hashIndex) || "/",
    hash: href.slice(hashIndex),
  };
}

function useIsNavLinkActive(href: string) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  const { path, hash: hrefHash } = parseHref(href);
  const normalizedPath = path || "/";

  if (hrefHash) {
    return pathname === normalizedPath && hash === hrefHash;
  }

  if (normalizedPath === "/") {
    return pathname === "/";
  }

  return pathname === normalizedPath || pathname.startsWith(`${normalizedPath}/`);
}

function NavLinkContent({
  label,
  isActive,
  variant,
}: {
  label: string;
  isActive: boolean;
  variant: "desktop" | "mobile";
}) {
  if (variant === "mobile") {
    return (
      <>
        <span
          aria-hidden
          className={cn(
            "absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-primary transition-opacity duration-200",
            isActive ? "opacity-100" : "opacity-0",
          )}
        />
        {label}
      </>
    );
  }

  return (
    <>
      <span className="transition-transform duration-150 group-hover:-translate-y-0.5">{label}</span>
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-0.5 left-0 h-0.5 rounded-full bg-primary transition-all duration-200",
          isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-40",
        )}
      />
    </>
  );
}

export function LandingNavLink({
  href,
  label,
  onClick,
  variant = "desktop",
}: {
  href: string;
  label: string;
  onClick?: () => void;
  variant?: "desktop" | "mobile";
}) {
  const isActive = useIsNavLinkActive(href);

  const className = cn(
    "group relative inline-flex no-underline transition hover:no-underline",
    variant === "desktop"
      ? cn(
          "flex-col items-center px-1 py-1 text-sm font-medium",
          isActive
            ? "font-semibold text-primary"
            : "text-secondary hover:text-primary",
        )
      : cn(
          "w-full rounded-lg py-2.5 pl-4 pr-3 text-sm font-medium",
          isActive
            ? "bg-primary-subtle font-semibold text-primary"
            : "text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground",
        ),
  );

  const content = (
    <NavLinkContent label={label} isActive={isActive} variant={variant} />
  );

  if (isInternalRoute(href)) {
    return (
      <Link href={href} onClick={onClick} className={className} aria-current={isActive ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} onClick={onClick} className={className} aria-current={isActive ? "page" : undefined}>
      {content}
    </a>
  );
}

export function LandingFooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const className =
    "inline-flex items-center gap-1 text-sm text-secondary no-underline transition-all duration-150 hover:translate-x-1 hover:text-primary hover:no-underline";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}
