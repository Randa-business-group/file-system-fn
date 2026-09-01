"use client";

import { useState, type ReactNode } from "react";
import { ExternalLink, Eye, MoreHorizontal, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { getDocumentFileMeta } from "@/lib/upload-file-types";
import type { Document } from "@/types/document";

interface DashboardDocumentRowProps {
  document: Document;
  onDetails: (document: Document) => void;
  onOpen: (document: Document) => void;
  onDownload: (document: Document) => void;
  extraAction?: ReactNode;
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

export function DashboardDocumentRow({ document, onDetails, onOpen, onDownload, extraAction }: DashboardDocumentRowProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileMeta = getDocumentFileMeta(document.fileName);
  const ownerName = getOwnerName(document);
  const formattedDate = new Date(document.updatedAt || document.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const rowGridColumns = "md:grid-cols-[minmax(320px,1.8fr)_160px_160px_minmax(140px,1fr)_132px]";

  return (
    <>
      <div
        className={`grid items-center gap-4 border-b border-default px-4 py-4 text-sm text-foreground ${rowGridColumns}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <DocumentTypeIcon fileName={document.fileName} size="sm" />
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onDetails(document)}
              className="block max-w-full truncate text-left font-medium text-foreground transition hover:text-primary"
            >
              {document.title || document.fileName}
            </button>
            <p className="truncate text-xs text-secondary">{ownerName}</p>
          </div>
        </div>

        <p className="truncate text-secondary">{formattedDate}</p>
        <p className="truncate text-secondary">{fileMeta.typeLabel}</p>
        <p className="truncate text-secondary">{document.category?.name ?? "Unsorted"}</p>

        <div className="flex items-center justify-end gap-2">
          {extraAction}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-default px-3 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)]"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Preview
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-9 w-9 items-center justify-center border border-default text-secondary transition hover:bg-[var(--color-bg-tertiary)] hover:text-foreground"
              ariaLabel={`Document actions for ${document.title || document.fileName}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem onClick={() => onOpen(document)}>
                <ExternalLink className="h-4 w-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(document)}>
                <Download className="h-4 w-4" />
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DocumentPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileUrl={document.fileUrl}
        fileName={document.fileName}
        fileType={fileMeta.mimeType}
      />
    </>
  );
}
