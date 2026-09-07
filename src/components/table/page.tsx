"use client";

import React, { useId, useMemo, useState } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RotateCcw,
} from "lucide-react";
import {
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  TableEmpty,
} from "@/components/ui/Table";
import { AppSelect } from "@/components/ui/AppSelect";
import { cn } from "@/lib/utils";

export type SortOrder = "asc" | "desc" | null;

export interface SortState {
  key: string;
  order: "asc" | "desc";
}

export interface ColumnDef<TData> {
  /** Unique key or property name */
  id?: string;
  /** Property key to access row data (supports nested dot notation, e.g. "category.name") */
  accessorKey?: keyof TData | string;
  /** Header label or custom render function */
  header:
    | React.ReactNode
    | ((props: {
        column: ColumnDef<TData>;
        sortOrder: SortOrder;
        toggleSort: () => void;
      }) => React.ReactNode);
  /** Cell content render function */
  cell?: (props: {
    row: TData;
    value: unknown;
    index: number;
  }) => React.ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Alignment of text in the column */
  align?: "left" | "center" | "right";
  /** Custom className for the body cell */
  className?: string;
  /** Custom className for the header cell */
  headerClassName?: string;
  /** Optional column width, e.g. "120px" or "w-32" */
  width?: string;
}

export interface TableFilterOption {
  value: string;
  label: string;
}

export interface TableFilter<TData = unknown> {
  id: string;
  label?: string;
  placeholder?: string;
  options: TableFilterOption[];
  /** Controlled value */
  value?: string;
  /** Controlled change handler */
  onChange?: (value: string) => void;
  /** Client-side filter function */
  filterFn?: (row: TData, filterValue: string) => boolean;
  className?: string;
}

export interface DataTableProps<TData> {
  /** Array of data items to display */
  data: TData[];
  /** Array of column configurations */
  columns: ColumnDef<TData>[];
  /** Whether the table is currently fetching/loading data */
  isLoading?: boolean;
  /** Message or component when no items are present */
  emptyMessage?: React.ReactNode;
  /** Optional title displayed at top of table container */
  title?: React.ReactNode;
  /** Optional subtitle or description displayed below title */
  description?: React.ReactNode;
  /** Container className */
  className?: string;
  /** Table element className */
  tableClassName?: string;
  /** Function to extract unique row key */
  keyExtractor?: (row: TData, index: number) => string | number;
  /** Row click callback */
  onRowClick?: (row: TData, index: number) => void;
  /** Row className generator */
  rowClassName?: string | ((row: TData, index: number) => string);

  // ── Search Config ──
  /** Enable search bar (defaults to true) */
  searchable?: boolean;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Controlled search value */
  searchValue?: string;
  /** Controlled search change handler */
  onSearchChange?: (value: string) => void;
  /** Keys of TData to inspect during client-side search (defaults to all primitive values) */
  searchFields?: (keyof TData | string)[];

  // ── Filters Config ──
  /** List of select filter configurations */
  filters?: TableFilter<TData>[];
  /** Additional custom filter slot or components */
  filterSlot?: React.ReactNode;
  /** Show reset button when search or filters are active (default: true) */
  showResetButton?: boolean;
  /** Reset filters callback */
  onResetFilters?: () => void;

  // ── Sorting Config ──
  /** Controlled sort key */
  sortKey?: string;
  /** Controlled sort direction */
  sortOrder?: "asc" | "desc" | null;
  /** Controlled sort change handler */
  onSortChange?: (key: string, order: "asc" | "desc" | null) => void;
  /** Custom extra sort bar slot */
  sortSlot?: React.ReactNode;

  // ── Pagination Config ──
  /** Enable pagination (defaults to true) */
  paginated?: boolean;
  /** Current page (1-indexed) */
  page?: number;
  /** Current page size */
  pageSize?: number;
  /** Total number of items (for server-side pagination) */
  totalItems?: number;
  /** Total number of pages (for server-side pagination) */
  totalPages?: number;
  /** Page change callback (if provided, enables server-side pagination) */
  onPageChange?: (page: number) => void;
  /** Page size change callback */
  onPageSizeChange?: (pageSize: number) => void;
  /** Available page size choices */
  pageSizeOptions?: readonly number[] | number[];
  /** Hide page size select dropdown */
  hidePageSize?: boolean;

  // ── Action Slots ──
  /** Extra slot for action buttons placed at top-right (e.g. Export, Add) */
  headerActions?: React.ReactNode;
  /** Extra slot below table */
  footerSlot?: React.ReactNode;
}

/** Helper to retrieve nested values via dot notation */
function getNestedValue<T>(obj: T, path?: string | keyof T): unknown {
  if (!path || obj == null) return undefined;
  if (typeof path === "string" && path.includes(".")) {
    return path
      .split(".")
      .reduce((acc: unknown, part: string) => {
        if (acc != null && typeof acc === "object") {
          return (acc as Record<string, unknown>)[part];
        }
        return undefined;
      }, obj);
  }
  return (obj as Record<string, unknown>)[path as string];
}

/** Helper to compute page numbers with ellipsis */
function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, "ellipsis", totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    );
  } else {
    pages.push(
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    );
  }

  return pages;
}

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No records found.",
  title,
  description,
  className,
  tableClassName,
  keyExtractor,
  onRowClick,
  rowClassName,

  // Search
  searchable = true,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  searchFields,

  // Filters
  filters,
  filterSlot,
  showResetButton = true,
  onResetFilters,

  // Sort
  sortKey: controlledSortKey,
  sortOrder: controlledSortOrder,
  onSortChange,
  sortSlot,

  // Pagination
  paginated = true,
  page: controlledPage,
  pageSize: controlledPageSize = 20,
  totalItems: controlledTotalItems,
  totalPages: controlledTotalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  hidePageSize = false,

  // Actions & Slots
  headerActions,
  footerSlot,
}: DataTableProps<TData>) {
  const tableId = useId();

  // Internal search state for client-side mode
  const [internalSearch, setInternalSearch] = useState("");
  const isSearchControlled = searchValue !== undefined;
  const currentSearch = isSearchControlled ? searchValue : internalSearch;

  // Internal filter states for client-side mode
  const [internalFilters, setInternalFilters] = useState<Record<string, string>>({});

  // Internal sort state for client-side mode
  const [internalSort, setInternalSort] = useState<SortState | null>(null);
  const isSortControlled = onSortChange !== undefined;
  const currentSortKey = isSortControlled ? controlledSortKey : internalSort?.key;
  const currentSortOrder = isSortControlled ? controlledSortOrder : internalSort?.order;

  // Internal pagination state for client-side mode
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(controlledPageSize);
  const isPaginationControlled = onPageChange !== undefined;
  const currentPage = isPaginationControlled ? (controlledPage ?? 1) : internalPage;
  const currentPageSize = isPaginationControlled ? controlledPageSize : internalPageSize;

  // Handle search change
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearch(value);
      setInternalPage(1);
    }
  };

  const handleClearSearch = () => {
    handleSearchChange("");
  };

  // Handle filter change
  const handleFilterChange = (filter: TableFilter<TData>, value: string) => {
    if (filter.onChange) {
      filter.onChange(value);
    } else {
      setInternalFilters((prev) => ({
        ...prev,
        [filter.id]: value,
      }));
      setInternalPage(1);
    }
  };

  // Handle reset all filters
  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      handleSearchChange("");
      setInternalFilters({});
      if (!isSortControlled) {
        setInternalSort(null);
      }
      setInternalPage(1);
    }
  };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    if (currentSearch.trim().length > 0) return true;
    if (filters && filters.length > 0) {
      return filters.some((f) => {
        const val = f.value !== undefined ? f.value : internalFilters[f.id];
        return val && val !== "";
      });
    }
    return false;
  }, [currentSearch, filters, internalFilters]);

  // Handle column sort toggle
  const handleSortToggle = (colKey: string) => {
    let nextOrder: "asc" | "desc" | null = "asc";

    if (currentSortKey === colKey) {
      if (currentSortOrder === "asc") {
        nextOrder = "desc";
      } else if (currentSortOrder === "desc") {
        nextOrder = null;
      } else {
        nextOrder = "asc";
      }
    }

    if (onSortChange) {
      onSortChange(colKey, nextOrder);
    } else {
      if (nextOrder === null) {
        setInternalSort(null);
      } else {
        setInternalSort({ key: colKey, order: nextOrder });
      }
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    } else {
      setInternalPageSize(newSize);
      setInternalPage(1);
    }
  };

  // Client-side data processing (filtering, sorting, paginating) if not controlled
  const processedData = useMemo(() => {
    let items = [...data];

    // 1. Client-side search (only if not controlled)
    if (!isSearchControlled && currentSearch.trim().length > 0) {
      const q = currentSearch.toLowerCase().trim();
      items = items.filter((row) => {
        if (searchFields && searchFields.length > 0) {
          return searchFields.some((field) => {
            const val = getNestedValue(row, field);
            return val != null && String(val).toLowerCase().includes(q);
          });
        }
        // Fallback: inspect direct and nested values
        return Object.values(row as Record<string, unknown>).some((val) => {
          if (val == null) return false;
          if (typeof val === "object") {
            return Object.values(val as Record<string, unknown>).some(
              (inner) => inner != null && String(inner).toLowerCase().includes(q),
            );
          }
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // 2. Client-side filters (only if not controlled by parent)
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        const val = filter.value !== undefined ? filter.value : internalFilters[filter.id];
        if (val && val !== "") {
          if (filter.filterFn) {
            items = items.filter((row) => filter.filterFn!(row, val));
          } else if (filter.onChange === undefined) {
            items = items.filter((row) => {
              const itemVal = getNestedValue(row, filter.id);
              if (itemVal && typeof itemVal === "object" && "id" in itemVal) {
                return String(itemVal.id) === val;
              }
              return String(itemVal) === val;
            });
          }
        }
      });
    }

    // 3. Client-side sorting (only if not controlled by parent)
    if (!isSortControlled && currentSortKey && currentSortOrder) {
      items.sort((left, right) => {
        const valA = getNestedValue(left, currentSortKey);
        const valB = getNestedValue(right, currentSortKey);

        if (valA == null && valB == null) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        let cmp = 0;
        if (typeof valA === "number" && typeof valB === "number") {
          cmp = valA - valB;
        } else if (valA instanceof Date && valB instanceof Date) {
          cmp = valA.getTime() - valB.getTime();
        } else {
          cmp = String(valA).localeCompare(String(valB), undefined, {
            numeric: true,
            sensitivity: "base",
          });
        }
        return currentSortOrder === "asc" ? cmp : -cmp;
      });
    }

    return items;
  }, [
    data,
    isSearchControlled,
    currentSearch,
    searchFields,
    filters,
    internalFilters,
    isSortControlled,
    currentSortKey,
    currentSortOrder,
  ]);

  // Compute pagination metrics
  const totalItemCount = isPaginationControlled
    ? (controlledTotalItems ?? data.length)
    : processedData.length;

  const totalPageCount = isPaginationControlled
    ? (controlledTotalPages ?? Math.max(1, Math.ceil(totalItemCount / currentPageSize)))
    : Math.max(1, Math.ceil(totalItemCount / currentPageSize));

  // Current page items
  const paginatedData = useMemo(() => {
    if (isPaginationControlled || !paginated) {
      return processedData;
    }
    const startIndex = (currentPage - 1) * currentPageSize;
    return processedData.slice(startIndex, startIndex + currentPageSize);
  }, [processedData, isPaginationControlled, paginated, currentPage, currentPageSize]);

  // Range calculation for footer
  const startIndex = totalItemCount === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const endIndex = Math.min(currentPage * currentPageSize, totalItemCount);

  // Column count for colspan in skeleton/empty rows
  const colSpanCount = columns.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* ── Table Top Toolbar: Title, Search, Filters, Actions ── */}
      <div className="space-y-3">
        {(title || description || headerActions) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && (
                <div className="text-xl font-bold text-foreground sm:text-2xl">{title}</div>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-secondary">{description}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">{headerActions}</div>
            )}
          </div>
        )}

        {/* Search, Filters, and Controls Bar */}
        {(searchable || (filters && filters.length > 0) || filterSlot || !hidePageSize) && (
          <div className="flex flex-col gap-3 rounded-2xl border border-default bg-surface p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search input */}
                {searchable && (
                  <div className="relative min-w-[240px] flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                    <input
                      id={`${tableId}-search`}
                      type="text"
                      placeholder={searchPlaceholder}
                      value={currentSearch}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full rounded-xl border border-default bg-[var(--color-bg-secondary)] py-2 pl-10 pr-9 text-sm text-foreground placeholder-secondary transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {currentSearch.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-secondary transition hover:bg-surface hover:text-foreground"
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Filter dropdowns */}
                {filters &&
                  filters.map((filter) => {
                    const activeVal =
                      filter.value !== undefined
                        ? filter.value
                        : (internalFilters[filter.id] ?? "");

                    return (
                      <div
                        key={filter.id}
                        className={cn(
                          "flex min-w-[180px] items-center gap-2",
                          filter.className,
                        )}
                      >
                        <Filter className="h-4 w-4 shrink-0 text-secondary" />
                        <AppSelect
                          value={activeVal}
                          onValueChange={(val) => handleFilterChange(filter, val)}
                          placeholder={filter.placeholder ?? filter.label ?? "Filter"}
                          triggerClassName="rounded-xl"
                          options={filter.options}
                        />
                      </div>
                    );
                  })}

                {/* Custom Filter Slot */}
                {filterSlot}

                {/* Reset filters button */}
                {showResetButton && hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-default bg-[var(--color-bg-secondary)] px-3 py-2 text-xs font-medium text-secondary transition hover:bg-surface hover:text-foreground"
                    title="Reset all filters"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Page size dropdown in toolbar */}
              {!hidePageSize && paginated && (
                <div className="flex items-center gap-2 text-xs text-secondary self-end lg:self-center">
                  <span className="whitespace-nowrap">Show</span>
                  <AppSelect
                    value={String(currentPageSize)}
                    onValueChange={(val) => handlePageSizeChange(Number(val))}
                    placeholder="Page size"
                    triggerClassName="rounded-xl min-w-[4.75rem] h-9 text-xs"
                    options={pageSizeOptions.map((opt) => ({
                      value: String(opt),
                      label: String(opt),
                    }))}
                  />
                  <span className="whitespace-nowrap">per page</span>
                </div>
              )}
            </div>

            {/* Status summary banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default/60 pt-3 text-xs text-secondary">
              <div>
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    Loading data...
                  </span>
                ) : (
                  <span>
                    Showing {totalItemCount === 0 ? 0 : startIndex} to {endIndex} of{" "}
                    <strong className="text-foreground">{totalItemCount}</strong> entries
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Optional Sort slot (e.g. SortBar) */}
        {sortSlot}
      </div>

      {/* ── Main Data Table ── */}
      <TableContainer>
        <Table className={cn("min-w-full", tableClassName)}>
          <TableHeader>
            <tr>
              {columns.map((column, colIdx) => {
                const colKey = String(column.accessorKey ?? column.id ?? colIdx);
                const isSorted = currentSortKey === colKey;
                const isSortable = Boolean(column.sortable);

                return (
                  <TableHead
                    key={colKey}
                    align={column.align}
                    className={cn(column.headerClassName)}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleSortToggle(colKey)}
                        className={cn(
                          "group inline-flex items-center gap-1.5 font-semibold transition hover:text-foreground",
                          column.align === "right" && "justify-end w-full",
                          column.align === "center" && "justify-center w-full",
                          isSorted && "text-foreground",
                        )}
                        title={`Sort by ${typeof column.header === "string" ? column.header : colKey}`}
                      >
                        <span>
                          {typeof column.header === "function"
                            ? column.header({
                                column,
                                sortOrder: isSorted ? (currentSortOrder ?? null) : null,
                                toggleSort: () => handleSortToggle(colKey),
                              })
                            : column.header}
                        </span>
                        <span className="transition text-secondary group-hover:text-foreground">
                          {isSorted && currentSortOrder === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-primary" />
                          ) : isSorted && currentSortOrder === "desc" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                          )}
                        </span>
                      </button>
                    ) : typeof column.header === "function" ? (
                      column.header({
                        column,
                        sortOrder: null,
                        toggleSort: () => {},
                      })
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </tr>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoading colSpan={colSpanCount} rows={Math.min(currentPageSize, 5)} />
            ) : paginatedData.length === 0 ? (
              <TableEmpty colSpan={colSpanCount} message={emptyMessage as string}>
                {typeof emptyMessage !== "string" ? emptyMessage : undefined}
              </TableEmpty>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const key = keyExtractor
                  ? keyExtractor(row, rowIdx)
                  : (getNestedValue(row, "id") ?? rowIdx);

                const customRowClass =
                  typeof rowClassName === "function"
                    ? rowClassName(row, rowIdx)
                    : rowClassName;

                return (
                  <TableRow
                    key={String(key)}
                    onClick={onRowClick ? () => onRowClick(row, rowIdx) : undefined}
                    hoverable={true}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      customRowClass,
                    )}
                  >
                    {columns.map((column, colIdx) => {
                      const colKey = String(column.accessorKey ?? column.id ?? colIdx);
                      const rawValue = column.accessorKey
                        ? getNestedValue(row, column.accessorKey)
                        : undefined;

                      return (
                        <TableCell
                          key={colKey}
                          align={column.align}
                          className={column.className}
                        >
                          {column.cell
                            ? column.cell({
                                row,
                                value: rawValue,
                                index: rowIdx,
                              })
                            : rawValue != null
                              ? String(rawValue)
                              : "-"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination Controls ── */}
      {paginated && (
        <div className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-secondary sm:text-sm">
            Page <strong className="text-foreground">{currentPage}</strong> of{" "}
            <strong className="text-foreground">{totalPageCount}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Jump to first page */}
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1 || isLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-default bg-surface text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              title="First Page"
              aria-label="Go to first page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-default bg-surface px-3 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {getPageNumbers(currentPage, totalPageCount).map((pageNum, idx) => {
                if (pageNum === "ellipsis") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-xs text-secondary"
                    >
                      &hellip;
                    </span>
                  );
                }

                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-medium transition",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-default bg-surface text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPageCount, currentPage + 1))}
              disabled={currentPage >= totalPageCount || isLoading}
              className="inline-flex h-9 items-center gap-1 rounded-xl border border-default bg-surface px-3 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Go to next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Jump to last page */}
            <button
              type="button"
              onClick={() => handlePageChange(totalPageCount)}
              disabled={currentPage >= totalPageCount || isLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-default bg-surface text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              title="Last Page"
              aria-label="Go to last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Extra footer slot */}
      {footerSlot}
    </div>
  );
}

export default DataTable;
