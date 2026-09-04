"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { SortBar } from "@/components/ui/SortBar";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import {
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
} from "@/components/ui/Table";
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

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newIds = new Set(selectedIds);
    if (newIds.has(id)) {
      newIds.delete(id);
    } else {
      newIds.add(id);
    }
    setSelectedIds(newIds);
  };

  const handleOpenDetails = (document: Document) => {
    setSelectedDocumentId(document.id);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  const handleDeleteSingle = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteMode("single");
    setDeleteModalOpen(true);
  };

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

      <SortBar sortBy={sortBy} onChange={setSortBy} />

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <LoadingSkeleton key={i} height={72} rounded="0.75rem" />
            ))}
          </div>
          <TableContainer>
            <Table className="min-w-[720px]">
              <TableHeader>
                <tr>
                  <TableHead>
                    <LoadingSkeleton height={14} width={40} />
                  </TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                <TableLoading colSpan={6} rows={6} />
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      ) : documents.length === 0 ? (
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

          <TableContainer>
            <Table className="min-w-[720px]">
              <TableHeader>
                <tr>
                  <TableHead>
                    <input
                      ref={selectAllCheckboxRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleAll}
                      className="rounded border-default"
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {sortedDocuments.map((document) => {
                  const isSelected = selectedIds.has(document.id);
                  const formattedDate = new Date(
                    document.updatedAt || document.createdAt,
                  ).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <TableRow key={document.id} selected={isSelected}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(document.id)}
                          className="rounded border-default"
                          aria-label={`Select ${document.fileName}`}
                        />
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(document)}
                          disabled={document.processingStatus === "processing"}
                          className="block max-w-full truncate text-left font-medium text-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {document.title || document.fileName}
                        </button>
                        {document.processingStatus === "processing" ? (
                          <p className="mt-0.5 text-xs text-amber-700">
                            OCR & AI in queue…
                          </p>
                        ) : (
                          document.title &&
                          document.fileName !== document.title && (
                            <p className="mt-0.5 truncate text-xs text-secondary">
                              {document.fileName}
                            </p>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={document.processingStatus} />
                      </TableCell>
                      <TableCell className="text-secondary">
                        {document.category?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-secondary tabular-nums">
                        {formattedDate}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(document)}
                            disabled={document.processingStatus === "processing"}
                            className="rounded bg-[var(--color-bg-tertiary)] px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {document.processingStatus === "processing"
                              ? "Analyzing"
                              : "Review"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(document)}
                            disabled={deleteDocument.isLoading}
                            className="rounded p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <p className="text-center text-xs text-secondary">
            Need everything filed?{" "}
            <Link
              href="/dashboard/documents"
              className="font-medium text-primary hover:underline"
            >
              View all documents
            </Link>
          </p>
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
