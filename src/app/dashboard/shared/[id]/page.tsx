"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { getDocumentFileMeta } from "@/lib/upload-file-types";
import { useAuth } from "@/lib/auth-context";
import {
  useGetSharedSpaceById,
  useRemoveSharedDocument,
} from "@/lib/hooks/useSharedSpaces";
import { SharedLevelBadge } from "@/components/shared/SharedLevelBadge";
import { ShareDocumentModal } from "@/components/shared/ShareDocumentModal";
import { ReplaceDocumentModal } from "@/components/shared/ReplaceDocumentModal";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SharedSpaceDocument } from "@/types/shared-space";
import { toast } from "sonner";

export default function SharedSpaceDetailPage() {
  const params = useParams();
  const spaceId = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { sharedSpace, isLoading } = useGetSharedSpaceById(spaceId);
  const removeDocument = useRemoveSharedDocument();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [replaceEntry, setReplaceEntry] = useState<SharedSpaceDocument | null>(
    null,
  );
  const [removingEntry, setRemovingEntry] =
    useState<SharedSpaceDocument | null>(null);
  const [previewEntry, setPreviewEntry] = useState<SharedSpaceDocument | null>(
    null,
  );

  const documents = useMemo(
    () => sharedSpace?.documents ?? [],
    [sharedSpace?.documents],
  );

  const handleDownload = (entry: SharedSpaceDocument) => {
    const link = window.document.createElement("a");
    link.href = entry.document.fileUrl;
    link.download = entry.document.fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const handleRemoveConfirm = async () => {
    if (!removingEntry) return;

    try {
      await removeDocument.mutateAsync({
        spaceId,
        documentId: removingEntry.documentId,
      });
      toast.success("Document removed from shared space");
      setRemovingEntry(null);
    } catch {
      toast.error("Failed to remove document from space");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton width={120} height={20} />
        <LoadingSkeleton width={280} height={32} />
        <LoadingSkeleton width="60%" height={16} />
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <LoadingSkeleton key={index} height={72} rounded="1rem" />
          ))}
        </div>
      </div>
    );
  }

  if (!sharedSpace) {
    return (
      <EmptyState
        title="Shared space not found"
        description="This space may have been deleted or you do not have access."
        actionLabel="Back to Shared"
        onAction={() => {
          window.location.href = "/dashboard/shared";
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/shared"
        className="inline-flex items-center gap-2 text-sm font-medium text-secondary transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Shared Spaces
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {sharedSpace.name}
            </h1>
            <SharedLevelBadge level={sharedSpace.level} />
          </div>
          <p className="text-sm text-secondary">
            {sharedSpace.description ?? "No description"}
          </p>
          <p className="text-xs text-secondary">
            Created by {sharedSpace.createdBy.name} ·{" "}
            {new Date(sharedSpace.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="inline-flex items-center justify-center rounded bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          Share Document
        </button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title="No documents shared here yet."
          description="Click Share Document to add one."
          actionLabel="Share Document"
          onAction={() => setIsShareModalOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-default bg-surface">
          <div className="hidden border-b border-default bg-[var(--color-bg-secondary)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-secondary md:grid md:grid-cols-[minmax(240px,2fr)_1fr_1fr_1fr_auto] md:gap-4">
            <span>Document</span>
            <span>Category</span>
            <span>Shared by</span>
            <span>Uploaded by</span>
            <span className="text-right">Actions</span>
          </div>
          {documents.map((entry) => {
            const fileMeta = getDocumentFileMeta(entry.document.fileName);
            const canReplace = user?.id === entry.document.uploadedBy.id;
            const canRemove = user?.id === entry.document.uploadedBy.id;

            return (
              <div
                key={entry.documentId}
                className="grid items-center gap-3 border-b border-default px-4 py-4 last:border-b-0 md:grid-cols-[minmax(240px,2fr)_1fr_1fr_1fr_auto] md:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <DocumentTypeIcon fileName={entry.document.fileName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {entry.document.title || entry.document.fileName}
                    </p>
                    <p className="truncate text-xs text-secondary">
                      {entry.document.fileName}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-secondary">
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {entry.document.category?.name ?? "Uncategorized"}
                  </span>
                </div>
                <div className="text-sm text-secondary">
                  <p>{entry.sharedBy.name}</p>
                  <p className="text-xs">
                    {new Date(entry.sharedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm text-secondary">
                  {entry.document.uploadedBy.name}
                </div>
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Document actions"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-default text-secondary transition hover:bg-[var(--color-bg-secondary)]"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setPreviewEntry(entry)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(entry)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      {canReplace ? (
                        <DropdownMenuItem
                          onClick={() => setReplaceEntry(entry)}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Replace
                        </DropdownMenuItem>
                      ) : null}
                      {canRemove ? (
                        <DropdownMenuItem
                          onClick={() => setRemovingEntry(entry)}
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove from space
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ShareDocumentModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        sharedSpaceId={spaceId}
      />
      <ReplaceDocumentModal
        isOpen={Boolean(replaceEntry)}
        onClose={() => setReplaceEntry(null)}
        spaceId={spaceId}
        documentId={replaceEntry?.documentId ?? ""}
        currentEntry={replaceEntry}
      />
      <DeleteConfirmationModal
        isOpen={Boolean(removingEntry)}
        onClose={() => setRemovingEntry(null)}
        onConfirm={() => void handleRemoveConfirm()}
        title="Remove from shared space"
        description="This only removes the reference. The original file is not deleted."
        itemNameToConfirm={
          removingEntry?.document.title ??
          removingEntry?.document.fileName ??
          ""
        }
        isLoading={removeDocument.isLoading}
      />
      {previewEntry ? (
        <DocumentPreview
          isOpen={Boolean(previewEntry)}
          onClose={() => setPreviewEntry(null)}
          fileUrl={previewEntry.document.fileUrl}
          fileName={previewEntry.document.fileName}
          fileType={getDocumentFileMeta(previewEntry.document.fileName).mimeType}
        />
      ) : null}
    </div>
  );
}
