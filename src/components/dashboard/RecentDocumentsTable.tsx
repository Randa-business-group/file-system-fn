"use client";

import { Download, Eye, Trash } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
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
import type { MockDocument } from "@/lib/mockData";

interface RecentDocumentsTableProps {
  documents: MockDocument[];
  loading?: boolean;
}

export function RecentDocumentsTable({
  documents,
  loading = false,
}: RecentDocumentsTableProps) {
  return (
    <TableContainer className="rounded-3xl">
      <div className="border-b border-default px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Documents</h2>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>File Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Folder</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead align="right">Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoading colSpan={6} rows={4} />
          ) : documents.length === 0 ? (
            <TableEmpty colSpan={6} message="No recent documents found." />
          ) : (
            documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium text-foreground">
                  {document.fileName}
                </TableCell>
                <TableCell>
                  <Badge label={document.category} variant="category" />
                </TableCell>
                <TableCell className="text-secondary">{document.folder}</TableCell>
                <TableCell className="text-secondary">{document.uploadedBy}</TableCell>
                <TableCell className="text-secondary">{document.date}</TableCell>
                <TableCell align="right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
                      aria-label={`View ${document.fileName}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
                      aria-label={`Download ${document.fileName}`}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-error"
                      aria-label={`Delete ${document.fileName}`}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
