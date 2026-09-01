"use client";

import { useMemo, useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useGetCategories } from "@/lib/hooks/useCategories";
import { useGetDocuments } from "@/lib/hooks/useDocuments";
import { DashboardDocumentRow } from "@/components/documents/DashboardDocumentRow";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { SortBar } from "@/components/ui/SortBar";
import { AppSelect } from "@/components/ui/AppSelect";
import { getFileTypeFromName } from "@/lib/upload-file-types";
import type { Document, DocumentFilters, SortOption } from "@/types/document";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export default function DashboardDocumentsPage() {
  const [filters, setFilters] = useState<DocumentFilters>({
    search: "",
    categoryId: undefined,
    page: 1,
    limit: 20,
  });
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  const { documents, pagination, isLoading } = useGetDocuments(filters);
  const { categories } = useGetCategories();
  const currentPage = filters.page ?? 1;

  const handleSearch = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handleCategoryFilter = (categoryId: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      categoryId,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters((prev) => ({
      ...prev,
      limit,
      page: 1,
    }));
  };

  const handleOpenDetails = (document: Document) => {
    setSelectedDocument(document);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  const handleOpenDocument = (document: Document) => {
    if (!document.fileUrl) {
      return;
    }

    setIsDetailsOpen(false);
    setPreviewDocument(document);
  };

  const handleDownloadDocument = (document: Document) => {
    if (!document.fileUrl) {
      return;
    }

    const link = window.document.createElement("a");
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const totalPages = pagination?.totalPages ?? 1;
  const sortedDocuments = useMemo(() => {
    const items = [...documents];

    if (sortBy === "name_asc" || sortBy === "name_desc") {
      items.sort((left, right) => left.fileName.localeCompare(right.fileName));
      if (sortBy === "name_desc") {
        items.reverse();
      }
      return items;
    }

    items.sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );

    if (sortBy === "date_desc") {
      items.reverse();
    }

    return items;
  }, [documents, sortBy]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-secondary">
          Manage and organize your uploaded documents
        </p>
      </div>

      <section className="space-y-4 rounded border border-default bg-surface p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr] xl:grid-cols-[1.5fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Search documents..."
              value={filters.search ?? ""}
              onChange={(event) => handleSearch(event.target.value)}
              className="w-full rounded border border-default bg-[var(--color-bg-secondary)] py-2 pl-10 pr-4 text-foreground placeholder-secondary focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-secondary" />
            <AppSelect
              className="flex-1"
              value={filters.categoryId ?? ""}
              onValueChange={(value) => handleCategoryFilter(value || undefined)}
              placeholder="All Categories"
              triggerClassName="rounded-xl"
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-2 text-sm text-secondary sm:flex-row sm:items-center sm:justify-end">
            <span>Page size</span>
            <AppSelect
              value={String(filters.limit)}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
              placeholder="Page size"
              triggerClassName="rounded-2xl min-w-[5rem]"
              options={PAGE_SIZE_OPTIONS.map((option) => ({
                value: String(option),
                label: String(option),
              }))}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-4 text-sm text-foreground">
          {isLoading
            ? "Loading documents..."
            : `Showing ${documents.length} of ${pagination?.total ?? 0} documents`}
        </div>

        <SortBar sortBy={sortBy} onChange={setSortBy} />

        <div className="divide-y divide-default">
          {isLoading && documents.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-3xl bg-[var(--color-bg-secondary)]"
                />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-default bg-[var(--color-bg-secondary)] p-12 text-center text-sm text-secondary">
              <h2 className="text-lg font-semibold text-foreground">No documents found</h2>
              <p className="mt-2">
                {filters.search || filters.categoryId
                  ? "Try adjusting your filters."
                  : "Upload documents to see them here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-default bg-surface">
              <div className="grid gap-4 border-b border-default px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-secondary grid-cols-[minmax(320px,1.8fr)_160px_160px_minmax(140px,1fr)_132px]">
                <span>Name</span>
                <span>Owner</span>
                <span>Last changes</span>
                <span>Category</span>
                <span className="text-right">Actions</span>
              </div>
              {sortedDocuments.map((document) => (
                <DashboardDocumentRow
                  key={document.id}
                  document={document}
                  onDetails={handleOpenDetails}
                  onOpen={handleOpenDocument}
                  onDownload={handleDownloadDocument}
                />
              ))}
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-secondary">
              Page {currentPage} of {pagination.totalPages}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="inline-flex items-center gap-2 rounded border border-default bg-surface px-4 py-2 text-sm text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages || isLoading}
                className="inline-flex items-center gap-2 rounded border border-default bg-surface px-4 py-2 text-sm text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <DocumentDetails
        document={selectedDocument}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onOpen={() => selectedDocument && handleOpenDocument(selectedDocument)}
        onDownload={() => selectedDocument && handleDownloadDocument(selectedDocument)}
      />

      <DocumentPreview
        isOpen={Boolean(previewDocument?.fileUrl)}
        onClose={() => setPreviewDocument(null)}
        fileUrl={previewDocument?.fileUrl ?? ""}
        fileName={previewDocument?.fileName ?? ""}
        fileType={previewDocument ? getFileTypeFromName(previewDocument.fileName) : "application/octet-stream"}
      />
    </div>
  );
}
