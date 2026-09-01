"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Eye,
  FolderOpen,
  Library,
} from "lucide-react";
import { toast } from "sonner";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { DashboardDocumentRow } from "@/components/documents/DashboardDocumentRow";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { useAuth } from "@/lib/auth-context";
import { useGetShareById } from "@/lib/hooks/useSharing";
import type { DocumentShare } from "@/types/sharing";
import type { Document } from "@/types/document";

function getShareDocuments(share: DocumentShare): Document[] {
  if (share.document) return [share.document];
  if (share.collection?.documents?.length) return share.collection.documents;
  if (share.folder?.documents?.length) return share.folder.documents;
  return [];
}

function getShareTitle(share: DocumentShare) {
  if (share.document) {
    return share.document.title || share.document.fileName;
  }
  if (share.collection) return share.collection.name;
  if (share.folder) return share.folder.name;
  return "Shared item";
}

function canEditSharedDocument(
  share: DocumentShare,
  document: Document,
  userId?: string,
) {
  if (!userId) return false;
  if (share.sharedBy.id === userId) return true;
  if (share.sharedTo.id !== userId) return false;
  return document.uploadedBy?.id !== share.sharedBy.id;
}

export default function InboxShareDetailPage() {
  const params = useParams();
  const shareId = typeof params.shareId === "string" ? params.shareId : "";
  const { user } = useAuth();
  const { share, isLoading, isError } = useGetShareById(shareId);

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  const documents = useMemo(
    () => (share ? getShareDocuments(share) : []),
    [share],
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <LoadingSkeleton width={160} height={20} />
        <LoadingSkeleton height={120} rounded="1rem" />
        <LoadingSkeleton height={240} rounded="1rem" />
      </div>
    );
  }

  if (isError || !share) {
    return (
      <div className="space-y-4 p-6">
        <Link
          href="/dashboard/inbox"
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inbox
        </Link>
        <p className="text-sm text-secondary">This share was not found or has expired.</p>
      </div>
    );
  }

  const title = getShareTitle(share);
  const shareKind = share.document
    ? "Document"
    : share.collection
      ? "Collection"
      : "Folder";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Link
        href="/dashboard/inbox"
        className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inbox
      </Link>

      <div className="rounded-2xl border border-default bg-surface p-5 shadow-sm">
        <div className="flex items-start gap-3">
          {share.collection ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Library className="h-5 w-5" />
            </div>
          ) : share.folder ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FolderOpen className="h-5 w-5" />
            </div>
          ) : (
            <DocumentTypeIcon
              fileName={share.document?.fileName ?? title}
              size="md"
            />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              {shareKind} shared by {share.sharedBy.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">{title}</h1>
            {share.message ? (
              <p className="mt-2 text-sm text-secondary">{share.message}</p>
            ) : null}
            <p className="mt-2 text-xs text-secondary">
              You can edit documents here except those uploaded by the person who shared
              this {shareKind.toLowerCase()}.
            </p>
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-default px-6 py-12 text-center text-sm text-secondary">
          No documents in this share.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-default bg-surface">
          <div className="grid gap-4 border-b border-default bg-[var(--color-bg-secondary)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-secondary md:grid-cols-[minmax(320px,1.8fr)_160px_160px_minmax(140px,1fr)_132px]">
            <span>Name</span>
            <span>Owner</span>
            <span>Updated</span>
            <span>Category</span>
            <span className="text-right">Actions</span>
          </div>
          {documents.map((document) => {
            const editable = canEditSharedDocument(share, document, user?.id);
            return (
              <DashboardDocumentRow
                key={document.id}
                document={document}
                onDetails={() => setSelectedDocument(document)}
                onOpen={(doc) => {
                  if (!doc.fileUrl) return;
                  window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
                }}
                onDownload={(doc) => {
                  if (!doc.fileUrl) return;
                  window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
                }}
                extraAction={
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPreview({
                          url: document.fileUrl,
                          name: document.fileName,
                          type: "application/pdf",
                        })
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-default text-secondary hover:bg-[var(--color-bg-secondary)]"
                      aria-label="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!document.fileUrl) {
                          toast.error("No file to download");
                          return;
                        }
                        window.open(document.fileUrl, "_blank", "noopener,noreferrer");
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-default text-secondary hover:bg-[var(--color-bg-secondary)]"
                      aria-label="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDocument(document)}
                      className="rounded-lg bg-[var(--color-bg-tertiary)] px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[var(--color-bg-secondary)]"
                    >
                      {editable ? "Edit" : "View"}
                    </button>
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      <DocumentDetails
        key={selectedDocument?.id ?? "none"}
        document={selectedDocument}
        isOpen={Boolean(selectedDocument)}
        onClose={() => setSelectedDocument(null)}
        readOnly={
          selectedDocument
            ? !canEditSharedDocument(share, selectedDocument, user?.id)
            : true
        }
      />

      <DocumentPreview
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        fileUrl={preview?.url ?? ""}
        fileName={preview?.name ?? ""}
        fileType={preview?.type ?? "application/pdf"}
      />
    </div>
  );
}
