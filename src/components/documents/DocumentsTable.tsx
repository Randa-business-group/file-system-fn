"use client";

import { useState } from "react";
import { Download, ExternalLink, Eye, MoreHorizontal, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { getDocumentFileMeta, getFileTypeFromName } from "@/lib/upload-file-types";
import type { Document } from "@/types/document";

interface DocumentsTableProps {
  documents: Document[];
  isLoading?: boolean;
  onOpen?: (document: Document) => void;
  onDetails?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (documentId: string) => void;
  showOwner?: boolean;
  showCategory?: boolean;
  emptyMessage?: string;
  className?: string;
  extraAction?: (document: Document) => React.ReactNode;
}

function getOwnerName(document: Document) {
  if (document.documentOwner?.trim()) {
    return document.documentOwner;
  }

  const uploadedBy = document.uploadedBy;
  return typeof uploadedBy === "string"
    ? uploadedBy
    : uploadedBy?.name ?? "Unknown";
}

export function DocumentsTable({
  documents,
  isLoading = false,
  onOpen,
  onDetails,
  onDownload,
  onDelete,
  showOwner = true,
  showCategory = true,
  emptyMessage = "No documents found.",
  className,
  extraAction,
}: DocumentsTableProps) {
  const [detailsDocument, setDetailsDocument] = useState<Document | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  const handleOpenDetails = (document: Document) => {
    if (onDetails) {
      onDetails(document);
    } else {
      setDetailsDocument(document);
    }
  };

  const handleOpenPreview = (document: Document) => {
    if (onOpen) {
      onOpen(document);
    } else {
      setPreviewDocument(document);
    }
  };

  const handleDownload = (document: Document) => {
    if (onDownload) {
      onDownload(document);
      return;
    }

    if (!document.fileUrl) return;
    const link = window.document.createElement("a");
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const columnCount = 3 + (showOwner ? 1 : 0) + (showCategory ? 1 : 0);

  return (
    <>
      <TableContainer className={className}>
        <Table className="min-w-[760px]">
          <TableHeader>
            <tr>
              <TableHead>Name</TableHead>
              {showOwner && <TableHead>Owner</TableHead>}
              <TableHead>Last Changes</TableHead>
              {showCategory && <TableHead>Category</TableHead>}
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableLoading colSpan={columnCount} rows={5} />
            ) : documents.length === 0 ? (
              <TableEmpty colSpan={columnCount} message={emptyMessage} />
            ) : (
              documents.map((document) => {
                const fileMeta = getDocumentFileMeta(document.fileName);
                const ownerName = getOwnerName(document);
                const formattedDate = new Date(
                  document.updatedAt || document.createdAt,
                ).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <TableRow key={document.id}>
                    {/* Name column */}
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <DocumentTypeIcon fileName={document.fileName} size="sm" />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(document)}
                            className="block max-w-[280px] truncate text-left font-medium text-foreground transition hover:text-primary sm:max-w-[340px]"
                            title={document.title || document.fileName}
                          >
                            {document.title || document.fileName}
                          </button>
                          <p className="truncate text-xs text-secondary">
                            {fileMeta.typeLabel}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Owner column */}
                    {showOwner && (
                      <TableCell>
                        <span className="text-secondary">{ownerName}</span>
                      </TableCell>
                    )}

                    {/* Last changes date column */}
                    <TableCell>
                      <span className="text-secondary">{formattedDate}</span>
                    </TableCell>

                    {/* Category column */}
                    {showCategory && (
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-secondary">
                          {document.category?.name ?? "Unsorted"}
                        </span>
                      </TableCell>
                    )}

                    {/* Actions column */}
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        {extraAction ? extraAction(document) : null}

                        <button
                          type="button"
                          onClick={() => setPreviewDocument(document)}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-default bg-surface px-2.5 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)]"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Preview
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-default text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
                            ariaLabel={`Document actions for ${document.title || document.fileName}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[160px]">
                            <DropdownMenuItem onClick={() => handleOpenDetails(document)}>
                              <Eye className="h-4 w-4" />
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenPreview(document)}>
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(document)}>
                              <Download className="h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => onDelete(document.id)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Standalone modals managed when rendered independently */}
      <DocumentPreview
        isOpen={Boolean(previewDocument?.fileUrl)}
        onClose={() => setPreviewDocument(null)}
        fileUrl={previewDocument?.fileUrl ?? ""}
        fileName={previewDocument?.fileName ?? ""}
        fileType={
          previewDocument?.fileName
            ? getFileTypeFromName(previewDocument.fileName)
            : "application/octet-stream"
        }
      />

      <DocumentDetails
        document={detailsDocument}
        isOpen={Boolean(detailsDocument)}
        onClose={() => setDetailsDocument(null)}
        onOpen={() => {
          if (detailsDocument) {
            setPreviewDocument(detailsDocument);
            setDetailsDocument(null);
          }
        }}
        onDownload={() => {
          if (detailsDocument) {
            handleDownload(detailsDocument);
          }
        }}
      />
    </>
  );
}
