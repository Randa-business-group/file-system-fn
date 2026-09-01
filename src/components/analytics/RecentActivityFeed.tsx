"use client";

import Link from "next/link";
import { FolderPlus, Upload } from "lucide-react";
import { useGetRecentDocuments, useGetRecentFolders } from "@/lib/hooks/useAnalytics";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatTimeAgo } from "@/lib/format-time";

type ActivityEntry = {
  id: string;
  title: string;
  description: string;
  time: string;
  kind: "upload" | "folder";
};

export function RecentActivityFeed() {
  const { data: documents, isLoading: docsLoading } = useGetRecentDocuments();
  const { data: folders, isLoading: foldersLoading } = useGetRecentFolders();

  const isLoading = docsLoading || foldersLoading;

  const entries: ActivityEntry[] = [
    ...(documents ?? []).map((doc) => ({
      id: `doc-${doc.id}`,
      title: doc.title?.trim() || doc.fileName,
      description: `${doc.uploadedBy} uploaded a document`,
      time: doc.createdAt,
      kind: "upload" as const,
    })),
    ...(folders ?? []).map((folder) => ({
      id: `folder-${folder.id}`,
      title: folder.name,
      description: `${folder.createdBy} created a folder`,
      time: folder.createdAt,
      kind: "folder" as const,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6);

  return (
    <DashboardCard title="Recent activity">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingSkeleton key={index} height={48} rounded="0.75rem" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-default bg-[var(--color-bg-secondary)]/50 px-4 py-8 text-center text-sm text-secondary">
          Activity from uploads and new folders will appear here.
        </p>
      ) : (
        <ul className="relative space-y-0">
          {entries.map((entry, index) => {
            const Icon = entry.kind === "upload" ? Upload : FolderPlus;
            const isLast = index === entries.length - 1;

            return (
              <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 h-[calc(100%-12px)] w-px bg-default"
                    aria-hidden
                  />
                ) : null}
                <div className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-default bg-surface text-primary shadow-sm">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {entry.title}
                  </p>
                  <p className="mt-0.5 text-xs text-secondary">{entry.description}</p>
                  <p className="mt-1 text-[11px] font-medium text-muted">
                    {formatTimeAgo(entry.time)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-4 border-t border-default pt-4">
        <Link
          href="/dashboard/documents"
          className="text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          View all activity
        </Link>
      </div>
    </DashboardCard>
  );
}
