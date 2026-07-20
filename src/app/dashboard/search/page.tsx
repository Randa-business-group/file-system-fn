"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FolderOpen,
  LibraryBig,
  Search,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import { SearchHighlight } from "@/components/search/SearchHighlight";
import { AppSelect } from "@/components/ui/AppSelect";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useGetCategories } from "@/lib/hooks/useCategories";
import { useGetRootFolders } from "@/lib/hooks/useFolders";
import { useGetDocumentById } from "@/lib/hooks/useDocuments";
import { useSearch } from "@/lib/hooks/useSearch";
import type { SearchDocumentHit, SearchFilters } from "@/types/search";

const MIN_QUERY_LENGTH = 2;

export default function DashboardSearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [folderId, setFolderId] = useState<string | undefined>();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [previewDocument, setPreviewDocument] = useState<SearchDocumentHit | null>(null);

  const filters: SearchFilters = useMemo(
    () => ({
      query,
      categoryId,
      folderId,
      page,
      limit: 15,
    }),
    [query, categoryId, folderId, page],
  );

  const { searchResult, isLoading } = useSearch(filters);
  const { categories } = useGetCategories(undefined, { enabled: showFilters });
  const { folders } = useGetRootFolders({ enabled: showFilters });
  const { document: selectedDocument, isLoading: isDocumentLoading } =
    useGetDocumentById(selectedDocumentId ?? "");

  const documents = searchResult?.documents.data ?? [];
  const foldersResult = searchResult?.folders.data ?? [];
  const collectionsResult = searchResult?.collections.data ?? [];
  const sharedSpacesResult = searchResult?.sharedSpaces.data ?? [];
  const documentTotal = searchResult?.documents.total ?? 0;
  const folderTotal = searchResult?.folders.total ?? 0;
  const collectionTotal = searchResult?.collections.total ?? 0;
  const sharedSpaceTotal = searchResult?.sharedSpaces.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(documentTotal / (filters.limit ?? 15)));
  const canSearch = query.trim().length >= MIN_QUERY_LENGTH;
  const hasActiveFilters = Boolean(categoryId || folderId);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setCategoryId(undefined);
    setFolderId(undefined);
    setPage(1);
  };

  function getFileType(fileName: string) {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

    switch (extension) {
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "webp":
        return `image/${extension === "jpg" ? "jpeg" : extension}`;
      case "pdf":
        return "application/pdf";
      case "xls":
      case "xlsx":
      case "csv":
        return "application/vnd.ms-excel";
      default:
        return "application/octet-stream";
    }
  }

  const statusLine = useMemo(() => {
    if (!canSearch) {
      return "Type at least 2 characters to search.";
    }
    if (isLoading) {
      return "Searching…";
    }
    const parts: string[] = [];
    if (documentTotal > 0) {
      parts.push(`${documentTotal} document${documentTotal === 1 ? "" : "s"}`);
    }
    if (folderTotal > 0) {
      parts.push(`${folderTotal} folder${folderTotal === 1 ? "" : "s"}`);
    }
    if (collectionTotal > 0) {
      parts.push(
        `${collectionTotal} collection${collectionTotal === 1 ? "" : "s"}`,
      );
    }
    if (sharedSpaceTotal > 0) {
      parts.push(
        `${sharedSpaceTotal} shared space${sharedSpaceTotal === 1 ? "" : "s"}`,
      );
    }
    if (parts.length === 0) {
      return "No matches found.";
    }
    return `Found ${parts.join(" and ")}`;
  }, [
    canSearch,
    documentTotal,
    folderTotal,
    collectionTotal,
    sharedSpaceTotal,
    isLoading,
  ]);

  const handleOpenDocument = (doc: SearchDocumentHit) => {
    if (!doc.fileUrl) return;
    setPreviewDocument(doc);
  };

  const handleDownloadDocument = (doc: SearchDocumentHit) => {
    if (!doc.fileUrl) return;
    const link = window.document.createElement("a");
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Search</h1>
        <p className="mt-2 text-sm text-secondary">
          Find files by name, details, or words inside the document text.
        </p>
      </div>

      <section className="rounded-3xl border border-default bg-surface p-5 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
          <input
            type="search"
            autoFocus
            placeholder="Search files, summaries, or text inside documents…"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            className="w-full rounded-3xl border border-default bg-[var(--color-bg-secondary)] py-3.5 pl-12 pr-4 text-base text-foreground placeholder-secondary focus:border-primary focus:outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-secondary">{statusLine}</p>
          <button
            type="button"
            onClick={() => setShowFilters((open) => !open)}
            className="inline-flex items-center gap-2 rounded-2xl border border-default px-3 py-2 text-sm font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                On
              </span>
            ) : null}
            <ChevronDown
              className={`h-4 w-4 transition ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {showFilters ? (
          <div className="mt-4 grid gap-3 border-t border-default pt-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Category</span>
              <AppSelect
                value={categoryId ?? ""}
                onValueChange={(value) => {
                  setCategoryId(value || undefined);
                  setPage(1);
                }}
                placeholder="All categories"
                options={[
                  { value: "", label: "All categories" },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-foreground">Folder</span>
              <AppSelect
                value={folderId ?? ""}
                onValueChange={(value) => {
                  setFolderId(value || undefined);
                  setPage(1);
                }}
                placeholder="All folders"
                options={[
                  { value: "", label: "All folders" },
                  ...folders.map((folder) => ({
                    value: folder.id,
                    label: folder.name,
                  })),
                ]}
              />
            </label>
            {hasActiveFilters ? (
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {!canSearch ? (
        <div className="rounded-3xl border border-dashed border-default bg-surface/60 px-6 py-12 text-center text-sm text-secondary">
          Start typing to search across document titles, metadata, summaries, and
          extracted file text.
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">
              Documents
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, index) => (
                  <LoadingSkeleton key={index} height={88} rounded="1.25rem" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              hasActiveFilters ? (
                <EmptyState
                  title="No documents found"
                  description="Try different keywords or remove filters."
                  actionLabel="Clear filters"
                  onAction={handleClearFilters}
                />
              ) : (
                <div className="rounded-3xl border border-dashed border-default bg-surface px-6 py-12 text-center text-sm text-secondary">
                  No documents found. Try different keywords.
                </div>
              )
            ) : (
              <ul className="space-y-3">
                {documents.map((document) => (
                  <li
                    key={document.id}
                    className="rounded-2xl border border-default bg-surface p-4 shadow-sm transition hover:border-primary/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-bg-secondary)]">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setSelectedDocumentId(document.id)}
                          className="text-left text-base font-semibold text-foreground transition hover:text-primary"
                        >
                          {document.title ?? document.fileName}
                        </button>
                        <p className="mt-1 text-xs text-secondary">
                          {[document.category?.name, document.folder?.name]
                            .filter(Boolean)
                            .join(" · ") || "Uncategorized"}
                          {" · "}
                          {new Date(document.createdAt).toLocaleDateString()}
                        </p>
                        {document.textSnippet ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-secondary">
                            <SearchHighlight
                              text={document.textSnippet}
                              query={query}
                            />
                          </p>
                        ) : document.concerning ? (
                          <p className="mt-2 line-clamp-1 text-sm text-secondary">
                            {document.concerning}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDocument(document)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-default text-secondary transition hover:bg-[var(--color-bg-secondary)]"
                          aria-label="Open file"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(document)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-default text-secondary transition hover:bg-[var(--color-bg-secondary)]"
                          aria-label="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {documentTotal > (filters.limit ?? 15) && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-sm text-secondary">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-2xl border border-default px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-2xl border border-default px-3 py-2 text-sm disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {folderTotal > 0 || (isLoading && canSearch) ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">
                Folders
              </h2>
              {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...Array(2)].map((_, index) => (
                    <LoadingSkeleton key={index} height={72} rounded="1.25rem" />
                  ))}
                </div>
              ) : foldersResult.length === 0 ? null : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {foldersResult.map((folder) => (
                    <li key={folder.id}>
                      <Link
                        href={`/dashboard/my-folders?folder=${encodeURIComponent(folder.slug ?? folder.id)}`}
                        className="flex items-center gap-3 rounded-2xl border border-default bg-surface p-4 transition hover:border-primary/40"
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                          <FolderOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {folder.name}
                          </p>
                          <p className="text-xs text-secondary">
                            {folder.itemCount} items
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {collectionTotal > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">
                Collections
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {collectionsResult.map((collection) => (
                  <li key={collection.id}>
                    <Link
                      href={`/dashboard/collections/${collection.slug}`}
                      className="flex items-center gap-3 rounded-2xl border border-default bg-surface p-4 transition hover:border-primary/40"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                        <LibraryBig className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {collection.name}
                        </p>
                        <p className="text-xs text-secondary">
                          {collection.documentCount} documents
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {sharedSpaceTotal > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">
                Shared spaces
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {sharedSpacesResult.map((space) => (
                  <li key={space.id}>
                    <Link
                      href={`/dashboard/shared/${space.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-default bg-surface p-4 transition hover:border-primary/40"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                        <Share2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {space.name}
                        </p>
                        <p className="text-xs text-secondary">
                          {space.documentCount} documents
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      {selectedDocumentId ? (
        <DocumentDetails
          document={selectedDocument ?? null}
          isOpen
          isLoading={isDocumentLoading}
          onClose={() => setSelectedDocumentId(null)}
        />
      ) : null}

      {previewDocument ? (
        <DocumentPreview
          isOpen
          onClose={() => setPreviewDocument(null)}
          fileUrl={previewDocument.fileUrl}
          fileName={previewDocument.fileName}
          fileType={getFileType(previewDocument.fileName)}
        />
      ) : null}
    </div>
  );
}
