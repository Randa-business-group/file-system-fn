"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  RefreshCcw,
  Inbox,
  Clock,
  CheckCircle2,
  Loader2,
  FileStack,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SortBar } from "@/components/ui/SortBar";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { DataTable, type ColumnDef, type TableFilter } from "@/components/table/page";
import { documentApi } from "@/api/document.api";
import { useGetInbox, useDeleteDocument } from "@/lib/hooks/useDocuments";
import {
  invalidateTrashRelatedQueries,
  showMovedToTrashToast,
} from "@/lib/trash-toast";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { SortOption, Document } from "@/types/document";

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "amber" | "sky" | "emerald";
  icon: React.ReactNode;
}) {
  const tones = {
    amber: "border-amber-200/80 bg-amber-50/80 text-amber-900",
    sky: "border-sky-200/80 bg-sky-50/80 text-sky-900",
    emerald: "border-emerald-200/80 bg-emerald-50/80 text-emerald-900",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded border px-4 py-3.5 ${tones[tone]}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded bg-white/70 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums leading-none">{value}</p>
        <p className="mt-1 text-xs font-medium opacity-80">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "processing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </span>
      );
    case "ready":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
          <Clock className="h-3 w-3" />
          Ready
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-3 w-3" />
          Confirmed
        </span>
      );
    default:
      return null;
  }
}

export default function DashboardUnsortedPage() {
  const router = useRouter();
  const { documents, isLoading, isFetching, refetch } = useGetInbox();
  const deleteDocument = useDeleteDocument();
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"single" | "multiple" | null>(
    null,
  );
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null,
  );

  const processingCount = documents.filter(
    (d) => d.processingStatus === "processing",
  ).length;
  const readyCount = documents.filter(
    (d) => d.processingStatus === "ready",
  ).length;
  const confirmedCount = documents.filter(
    (d) => d.processingStatus === "confirmed",
  ).length;
  const reviewedCount = readyCount + confirmedCount;
  const reviewProgress =
    documents.length > 0
      ? Math.round((reviewedCount / documents.length) * 100)
      : 0;
  const analysisProgress =
    documents.length > 0 && processingCount > 0
      ? Math.round(
          ((documents.length - processingCount) / documents.length) * 100,
        )
      : 0;

  const sortedDocuments = useMemo(() => {
    const items = [...documents];
    if (sortBy === "name_asc" || sortBy === "name_desc") {
      items.sort((left, right) => left.fileName.localeCompare(right.fileName));
      if (sortBy === "name_desc") items.reverse();
    } else {
      items.sort(
        (left, right) =>
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime(),
      );
      if (sortBy === "date_desc") items.reverse();
    }

    const processing = items.filter((d) => d.processingStatus === "processing");
    const rest = items.filter((d) => d.processingStatus !== "processing");
    return [...processing, ...rest];
  }, [documents, sortBy]);

  const selectedDocument = documents.find((d) => d.id === selectedDocumentId);
  const allSelected =
    documents.length > 0 && selectedIds.size === documents.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const handleToggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.id)));
    }
  }, [allSelected, documents]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newIds = new Set(prev);
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        newIds.add(id);
      }
      return newIds;
    });
  }, []);

  const handleOpenDetails = useCallback((document: Document) => {
    setSelectedDocumentId(document.id);
    setIsDetailsOpen(true);
  }, []);

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  const handleDeleteSingle = useCallback((document: Document) => {
    setDocumentToDelete(document);
    setDeleteMode("single");
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (deleteMode === "single" && documentToDelete) {
      try {
        await deleteDocument.mutateAsync(documentToDelete.id);
        setSelectedIds((prev) => {
          const newIds = new Set(prev);
          newIds.delete(documentToDelete.id);
          return newIds;
        });
      } catch {
        toast.error("Failed to delete document");
      }
    } else if (deleteMode === "multiple") {
      try {
        const idsToDelete = Array.from(selectedIds);
        const trashItems = await Promise.all(
          idsToDelete.map((id) => documentApi.deleteDocument(id)),
        );
        queryClient.setQueryData<Document[]>(["tray"], (current) =>
          current?.filter((doc) => !idsToDelete.includes(doc.id)) ?? [],
        );
        await invalidateTrashRelatedQueries(queryClient);
        if (trashItems.length === 1) {
          showMovedToTrashToast(trashItems[0].id, queryClient);
        } else {
          toast.success(
            `${trashItems.length} documents moved to trash`,
          );
        }
        setSelectedIds(new Set());
      } catch {
        toast.error("Failed to delete documents");
      }
    }
    setDeleteModalOpen(false);
    setDocumentToDelete(null);
    setDeleteMode(null);
  };

  const handleDeleteAll = () => {
    setDeleteMode("multiple");
    setDeleteModalOpen(true);
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const deleteConfirmationText =
    deleteMode === "multiple"
      ? `${selectedIds.size} documents`
      : documentToDelete?.fileName ?? "document";

  const unsortedFilters: TableFilter<Document>[] = useMemo(
    () => [
      {
        id: "processingStatus",
        label: "Status",
        placeholder: "All Statuses",
        options: [
          { value: "", label: "All Statuses" },
          { value: "processing", label: "Processing" },
          { value: "ready", label: "Ready" },
          { value: "confirmed", label: "Confirmed" },
        ],
        filterFn: (row, val) => !val || row.processingStatus === val,
      },
    ],
    [],
  );

  const columns: ColumnDef<Document>[] = useMemo(
    () => [
      {
        id: "select",
        width: "48px",
        header: () => (
          <input
            ref={(el) => {
              if (el) {
                el.indeterminate = someSelected;
              }
            }}
            type="checkbox"
            checked={allSelected}
            onChange={handleToggleAll}
            className="cursor-pointer rounded border-default"
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => {
          const isSelected = selectedIds.has(row.id);
          return (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleSelect(row.id)}
              className="cursor-pointer rounded border-default"
              aria-label={`Select ${row.fileName}`}
              onClick={(e) => e.stopPropagation()}
            />
          );
        },
      },
      {
        id: "fileName",
        accessorKey: "fileName",
        header: "Document",
        sortable: true,
        cell: ({ row }) => (
          <div className="max-w-xs">
            <button
              type="button"
              onClick={() => handleOpenDetails(row)}
              disabled={row.processingStatus === "processing"}
              className="block max-w-full truncate text-left font-medium text-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {row.title || row.fileName}
            </button>
            {row.processingStatus === "processing" ? (
              <p className="mt-0.5 text-xs text-amber-700">
                OCR & AI in queue…
              </p>
            ) : (
              row.title &&
              row.fileName !== row.title && (
                <p className="mt-0.5 truncate text-xs text-secondary">
                  {row.fileName}
                </p>
              )
            )}
          </div>
        ),
      },
      {
        id: "processingStatus",
        accessorKey: "processingStatus",
        header: "Status",
        sortable: true,
        cell: ({ row }) => <StatusBadge status={row.processingStatus} />,
      },
      {
        id: "category",
        accessorKey: "category.name",
        header: "Category",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-secondary">{row.category?.name ?? "—"}</span>
        ),
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        header: "Updated",
        sortable: true,
        cell: ({ row }) => {
          const formattedDate = new Date(
            row.updatedAt || row.createdAt,
          ).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          return (
            <span className="text-secondary tabular-nums">{formattedDate}</span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleOpenDetails(row)}
              disabled={row.processingStatus === "processing"}
              className="rounded bg-[var(--color-bg-tertiary)] px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {row.processingStatus === "processing" ? "Analyzing" : "Review"}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteSingle(row)}
              disabled={deleteDocument.isLoading}
              className="rounded p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [
      allSelected,
      deleteDocument.isLoading,
      handleDeleteSingle,
      handleOpenDetails,
      handleToggleAll,
      handleToggleSelect,
      selectedIds,
      someSelected,
    ],
  );

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <OrgPageHeader
        title="Tray"
        description="Uncategorized documents waiting for review. Bulk uploads show here immediately; OCR and AI run one file at a time."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-default bg-surface px-4 py-2.5 shadow-sm">
              <FileStack className="h-4 w-4 text-secondary" />
              <span className="text-xs font-medium uppercase tracking-wider text-secondary">
                Total
              </span>
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {isLoading ? "—" : documents.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-default bg-surface px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-[var(--color-bg-secondary)] disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        }
      />

      {processingCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-amber-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Loader2 className="h-5 w-5 animate-spin text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-950">
                Analyzing {processingCount} document
                {processingCount === 1 ? "" : "s"}…
              </p>
              <p className="mt-0.5 text-xs text-amber-800/90">
                OCR and AI run sequentially — one file at a time. This page
                updates automatically.
              </p>
            </div>
          </div>
          <div className="min-w-[140px] sm:max-w-xs sm:flex-1">
            <div className="flex items-center justify-between text-xs font-medium text-amber-900">
              <span>Analysis progress</span>
              <span className="tabular-nums">{analysisProgress}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-amber-200/60">
              <div
                className="h-full rounded-full bg-amber-600 transition-all duration-500"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Processing"
          value={processingCount}
          tone="amber"
          icon={<Loader2 className="h-4 w-4 animate-spin text-amber-700" />}
        />
        <StatCard
          label="Ready for review"
          value={readyCount}
          tone="sky"
          icon={<Inbox className="h-4 w-4 text-sky-700" />}
        />
        <StatCard
          label="Confirmed"
          value={confirmedCount}
          tone="emerald"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />}
        />
      </div>

      {documents.length > 0 && processingCount === 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Review progress</span>
            <span className="font-medium tabular-nums text-foreground">
              {reviewProgress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${reviewProgress}%` }}
            />
          </div>
        </div>
      )}

      {documents.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-dashed border-default bg-[var(--color-bg-secondary)]/50 py-16">
          <EmptyState
            title="Tray is empty"
            description="Bulk uploads land here after AI analysis. Organize documents into folders and categories when you review them."
            actionLabel="Browse all documents"
            onAction={() => router.push("/dashboard/documents")}
          />
        </div>
      ) : (
        <>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-4 rounded border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="text-sm font-medium text-foreground">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={deleteDocument.isLoading}
                className="ml-auto inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete selected
              </button>
            </div>
          )}

          <DataTable<Document>
            data={sortedDocuments}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No documents found in tray."
            searchable={true}
            searchPlaceholder="Search tray documents..."
            searchFields={["title", "fileName", "category.name", "processingStatus"]}
            filters={unsortedFilters}
            sortSlot={<SortBar sortBy={sortBy} onChange={setSortBy} />}
            paginated={true}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            keyExtractor={(doc) => doc.id}
            rowClassName={(doc) => (selectedIds.has(doc.id) ? "bg-primary/5" : "")}
            footerSlot={
              <p className="pt-2 text-center text-xs text-secondary">
                Need everything filed?{" "}
                <Link
                  href="/dashboard/documents"
                  className="font-medium text-primary hover:underline"
                >
                  View all documents
                </Link>
              </p>
            }
          />
        </>
      )}

      <DocumentDetails
        key={selectedDocumentId ?? "no-document"}
        document={selectedDocument}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteMode(null);
          setDocumentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={
          deleteMode === "multiple"
            ? `Move ${selectedIds.size} documents to trash?`
            : "Move to trash?"
        }
        description={
          deleteMode === "multiple"
            ? `${selectedIds.size} selected documents will be moved to trash for 30 days.`
            : `"${documentToDelete?.fileName}" will be moved to trash for 30 days. You can restore it from Trash.`
        }
        isLoading={deleteDocument.isLoading}
        itemNameToConfirm={deleteConfirmationText}
      />
    </div>
  );
}
