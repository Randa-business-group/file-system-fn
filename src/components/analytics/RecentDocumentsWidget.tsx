"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { DocumentTypeChip } from "@/components/documents/DocumentTypeIcon";
import { useGetRecentDocuments } from "@/lib/hooks/useAnalytics";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatTimeAgo } from "@/lib/format-time";

export function RecentDocumentsWidget() {
  const { data, isLoading, isError } = useGetRecentDocuments();

  return (
    <DashboardCard
      title="Recent documents"
      action={
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton key={index} height={56} rounded="1rem" />
          ))}
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-error">Failed to load documents.</p>
      ) : data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-default bg-[var(--color-bg-secondary)]/60 px-4 py-8 text-center text-sm text-secondary">
          No documents yet. Upload your first file to get started.
        </p>
      ) : (
        <ul className="divide-y divide-default">
          {data.map((doc) => (
            <li key={doc.id}>
              <Link
                href="/dashboard/documents"
                className="group flex items-center gap-3 py-3.5 transition first:pt-0 last:pb-0 hover:opacity-90"
              >
                <DocumentTypeIcon fileName={doc.fileName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                    {doc.title?.trim() || doc.fileName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-secondary">
                    Updated {formatTimeAgo(doc.createdAt)}
                    {doc.uploadedBy ? ` · ${doc.uploadedBy}` : ""}
                  </p>
                </div>
                <DocumentTypeChip
                  fileName={doc.fileName}
                  className="hidden shrink-0 sm:inline-flex"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
