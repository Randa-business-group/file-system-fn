"use client";

import { MoreVertical, Trash2, Eye, Download, Share2 } from "lucide-react";
import { useState } from "react";
import { ShareToSpaceModal } from "@/components/documents/ShareToSpaceModal";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { useDeleteDocument } from "@/lib/hooks/useDocuments";
import { getFileTypeFromName } from "@/lib/upload-file-types";
import { toast } from "sonner";
import type { Document } from "@/types/document";

interface DocumentCardProps {
  document: Document;
  onDetails?: (document: Document) => void;
}

export function DocumentCard({ document, onDetails }: DocumentCardProps) {
  const deleteDocument = useDeleteDocument();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Move this document to trash?")) return;

    setIsDeleting(true);
    try {
      await deleteDocument.mutateAsync(document.id);
    } catch (error) {
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const uploadedBy = document.uploadedBy?.name || "Unknown";
  const uploadedDate = new Date(document.createdAt).toLocaleDateString();
  const categoryName = document.category?.name || "Uncategorized";
  const fileType = getFileTypeFromName(document.fileName);

  const handleDownload = () => {
    const link = window.document.createElement("a");
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  return (
    <>
      <div className="rounded-2xl border border-default bg-surface p-4 transition hover:border-primary hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <DocumentTypeIcon fileName={document.fileName} size="sm" className="mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {onDetails ? (
                <button
                  type="button"
                  onClick={() => onDetails(document)}
                  className="text-left font-semibold text-foreground transition hover:text-primary"
                >
                  {document.title}
                </button>
              ) : (
                <Link href={`/documents/${document.id}`} className="text-left font-semibold text-foreground transition hover:text-primary">
                  {document.title}
                </Link>
              )}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs text-secondary">
              {document.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-block rounded-full bg-primary bg-opacity-10 px-2 py-1 text-xs text-primary">
                {categoryName}
              </span>
              {document.folder && (
                <span className="inline-block rounded-full bg-secondary bg-opacity-10 px-2 py-1 text-xs text-secondary">
                  {document.folder.name}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-secondary">
              <span>By {uploadedBy}</span>
              <span>{uploadedDate}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-2 rounded-full p-1 text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground" ariaLabel={`Document actions for ${document.title}`}>
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2 border-b border-default text-foreground"
              >
                <Eye className="h-4 w-4" />
                Preview
              </DropdownMenuItem>
              {onDetails ? (
                <DropdownMenuItem onClick={() => onDetails(document)} className="flex items-center gap-2 border-b border-default text-foreground">
                  <Eye className="h-4 w-4" />
                  Details
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem>
                <Link href={`/documents/${document.id}`} className="flex items-center gap-2 w-full">
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDownload}
                className="flex items-center gap-2 border-b border-default text-foreground"
              >
                <Download className="h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 border-b border-default text-foreground"
              >
                <Share2 className="h-4 w-4" />
                Share to Space
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600">
                <Trash2 className="h-4 w-4" />
                Delete
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
        fileType={fileType}
      />
      <ShareToSpaceModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        documentId={document.id}
      />
    </>
  );
}
