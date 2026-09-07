"use client";

import { useCallback, useMemo, useState } from "react";
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
import { DataTable, type ColumnDef, type TableFilter } from "@/components/table/page";
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

  const handleRestore = useCallback(
    async (item: TrashItem) => {
      try {
        await restoreTrash.mutateAsync(item.id);
        toast.success("Restored");
      } catch {
        toast.error("Failed to restore");
      }
    },
    [restoreTrash],
  );

  const handlePermanentDelete = useCallback(async () => {
    if (!deletingItem) return;
    try {
      await permanentDelete.mutateAsync(deletingItem.id);
      toast.success("Deleted forever");
      setDeletingItem(null);
    } catch {
      toast.error("Failed to delete permanently");
    }
  }, [deletingItem, permanentDelete]);

  const handleEmptyTrash = useCallback(async () => {
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
  }, [emptyTrash]);

  const trashFilters: TableFilter<TrashItem>[] = useMemo(
    () => [
      {
        id: "type",
        label: "Type",
        placeholder: "All Types",
        options: [
          { value: "", label: "All Types" },
          { value: TrashItemType.DOCUMENT, label: "Documents" },
          { value: TrashItemType.FOLDER, label: "Folders" },
          { value: TrashItemType.COLLECTION, label: "Collections" },
          { value: TrashItemType.SHARED_SPACE, label: "Shared spaces" },
        ],
        filterFn: (row, val) => !val || row.type === val,
      },
    ],
    [],
  );

  const columns: ColumnDef<TrashItem>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        sortable: true,
        cell: ({ row }) => {
          const meta = TYPE_META[row.type];
          const Icon = meta?.icon ?? FileText;

          return (
            <div className="flex min-w-0 items-center gap-3">
              {row.type === TrashItemType.DOCUMENT ? (
                <DocumentTypeIcon fileName={row.name} size="md" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.name}</p>
                {row.itemCount > 1 || (row.itemCount === 1 && row.type === TrashItemType.FOLDER) ? (
                  <p className="text-xs text-muted">
                    {row.itemCount === 1 ? "1 item" : `${row.itemCount} items`}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: "type",
        accessorKey: "type",
        header: "Type",
        sortable: true,
        cell: ({ row }) => {
          const meta = TYPE_META[row.type];
          return (
            <span className="inline-flex items-center rounded-md bg-[var(--color-bg-secondary)] px-2.5 py-1 text-xs font-medium text-secondary">
              {meta?.label ?? row.type}
            </span>
          );
        },
      },
      {
        id: "deletedAt",
        accessorKey: "deletedAt",
        header: "Deleted",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-secondary tabular-nums">
            {formatDeletedAt(row.deletedAt)}
          </span>
        ),
      },
      {
        id: "expiresAt",
        accessorKey: "expiresAt",
        header: "Expires In",
        sortable: true,
        cell: ({ row }) => {
          const days = getDaysRemaining(row);
          const isUrgent = days <= 3;
          return (
            <span
              className={[
                "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium tabular-nums",
                isUrgent
                  ? "bg-amber-100 text-amber-800"
                  : "bg-[var(--color-bg-tertiary)] text-secondary",
              ].join(" ")}
            >
              {getExpiryLabel(row)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        cell: ({ row }) => (
          <div
            className="flex shrink-0 items-center justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={restoreTrash.isLoading}
              onClick={() => void handleRestore(row)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-default bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore
            </button>
            <button
              type="button"
              disabled={permanentDelete.isLoading}
              onClick={() => setDeletingItem(row)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete forever
            </button>
          </div>
        ),
      },
    ],
    [handleRestore, permanentDelete.isLoading, restoreTrash.isLoading],
  );

  return (
    <div className="space-y-6">
      {items.length === 0 && !isLoading ? (
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
        <DataTable<TrashItem>
          data={items}
          columns={columns}
          isLoading={isLoading}
          title="Trash"
          description="Items stay in trash for 30 days, then are permanently removed automatically."
          headerActions={
            items.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsEmptyModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Empty trash
              </button>
            ) : null
          }
          searchable={true}
          searchPlaceholder="Search deleted items..."
          searchFields={["name", "type"]}
          filters={trashFilters}
          paginated={true}
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
          keyExtractor={(item) => item.id}
          emptyMessage="No trash items match your criteria."
        />
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
