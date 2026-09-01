"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Folder,
  LibraryBig,
  RotateCcw,
  Share2,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  useEmptyTrash,
  useGetTrash,
  usePermanentDeleteTrash,
  useRestoreTrash,
} from "@/lib/hooks/useTrash";
import type { TrashItem } from "@/types/trash";
import { TrashItemType } from "@/types/trash";

const TYPE_META: Record<
  TrashItemType,
  { label: string; icon: LucideIcon }
> = {
  [TrashItemType.DOCUMENT]: { label: "Document", icon: FileText },
  [TrashItemType.FOLDER]: { label: "Folder", icon: Folder },
  [TrashItemType.COLLECTION]: { label: "Collection", icon: LibraryBig },
  [TrashItemType.SHARED_SPACE]: { label: "Shared space", icon: Share2 },
};

function getDaysRemaining(item: TrashItem): number {
  if (item.daysRemaining != null) return Math.max(0, item.daysRemaining);
  const ms = new Date(item.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function getExpiryLabel(item: TrashItem): string {
  const days = getDaysRemaining(item);
  if (days <= 0) return "Expires today";
  if (days === 1) return "Expires in 1 day";
  return `Expires in ${days} days`;
}

function formatDeletedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TrashPage() {
  const { items, isLoading } = useGetTrash();
  const restoreTrash = useRestoreTrash();
  const permanentDelete = usePermanentDeleteTrash();
  const emptyTrash = useEmptyTrash();

  const [deletingItem, setDeletingItem] = useState<TrashItem | null>(null);
  const [isEmptyModalOpen, setIsEmptyModalOpen] = useState(false);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
      ),
    [items],
  );

  const handleRestore = async (item: TrashItem) => {
    try {
      await restoreTrash.mutateAsync(item.id);
      toast.success("Restored");
    } catch {
      toast.error("Failed to restore");
    }
  };

  const handlePermanentDelete = async () => {
    if (!deletingItem) return;
    try {
      await permanentDelete.mutateAsync(deletingItem.id);
      toast.success("Deleted forever");
      setDeletingItem(null);
    } catch {
      toast.error("Failed to delete permanently");
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const result = await emptyTrash.mutateAsync();
      toast.success(
        result.count === 1
          ? "1 item deleted forever"
          : `${result.count} items deleted forever`,
      );
      setIsEmptyModalOpen(false);
    } catch {
      toast.error("Failed to empty trash");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton height={40} width="100%" />
        <LoadingSkeleton height={96} width="100%" />
        <LoadingSkeleton height={96} width="100%" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-secondary">
          Items stay in trash for 30 days, then are permanently removed
          automatically.
        </p>
        {sortedItems.length > 0 && (
          <button
            type="button"
            onClick={() => setIsEmptyModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Empty trash
          </button>
        )}
      </div>

      {sortedItems.length === 0 ? (
        <EmptyState
          title="Trash is empty"
          description="Deleted documents, folders, collections, and shared spaces will appear here."
          actionLabel="Go to documents"
          onAction={() => {
            window.location.href = "/dashboard/documents";
          }}
          actionIcon={FileText}
        />
      ) : (
        <ul className="space-y-3">
          {sortedItems.map((item) => {
            const meta = TYPE_META[item.type];
            const Icon = meta.icon;
            const days = getDaysRemaining(item);
            const isUrgent = days <= 3;

            return (
              <li
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-default bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {item.type === TrashItemType.DOCUMENT ? (
                    <DocumentTypeIcon fileName={item.name} size="md" />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {meta.label}
                      {item.itemCount > 1
                        ? ` · ${item.itemCount} items`
                        : item.itemCount === 1 && item.type === TrashItemType.FOLDER
                          ? " · 1 item"
                          : ""}
                      {" · "}Deleted {formatDeletedAt(item.deletedAt)}
                    </p>
                    <p
                      className={[
                        "mt-1 text-xs font-medium tabular-nums",
                        isUrgent ? "text-amber-700" : "text-secondary",
                      ].join(" ")}
                    >
                      {getExpiryLabel(item)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={restoreTrash.isLoading}
                    onClick={() => void handleRestore(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-default bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restore
                  </button>
                  <button
                    type="button"
                    disabled={permanentDelete.isLoading}
                    onClick={() => setDeletingItem(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete forever
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DeleteConfirmationModal
        isOpen={deletingItem != null}
        onClose={() => setDeletingItem(null)}
        onConfirm={handlePermanentDelete}
        title="Delete forever?"
        description="This permanently deletes the item from the database and removes files from Cloudinary. This cannot be undone."
        itemNameToConfirm={deletingItem?.name ?? ""}
        isLoading={permanentDelete.isLoading}
      />

      <DeleteConfirmationModal
        isOpen={isEmptyModalOpen}
        onClose={() => setIsEmptyModalOpen(false)}
        onConfirm={handleEmptyTrash}
        title="Empty trash?"
        description="All items in trash will be permanently deleted, including files on Cloudinary."
        itemNameToConfirm="EMPTY TRASH"
        isLoading={emptyTrash.isLoading}
      />
    </div>
  );
}
