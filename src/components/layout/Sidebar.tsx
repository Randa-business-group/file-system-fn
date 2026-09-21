"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  Building,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Inbox,
  LayersIcon,
  LayoutDashboard,
  LibraryBig,
  Share2,
  Search,
  Send,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGetInbox as useGetTrayInbox } from "@/lib/hooks/useDocuments";
import { useGetInbox as useGetShareInbox } from "@/lib/hooks/useSharing";
import { useGetTrash } from "@/lib/hooks/useTrash";
import type { Document } from "@/types/document";
import { Role } from "@/types/enum";
import type { AuthUser } from "@/types/auth";
import Image from "next/image";

interface SidebarProps {
  isOpen: boolean;
  pathname: string;
  user: AuthUser | null;
  onClose: () => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: [Role.OWNER, Role.BRANCH_MANAGER, Role.DEPT_MANAGER, Role.MEMBER],
  },
  {
    href: "/dashboard/search",
    label: "Search",
    icon: Search,
    roles: [Role.OWNER, Role.BRANCH_MANAGER, Role.DEPT_MANAGER, Role.MEMBER],
  },
  {
    href: "/dashboard/folders",
    label: "Folders",
    icon: FolderOpen,
    roles: [Role.OWNER, Role.BRANCH_MANAGER, Role.DEPT_MANAGER],
  },
  {
    href: "/dashboard/my-folders",
    label: "My Folders",
    icon: Folder,
    roles: [Role.OWNER, Role.BRANCH_MANAGER,Role.DEPT_MANAGER, Role.MEMBER],
  },
  {
    href: "/dashboard/categories",
    label: "Categories",
    icon: Tag,
    roles: [Role.OWNER, Role.BRANCH_MANAGER],
  },
  {
    href: "/dashboard/documents",
    label: "Documents",
    icon: FileText,
    roles: [Role.OWNER, Role.BRANCH_MANAGER, Role.DEPT_MANAGER, Role.MEMBER],
  },
  {
    href: "/dashboard/collections",
    label: "Collections",
    icon: LibraryBig,
    roles: [Role.OWNER, Role.BRANCH_MANAGER, Role.DEPT_MANAGER, Role.MEMBER],
  },
  {
    href: "/dashboard/shared",
    label: "Shared",
    icon: Share2,
    roles: [Role.OWNER, Role.BRANCH_MANAGER, Role.DEPT_MANAGER, Role.MEMBER],
  },
  {
    href: "/dashboard/members",
    label: "Members",
    icon: Users,
    roles: [Role.OWNER, Role.BRANCH_MANAGER, Role.DEPT_MANAGER],
  },
  {
    href: "/dashboard/unsorted",
    label: "Tray",
    icon: LayersIcon,
    roles: [Role.OWNER, Role.BRANCH_MANAGER, Role.DEPT_MANAGER, Role.MEMBER],
  },
  {
    href: "/dashboard/trash",
    label: "Trash",
    icon: Trash2,
    roles: [Role.OWNER, Role.BRANCH_MANAGER, Role.DEPT_MANAGER, Role.MEMBER],
  },
];

const ORG_MENU_INSERT_BEFORE = "/dashboard/folders";
const INBOX_MENU_INSERT_BEFORE = "/dashboard/unsorted";
const SIDEBAR_HEADER_HEIGHT = "4.25rem";

const INBOX_SUB_ITEMS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/dashboard/inbox", label: "Received", icon: ArrowDownLeft },
  { href: "/dashboard/inbox/sent", label: "Sent", icon: Send },
];

interface OrgSubItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

function isOrgRoute(pathname: string) {
  return (
    pathname === "/dashboard/branches" ||
    pathname.startsWith("/dashboard/branches/") ||
    pathname === "/dashboard/departments" ||
    pathname.startsWith("/dashboard/departments/")
  );
}

function isInboxRoute(pathname: string) {
  return (
    pathname === "/dashboard/inbox" ||
    pathname === "/dashboard/inbox/sent" ||
    pathname.startsWith("/dashboard/inbox/")
  );
}

function isInboxSubActive(pathname: string, href: string) {
  if (href === "/dashboard/inbox") {
    return pathname === "/dashboard/inbox";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
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

function OrganizationBrand({
  name,
  logo,
  collapsed,
}: {
  name?: string | null;
  logo?: string | null;
  collapsed: boolean;
}) {
  const displayName = name?.trim() || "File Vault";
  const size = collapsed ? "h-9 w-9" : "h-10 w-10";
  const showProductFallback = !name?.trim() && !logo;

  return (
    <>
      <span
        className={`relative inline-flex shrink-0 overflow-hidden rounded-xl border border-default bg-[var(--color-bg-secondary)] ${size}`}
      >
        {logo ? (
          <Image
            src={logo}
            alt={`${displayName} logo`}
            fill
            className="object-cover"
            unoptimized
          />
        ) : showProductFallback ? (
          <Image
            src="/file-vault-2.png"
            alt="File Vault"
            fill
            className="object-contain p-1"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-primary-subtle text-xs font-bold text-primary">
            {getInitials(displayName)}
          </span>
        )}
      </span>
      {!collapsed ? (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">
            {displayName}
          </p>
          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wider text-muted">
            Organization
          </p>
        </div>
      ) : null}
    </>
  );
}

export function Sidebar({
  isOpen,
  pathname,
  user,
  onClose,
  collapsed,
  onCollapsedChange,
}: SidebarProps) {

  const role = user?.role ?? Role.MEMBER;
  const { documents: inboxDocuments } = useGetTrayInbox();
  const { shares: receivedShares } = useGetShareInbox();
  const { items: trashItems } = useGetTrash();
  const trashCount = trashItems.length;
  const safeInboxDocuments: Document[] = Array.isArray(inboxDocuments)
    ? inboxDocuments
    : [];
  const processingCount = safeInboxDocuments.filter(
    (d) => d.processingStatus === "processing",
  ).length;
  const readyCount = safeInboxDocuments.filter(
    (d) => d.processingStatus === "ready",
  ).length;
  const trayCount = processingCount + readyCount;
  const shareInboxUnreadCount = receivedShares.filter((share) => !share.isRead).length;

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  const orgSubItems = useMemo((): OrgSubItem[] => {
    if (!user) return [];
    if (user.role === Role.OWNER) {
      return [
        {
          href: "/dashboard/branches",
          label: "Branches",
          icon: GitBranch,
        },
        {
          href: "/dashboard/departments",
          label: "Departments",
          icon: Building,
        },
      ];
    }
    if (user.role === Role.BRANCH_MANAGER) {
      return [
        {
          href: "/dashboard/departments",
          label: "Departments",
          icon: Building,
        },
      ];
    }
    return [];
  }, [user]);

  const showOrgMenu = orgSubItems.length > 0;
  const isOrgActive = isOrgRoute(pathname);
  const activeOrgSubHref = orgSubItems.find(
    (sub) =>
      pathname === sub.href || pathname.startsWith(`${sub.href}/`),
  )?.href;
  const [orgExpanded, setOrgExpanded] = useState(false);
  const isInboxActive = isInboxRoute(pathname);
  const [inboxExpanded, setInboxExpanded] = useState(false);
  const isOrgMenuExpanded = isOrgActive || orgExpanded;
  const isInboxMenuExpanded = isInboxActive || inboxExpanded;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity lg:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen flex-col overflow-visible border-r border-default bg-surface text-foreground transition-all duration-300 ease-out lg:translate-x-0",
          collapsed ? "w-[68px]" : "w-52",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Header: organization brand */}
        <div
          className="relative shrink-0 border-b border-default"
          style={{ height: SIDEBAR_HEADER_HEIGHT }}
        >
          {collapsed ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-2">
              <Link
                href="/"
                onClick={onClose}
                title={user?.organizationName ?? "Dashboard"}
                className="transition-opacity hover:opacity-90"
              >
                <OrganizationBrand
                  name={user?.organizationName}
                  logo={user?.organizationLogo}
                  collapsed
                />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center rounded-lg p-1.5 text-secondary transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-foreground lg:hidden"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex h-full items-center gap-2 px-3">
              <Link
                href="/"
                onClick={onClose}
                title={user?.organizationName ?? "Dashboard"}
                className="flex min-w-0 flex-1 items-center gap-2.5 transition-opacity hover:opacity-90"
              >
                <OrganizationBrand
                  name={user?.organizationName}
                  logo={user?.organizationLogo}
                  collapsed={false}
                />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-foreground lg:hidden"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Collapse / expand on header ↔ nav separator (desktop) */}
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className={[
            "absolute z-[60] h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-default bg-surface text-muted shadow-md transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-foreground",
            isOpen ? "flex" : "hidden lg:flex",
          ].join(" ")}
          style={{
            top: SIDEBAR_HEADER_HEIGHT,
            right: "-0.875rem",
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          ) : (
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          )}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-0.5">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                !isInboxRoute(pathname) &&
                pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;

            const navLink = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={[
                  "group relative flex items-center rounded-md text-sm transition-all duration-150",
                  collapsed
                    ? "justify-center px-0 py-2.5"
                    : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-primary-subtle/60 text-primary font-medium"
                    : "text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground",
                ].join(" ")}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                )}

                <Icon
                  className={[
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted group-hover:text-secondary",
                  ].join(" ")}
                />

                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>

                    {item.href === "/dashboard/unsorted" && trayCount > 0 && (
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                          processingCount > 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700",
                        ].join(" ")}
                      >
                        {trayCount}
                      </span>
                    )}
                    {item.href === "/dashboard/trash" && trashCount > 0 && (
                      <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-neutral-700">
                        {trashCount}
                      </span>
                    )}
                  </>
                )}

                {collapsed &&
                  item.href === "/dashboard/unsorted" &&
                  trayCount > 0 && (
                    <span
                      className={[
                        "absolute right-1.5 top-1.5 h-2 w-2 rounded-full",
                        processingCount > 0 ? "bg-amber-400" : "bg-blue-500",
                      ].join(" ")}
                    />
                  )}
                {collapsed &&
                  item.href === "/dashboard/trash" &&
                  trashCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-neutral-500" />
                  )}
              </Link>
            );

            const inboxMenu =
              item.href === INBOX_MENU_INSERT_BEFORE ? (
                collapsed ? (
                  <Link
                    key="inbox"
                    href="/dashboard/inbox"
                    onClick={onClose}
                    title="Inbox"
                    className={[
                      "group relative flex items-center justify-center rounded-md px-0 py-2.5 text-sm transition-all duration-150",
                      isInboxActive
                        ? "bg-primary-subtle/60 text-primary font-medium"
                        : "text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground",
                    ].join(" ")}
                  >
                    {isInboxActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                    )}
                    <Inbox
                      className={[
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        isInboxActive
                          ? "text-primary"
                          : "text-muted group-hover:text-secondary",
                      ].join(" ")}
                    />
                    {shareInboxUnreadCount > 0 ? (
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
                    ) : null}
                  </Link>
                ) : (
                  <div key="inbox">
                    <button
                      type="button"
                      onClick={() => setInboxExpanded((open) => !open)}
                      aria-expanded={isInboxMenuExpanded}
                      className={[
                        "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                        isInboxActive
                          ? "bg-[var(--color-bg-secondary)] text-foreground"
                          : "text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground",
                      ].join(" ")}
                    >
                      <Inbox className="h-[18px] w-[18px] shrink-0 text-muted transition-colors group-hover:text-secondary" />
                      <span className="flex-1 truncate font-medium text-foreground">
                        Inbox
                      </span>
                      {shareInboxUnreadCount > 0 ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-blue-700">
                          {shareInboxUnreadCount}
                        </span>
                      ) : null}
                      <ChevronRight
                        className={[
                          "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                          isInboxMenuExpanded ? "rotate-90" : "",
                        ].join(" ")}
                      />
                    </button>
                    {isInboxMenuExpanded ? (
                      <div className="mt-0.5 space-y-0.5 pb-0.5">
                        {INBOX_SUB_ITEMS.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = isInboxSubActive(pathname, sub.href);
                          const showUnreadBadge =
                            sub.href === "/dashboard/inbox" &&
                            shareInboxUnreadCount > 0;

                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={onClose}
                              className={[
                                "group relative flex items-center gap-2.5 rounded-md py-2 pr-3 text-sm transition-all duration-150",
                                "pl-9",
                                isSubActive
                                  ? "bg-primary-subtle/60 font-medium text-primary"
                                  : "text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground",
                              ].join(" ")}
                            >
                              {isSubActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                              )}
                              <SubIcon
                                className={[
                                  "h-[17px] w-[17px] shrink-0 transition-colors",
                                  isSubActive
                                    ? "text-primary"
                                    : "text-muted group-hover:text-secondary",
                                ].join(" ")}
                              />
                              <span className="flex-1 truncate">{sub.label}</span>
                              {showUnreadBadge ? (
                                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-blue-700">
                                  {shareInboxUnreadCount}
                                </span>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              ) : null;

            const orgMenu =
              item.href === ORG_MENU_INSERT_BEFORE && showOrgMenu
                ? collapsed
                  ? (
                      <Link
                        key="organization"
                        href={orgSubItems[0].href}
                        onClick={onClose}
                        title="Organization"
                        className={[
                          "group relative flex items-center justify-center rounded-md px-0 py-2.5 text-sm transition-all duration-150",
                          isOrgActive
                            ? "bg-primary-subtle/60 text-primary font-medium"
                            : "text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground",
                        ].join(" ")}
                      >
                        {isOrgActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                        )}
                        <Building2
                          className={[
                            "h-[18px] w-[18px] shrink-0 transition-colors",
                            isOrgActive
                              ? "text-primary"
                              : "text-muted group-hover:text-secondary",
                          ].join(" ")}
                        />
                      </Link>
                    )
                  : (
                      <div key="organization">
                        <button
                          type="button"
                          onClick={() => setOrgExpanded((open) => !open)}
                          aria-expanded={isOrgMenuExpanded}
                          className={[
                            "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                            isOrgActive
                              ? "bg-[var(--color-bg-secondary)] text-foreground"
                              : "text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground",
                          ].join(" ")}
                        >
                          <Building2 className="h-[18px] w-[18px] shrink-0 text-muted transition-colors group-hover:text-secondary" />
                          <span className="flex-1 truncate font-medium text-foreground">
                            Organization
                          </span>
                          <ChevronRight
                            className={[
                              "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                              isOrgMenuExpanded ? "rotate-90" : "",
                            ].join(" ")}
                          />
                        </button>
                        {isOrgMenuExpanded ? (
                          <div className="mt-0.5 space-y-0.5 pb-0.5">
                            {orgSubItems.map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive = sub.href === activeOrgSubHref;

                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={onClose}
                                  className={[
                                    "group relative flex items-center gap-2.5 rounded-md py-2 pr-3 text-sm transition-all duration-150",
                                    "pl-9",
                                    isSubActive
                                      ? "bg-primary-subtle/60 font-medium text-primary"
                                      : "text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground",
                                  ].join(" ")}
                                >
                                  {isSubActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                                  )}
                                  <SubIcon
                                    className={[
                                      "h-[17px] w-[17px] shrink-0 transition-colors",
                                      isSubActive
                                        ? "text-primary"
                                        : "text-muted group-hover:text-secondary",
                                    ].join(" ")}
                                  />
                                  <span className="truncate">{sub.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    )
                : null;

            const extraMenus = (
              <>
                {orgMenu}
                {inboxMenu}
              </>
            );

            if (orgMenu || inboxMenu) {
              return (
                <Fragment key={item.href}>
                  {extraMenus}
                  {navLink}
                </Fragment>
              );
            }

            return navLink;
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-default px-2.5 py-3">
          <div
            className={[
              "flex items-center rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--color-bg-secondary)] cursor-default",
              collapsed ? "justify-center" : "gap-3",
            ].join(" ")}
          >
            {/* Avatar */}
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-subtle text-xs font-semibold text-primary">
              {user?.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.name ?? "Profile"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>

            {/* Name + org — hidden when collapsed */}
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground leading-tight">
                    {user?.name ?? "Unknown User"}
                  </p>
                  <p className="truncate text-xs text-muted leading-tight mt-0.5">
                    {user?.organizationName ?? "No organization"}
                  </p>
                </div>
                {/* <span className="shrink-0 rounded-md bg-primary-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {role}
                </span> */}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
