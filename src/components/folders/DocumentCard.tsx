"use client";

import { useState } from "react";
import {
  Download,
  Eye,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { getDocumentFileMeta } from "@/lib/upload-file-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentCardProps {
  document: {
    id: string;
    fileUrl?: string;
    fileName: string;
    title?: string | null;
    summary?: string | null;
    category?: string | null;
    createdAt: string;
    updatedAt?: string;
    uploadedBy: string;
    folder?: string | { id: string; name: string };
  };
  onDelete?: (documentId: string) => void;
  onView?: (documentId: string) => void;
  onDetails?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
  onRename?: (documentId: string, newName: string) => void;
  onShare?: (documentId: string, documentName: string) => void;
  isOwner?: boolean;
  readOnly?: boolean;
  showDepartmentColumn?: boolean;
}

export function DocumentCard({
  document,
  onDelete,
  onView,
  onDetails,
  onDownload,
  onRename,
  onShare,
  isOwner = false,
  readOnly = false,
  showDepartmentColumn = false,
}: DocumentCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newName, setNewName] = useState(document.title || document.fileName);

  const fileMeta = getDocumentFileMeta(document.fileName);
  const displayName = document.title || document.fileName;

  const handleRenameSubmit = () => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      setNewName(displayName);
      setIsRenaming(false);
      return;
    }

    if (trimmedName !== displayName) {
      onRename?.(document.id, trimmedName);
    }

    setNewName(trimmedName);
    setIsRenaming(false);
  };

  const handleDeleteConfirm = () => {
    onDelete?.(document.id);
    setIsDeleteOpen(false);
  };

  const documentGridColumns = showDepartmentColumn
    ? "grid-cols-[minmax(280px,2fr)_140px_140px_160px_minmax(120px,1fr)_120px]"
    : "grid-cols-[minmax(280px,2fr)_140px_140px_minmax(120px,1fr)_120px]";

  return (
    <>
      <div
        className={`grid ${documentGridColumns} items-center gap-4 border-t border-default px-4 py-3.5 text-sm transition-colors hover:bg-[var(--color-bg-secondary)]/80`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <DocumentTypeIcon fileName={document.fileName} />

          <div className="min-w-0">
            {isRenaming ? (
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleRenameSubmit();
                  }

                  if (event.key === "Escape") {
                    setIsRenaming(false);
                    setNewName(displayName);
                  }
                }}
                className="w-full border border-[var(--color-border-focus)] bg-surface px-3 py-2 text-sm font-medium text-foreground outline-none"
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (onDetails) {
                      onDetails(document.id);
                    } else {
                      onView?.(document.id);
                    }
                  }}
                  className="max-w-full truncate text-left font-medium text-foreground transition hover:text-primary"
                >
                  {displayName}
                </button>
                <p className="truncate text-xs text-secondary">
                  Uploaded by {document.uploadedBy}
                </p>
              </>
            )}
          </div>
        </div>

        <p className="truncate text-secondary">
          {new Date(document.updatedAt || document.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <p className="truncate text-secondary">{fileMeta.typeLabel}</p>
        {showDepartmentColumn ? (
          <p className="truncate text-secondary">No department</p>
        ) : null}
        <div>
          <span
            className={`inline-flex px-2.5 py-1 text-xs font-medium ${fileMeta.chipClassName}`}
          >
            {document.category || "Unsorted"}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
          {readOnly ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onDetails) {
                    onDetails(document.id);
                  } else {
                    onView?.(document.id);
                  }
                }}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-default px-3 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)]"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => onDownload?.(document.id)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-default px-3 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)]"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
          <button
            type="button"
            onClick={() => {
              if (onDetails) {
                onDetails(document.id);
              } else {
                onView?.(document.id);
              }
            }}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-default px-3 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)]"
          >
            View
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-9 w-9 items-center justify-center border border-default text-secondary transition hover:bg-[var(--color-bg-tertiary)] hover:text-foreground"
              ariaLabel={`Document actions for ${displayName}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2 border-b border-default text-foreground"
              >
                <Eye className="h-4 w-4" />
                Preview
              </DropdownMenuItem>
              {onDetails ? (
                <DropdownMenuItem
                  onClick={() => onDetails(document.id)}
                  className="flex items-center gap-2 border-b border-default text-foreground"
                >
                  <Eye className="h-4 w-4" />
                  Details
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onClick={() => onView?.(document.id)}
                className="flex items-center gap-2 border-b border-default text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDownload?.(document.id)}
                className="flex items-center gap-2 border-b border-default text-foreground"
              >
                <Download className="h-4 w-4" />
                Download
              </DropdownMenuItem>
              {onShare ? (
                <DropdownMenuItem
                  onClick={() =>
                    onShare(
                      document.id,
                      document.title || document.fileName,
                    )
                  }
                  className="flex items-center gap-2 border-b border-default text-foreground"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
              ) : null}
              {isOwner ? (
                <DropdownMenuItem
                  onClick={() => {
                    setIsRenaming(true);
                  }}
                  className="flex items-center gap-2 border-b border-default text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                  Rename
                </DropdownMenuItem>
              ) : null}
              {isOwner ? (
                <DropdownMenuItem
                  onClick={() => {
                    setIsDeleteOpen(true);
                  }}
                  className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Move to trash?"
        description={`"${displayName}" will be moved to trash for 30 days. You can restore it from Trash.`}
        itemNameToConfirm={displayName}
      />

      <DocumentPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileUrl={document.fileUrl || ""}
        fileName={document.fileName}
        fileType={fileMeta.mimeType}
      />
    </>
  );
}
