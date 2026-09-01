"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  HardDrive,
  Inbox,
  Layers,
} from "lucide-react";
import { useGetStats, useGetStorage } from "@/lib/hooks/useAnalytics";
import { useGetUnreadCount } from "@/lib/hooks/useNotifications";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

type AttentionItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "warning" | "info";
  icon: typeof Inbox;
};

export function NeedsAttentionWidget() {
  const { stats, isLoading: statsLoading } = useGetStats();
  const { data: storage, isLoading: storageLoading } = useGetStorage();
  const { unreadCount, isLoading: unreadLoading } = useGetUnreadCount();

  const isLoading = statsLoading || storageLoading || unreadLoading;

  const items: AttentionItem[] = [];

  if (stats && stats.pendingInbox > 0) {
    items.push({
      id: "tray",
      title: `${stats.pendingInbox} document${stats.pendingInbox === 1 ? "" : "s"} in tray`,
      description: "Review and confirm unsorted uploads",
      href: "/dashboard/unsorted",
      tone: "warning",
      icon: Layers,
    });
  }

  if (unreadCount > 0) {
    items.push({
      id: "notifications",
      title: `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`,
      description: "Shares, replies, and workspace updates",
      href: "/dashboard/notifications",
      tone: "info",
      icon: Inbox,
    });
  }

  const storagePercent = Math.round(storage?.percentage ?? 0);
  if (storage && storagePercent >= 85) {
    items.push({
      id: "storage",
      title: "Storage almost full",
      description: `${storagePercent}% of allocated space is in use`,
      href: "/dashboard/documents",
      tone: "warning",
      icon: HardDrive,
    });
  }

  return (
    <DashboardCard title="Needs your attention">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingSkeleton key={index} height={64} rounded="1rem" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-default bg-[var(--color-bg-secondary)]/50 px-4 py-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">All clear</p>
            <p className="mt-0.5 text-xs text-secondary">
              No pending items need your attention right now.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const toneClass =
              item.tone === "warning"
                ? "bg-amber-50 text-amber-600"
                : "bg-[var(--color-primary-subtle)] text-primary";

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl border border-default bg-[var(--color-bg-secondary)]/40 px-4 py-3 transition hover:border-primary/25 hover:bg-[var(--color-primary-subtle)]/25"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
                  >
                    {item.tone === "warning" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-secondary">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted transition group-hover:text-primary" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
