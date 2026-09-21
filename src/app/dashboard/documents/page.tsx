"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink, Eye, MoreHorizontal } from "lucide-react";
import { useGetCategories } from "@/lib/hooks/useCategories";
import { useGetDocuments } from "@/lib/hooks/useDocuments";
import { DataTable, type ColumnDef, type TableFilter } from "@/components/table/page";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { SortBar } from "@/components/ui/SortBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDocumentFileMeta, getFileTypeFromName } from "@/lib/upload-file-types";
import type { Document, DocumentFilters, SortOption } from "@/types/document";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function getOwnerName(document: Document) {
  if (document.documentOwner?.trim()) {
    return document.documentOwner;
  }

  const uploadedBy = document.uploadedBy;
  return typeof uploadedBy === "string"
    ? uploadedBy
    : uploadedBy?.name ?? "Unknown";
}

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

  const handleSearch = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handleCategoryFilter = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categoryId: categoryId || undefined,
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

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      search: "",
      categoryId: undefined,
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

  // Synchronize column header sorting with SortBar
  const sortKey = sortBy.startsWith("name") ? "fileName" : "createdAt";
  const sortOrder: "asc" | "desc" = sortBy.endsWith("asc") ? "asc" : "desc";

  const handleSortChange = (key: string, order: "asc" | "desc" | null) => {
    if (key === "fileName") {
      setSortBy(order === "desc" ? "name_desc" : "name_asc");
    } else if (key === "createdAt" || key === "updatedAt") {
      setSortBy(order === "asc" ? "date_asc" : "date_desc");
    }
  };

  const categoryFilters: TableFilter<Document>[] = useMemo(
    () => [
      {
        id: "categoryId",
        label: "Category",
        placeholder: "All Categories",
        value: filters.categoryId ?? "",
        onChange: handleCategoryFilter,
        options: [
          { value: "", label: "All Categories" },
          ...categories.map((category) => ({
            value: category.id,
            label: category.name,
          })),
        ],
      },
    ],
    [categories, filters.categoryId],
  );

  const columns: ColumnDef<Document>[] = useMemo(
    () => [
      {
        id: "fileName",
        accessorKey: "fileName",
        header: "Name",
        sortable: true,
        cell: ({ row }) => {
          const fileMeta = getDocumentFileMeta(row.fileName);
          return (
            <div className="flex min-w-0 items-center gap-3">
              <DocumentTypeIcon fileName={row.fileName} size="sm" />
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleOpenDetails(row)}
                  className="block max-w-[280px] truncate text-left font-medium text-foreground transition hover:text-primary sm:max-w-[340px]"
                  title={row.title || row.fileName}
                >
                  {row.title || row.fileName}
                </button>
                <p className="truncate text-xs text-secondary">
                  {fileMeta.typeLabel}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "owner",
        header: "Owner",
        cell: ({ row }) => (
          <span className="text-secondary">{getOwnerName(row)}</span>
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Last Changes",
        sortable: true,
        cell: ({ row }) => {
          const formattedDate = new Date(
            row.updatedAt || row.createdAt,
          ).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          return <span className="text-secondary">{formattedDate}</span>;
        },
      },
      {
        id: "category",
        accessorKey: "category.name",
        header: "Category",
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-secondary">
            {row.category?.name ?? "Unsorted"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleOpenDocument(row)}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-default bg-surface px-2.5 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)]"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Preview
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-default text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
                ariaLabel={`Document actions for ${row.title || row.fileName}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem onClick={() => handleOpenDetails(row)}>
                  <Eye className="h-4 w-4" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenDocument(row)}>
                  <ExternalLink className="h-4 w-4" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownloadDocument(row)}>
                  <Download className="h-4 w-4" />
                  Download
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 p-6">
      <DataTable<Document>
        title="Documents"
        description="Manage and organize your uploaded documents"
        data={sortedDocuments}
        columns={columns}
        isLoading={isLoading}
        emptyMessage={
          filters.search || filters.categoryId
            ? "No documents matched your filters."
            : "Upload documents to see them here."
        }
        // Search
        searchable={true}
        searchPlaceholder="Search documents..."
        searchValue={filters.search ?? ""}
        onSearchChange={handleSearch}
        // Filters
        filters={categoryFilters}
        onResetFilters={handleResetFilters}
        // Sorting
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        sortSlot={<SortBar sortBy={sortBy} onChange={setSortBy} />}
        // Pagination
        paginated={true}
        page={filters.page ?? 1}
        pageSize={filters.limit ?? 20}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        totalItems={pagination?.total ?? documents.length}
        totalPages={pagination?.totalPages ?? 1}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

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
        fileType={
          previewDocument
            ? getFileTypeFromName(previewDocument.fileName)
            : "application/octet-stream"
        }
      />
    </div>
  );
}
