"use client";
 
import type { ReactNode } from "react";
import { TableContainer, TableHeader, TableHead } from "@/components/ui/Table";

interface OrgTableShellProps {
  children: ReactNode;
  className?: string;
}

export function OrgTableShell({ children, className = "" }: OrgTableShellProps) {
  return (
    <TableContainer className={`rounded-2xl ${className}`}>
      {children}
    </TableContainer>
  );
}

export function OrgTableHead({ children }: { children: ReactNode }) {
  return <TableHeader>{children}</TableHeader>;
}

export function OrgTableTh({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return <TableHead align={align}>{children}</TableHead>;
}

