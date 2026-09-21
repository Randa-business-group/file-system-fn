"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden rounded-2xl border border-default bg-surface shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  ),
);
TableContainer.displayName = "TableContainer";

export const TableShell = TableContainer;

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn("w-full text-left text-sm", className)}
      {...props}
    />
  ),
);
Table.displayName = "Table";

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-default bg-[var(--color-bg-secondary)] text-left text-xs font-semibold uppercase tracking-wider text-secondary",
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  TableBodyProps
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-default", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  hoverable?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, hoverable = true, ...props }, ref) => (
    <tr
      ref={ref}
      data-state={selected ? "selected" : undefined}
      className={cn(
        "border-t border-default transition-colors data-[state=selected]:bg-primary/5",
        hoverable && "hover:bg-[var(--color-bg-secondary)]/40",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, align = "left", ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-secondary whitespace-nowrap",
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = "left", ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-5 py-4 text-sm text-foreground align-middle whitespace-nowrap",
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left",
        className,
      )}
      {...props}
    />
  ),
);
TableCell.displayName = "TableCell";

export interface TableLoadingProps {
  colSpan: number;
  rows?: number;
  height?: number;
}

export function TableLoading({
  colSpan,
  rows = 4,
  height = 36,
}: TableLoadingProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-default">
          <td colSpan={colSpan} className="px-5 py-4">
            <LoadingSkeleton height={height} rounded="0.5rem" />
          </td>
        </tr>
      ))}
    </>
  );
}

export interface TableEmptyProps {
  colSpan: number;
  message?: string;
  children?: React.ReactNode;
}

export function TableEmpty({
  colSpan,
  message = "No records found.",
  children,
}: TableEmptyProps) {
  return (
    <tr className="border-t border-default">
      <td
        colSpan={colSpan}
        className="px-5 py-10 text-center text-sm text-secondary"
      >
        {children ?? message}
      </td>
    </tr>
  );
}
