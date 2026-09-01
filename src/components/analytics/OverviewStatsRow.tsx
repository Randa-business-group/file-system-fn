"use client";

import {
  AlertCircle,
  FileStack,
  HardDrive,
  Inbox,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useGetStats, useGetStorage } from "@/lib/hooks/useAnalytics";
import { useGetUnreadCount } from "@/lib/hooks/useNotifications";
import { StatsCard } from "@/components/ui/StatsCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

function formatStorageLabel(bytes: number) {
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function OverviewStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-default bg-surface p-5 shadow-sm"
        >
          <LoadingSkeleton height={14} width="55%" />
          <div className="mt-4">
            <LoadingSkeleton height={32} width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverviewStatsRow() {
  const { isOwner, isBranchManager, isDeptManager } = useAuth();
  const { stats, isLoading: statsLoading, isError: statsError } = useGetStats();
  const { data: storage, isLoading: storageLoading } = useGetStorage();
  const { unreadCount } = useGetUnreadCount();

  if (statsLoading || storageLoading) {
    return <OverviewStatsSkeleton />;
  }

  if (statsError || !stats) {
    return (
      <div className="rounded-2xl border border-dashed border-default bg-surface px-5 py-8 text-center text-sm text-error">
        Failed to load overview stats.
      </div>
    );
  }

  const storagePercent = Math.min(100, Math.round(storage?.percentage ?? 0));
  const pendingTotal = stats.pendingInbox + unreadCount;
  const showMembers = isOwner || isBranchManager || isDeptManager;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Documents"
        value={stats.totalDocuments.toLocaleString()}
        subtitle={`${stats.totalFolders} folders in workspace`}
        icon={<FileStack className="h-5 w-5" />}
        color="var(--color-primary)"
      />

      <StatsCard
        title="Storage"
        value={`${storagePercent}%`}
        subtitle={
          storage
            ? `${formatStorageLabel(storage.used)} of ${formatStorageLabel(storage.total)} used`
            : "Organization file usage"
        }
        subtitleTone={storagePercent >= 85 ? "warning" : "muted"}
        icon={<HardDrive className="h-5 w-5" />}
        color="var(--color-info)"
        footer={
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        }
      />

      {showMembers ? (
        <StatsCard
          title="Members"
          value={(stats.totalMembers ?? 0).toLocaleString()}
          subtitle={`${stats.totalDepartments ?? 0} departments`}
          icon={<Users className="h-5 w-5" />}
          color="var(--color-success)"
        />
      ) : (
        <StatsCard
          title="Collections"
          value={stats.totalCollections.toLocaleString()}
          subtitle="Curated document groups"
          icon={<FileStack className="h-5 w-5" />}
          color="var(--color-success)"
        />
      )}

      <StatsCard
        title="Pending items"
        value={pendingTotal.toLocaleString()}
        subtitle={
          pendingTotal > 0 ? "Requires your attention" : "You're all caught up"
        }
        subtitleTone={pendingTotal > 0 ? "warning" : "success"}
        icon={
          pendingTotal > 0 ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <Inbox className="h-5 w-5" />
          )
        }
        color={pendingTotal > 0 ? "var(--color-warning)" : "var(--color-text-muted)"}
      />
    </div>
  );
}
