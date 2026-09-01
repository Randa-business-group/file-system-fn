"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  FolderOpen,
  LibraryBig,
  Search,
  Share2,
} from "lucide-react";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { SearchHighlight } from "@/components/search/SearchHighlight";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useGlobalSearch } from "@/lib/hooks/useSearch";
import type { SearchDocumentHit } from "@/types/search";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 2;
const PREVIEW_LIMIT = 4;

function folderHref(slug: string) {
  return `/dashboard/my-folders?folder=${encodeURIComponent(slug)}`;
}

interface ResultRowProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  onSelect: () => void;
}

function ResultRow({ href, icon, title, subtitle, meta, onSelect }: ResultRowProps) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-bg-secondary)]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-muted">{subtitle}</p>
        ) : null}
      </div>
      {meta ? (
        <span className="shrink-0 text-xs tabular-nums text-muted">{meta}</span>
      ) : null}
    </Link>
  );
}

function DocumentResultRow({
  doc,
  query,
  onSelect,
}: {
  doc: SearchDocumentHit;
  query: string;
  onSelect: () => void;
}) {
  const title = doc.title ?? doc.fileName;
  const subtitle = [doc.category?.name, doc.folder?.name]
    .filter(Boolean)
    .join(" · ");

  const handleClick = (event: React.MouseEvent) => {
    if (doc.fileUrl) {
      event.preventDefault();
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    }
    onSelect();
  };

  return (
    <Link
      href={`/dashboard/search?q=${encodeURIComponent(query)}`}
      onClick={handleClick}
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-bg-secondary)]"
    >
      <DocumentTypeIcon fileName={doc.fileName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-muted">{subtitle}</p>
        ) : null}
        {doc.textSnippet ? (
          <p className="mt-1 line-clamp-1 text-xs text-secondary">
            <SearchHighlight text={doc.textSnippet} query={query} />
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function SearchSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    documents,
    folders,
    collections,
    sharedSpaces,
    totals,
    hasResults,
    isLoading,
    debouncedQuery,
  } = useGlobalSearch(query, PREVIEW_LIMIT);

  const showPanel =
    isOpen && debouncedQuery.trim().length >= MIN_QUERY_LENGTH;

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const goToFullSearch = useCallback(() => {
    const q = query.trim();
    if (q.length >= MIN_QUERY_LENGTH) {
      router.push(`/dashboard/search?q=${encodeURIComponent(q)}`);
    }
    close();
  }, [close, query, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const totalMatches =
    totals.documents +
    totals.folders +
    totals.collections +
    totals.sharedSpaces;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={cn(
          "relative flex items-center rounded-xl border bg-[var(--color-bg-secondary)] transition-all duration-200",
          isOpen
            ? "border-primary/40 ring-2 ring-primary/10 shadow-sm"
            : "border-default hover:border-[var(--color-border-strong)]",
        )}
      >
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search documents, folders, collections…"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              goToFullSearch();
            }
          }}
          className="w-full bg-transparent py-2.5 pl-10 pr-20 text-sm text-foreground placeholder:text-muted focus:outline-none"
          aria-label="Search the platform"
          aria-expanded={showPanel}
          aria-controls="global-search-results"
          autoComplete="off"
        />
        <kbd className="pointer-events-none absolute right-3 hidden select-none rounded-md border border-default bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline">
          ⌘K
        </kbd>
      </div>

      {showPanel ? (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 max-h-[min(70vh,420px)] overflow-hidden rounded-xl border border-default bg-surface shadow-xl"
        >
          <div className="max-h-[min(70vh,380px)] overflow-y-auto overscroll-contain">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {[...Array(4)].map((_, index) => (
                  <LoadingSkeleton key={index} height={44} rounded="0.5rem" />
                ))}
              </div>
            ) : !hasResults ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No results</p>
                <p className="mt-1 text-xs text-muted">
                  Try another keyword or open full search
                </p>
              </div>
            ) : (
              <>
                {documents.length > 0 ? (
                  <SearchSection label="Documents">
                    {documents.map((doc) => (
                      <DocumentResultRow
                        key={doc.id}
                        doc={doc}
                        query={debouncedQuery}
                        onSelect={close}
                      />
                    ))}
                  </SearchSection>
                ) : null}

                {folders.length > 0 ? (
                  <SearchSection label="Folders">
                    {folders.map((folder) => (
                      <ResultRow
                        key={folder.id}
                        href={folderHref(folder.slug ?? folder.id)}
                        icon={<FolderOpen className="h-4 w-4" />}
                        title={folder.name}
                        subtitle={
                          folder.itemCount != null
                            ? `${folder.itemCount} items`
                            : undefined
                        }
                        onSelect={close}
                      />
                    ))}
                  </SearchSection>
                ) : null}

                {collections.length > 0 ? (
                  <SearchSection label="Collections">
                    {collections.map((collection) => (
                      <ResultRow
                        key={collection.id}
                        href={`/dashboard/collections/${collection.slug}`}
                        icon={<LibraryBig className="h-4 w-4" />}
                        title={collection.name}
                        subtitle={collection.description ?? undefined}
                        meta={`${collection.documentCount} docs`}
                        onSelect={close}
                      />
                    ))}
                  </SearchSection>
                ) : null}

                {sharedSpaces.length > 0 ? (
                  <SearchSection label="Shared spaces">
                    {sharedSpaces.map((space) => (
                      <ResultRow
                        key={space.id}
                        href={`/dashboard/shared/${space.id}`}
                        icon={<Share2 className="h-4 w-4" />}
                        title={space.name}
                        subtitle={space.description ?? undefined}
                        meta={`${space.documentCount} docs`}
                        onSelect={close}
                      />
                    ))}
                  </SearchSection>
                ) : null}
              </>
            )}
          </div>

          <div className="border-t border-default bg-[var(--color-bg-secondary)] px-3 py-2">
            <button
              type="button"
              onClick={goToFullSearch}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-subtle/60"
            >
              {totalMatches > PREVIEW_LIMIT
                ? `View all ${totalMatches} results`
                : "Open full search"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
