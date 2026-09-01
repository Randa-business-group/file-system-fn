"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { AppSelect } from "@/components/ui/AppSelect";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { MoveFolderModal } from "./MoveFolderModal";
import { useDeleteDocument, useRenameDocument, useConfirmDocument } from "@/lib/hooks/useDocuments";
import { useGetCategories } from "@/lib/hooks/useCategories";
import type { Document } from "@/types/document";

interface InboxDocumentCardProps {
  document: Document;
}

export function UnsortedDocumentCard({ document }: InboxDocumentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(document.fileName);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const { categories } = useGetCategories();

  const renameDocument = useRenameDocument();
  const deleteDocument = useDeleteDocument();
  const confirmDocument = useConfirmDocument();

  const formattedDate = useMemo(
    () => new Date(document.createdAt).toLocaleDateString(),
    [document.createdAt],
  );

  const handleRenameSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === document.fileName) {
      setIsEditing(false);
      return;
    }

    try {
      await renameDocument.mutateAsync({ id: document.id, fileName: trimmedName });
      toast.success("Document renamed successfully");
    } catch (error) {
      console.error("Rename document error:", error);
      toast.error("Failed to rename document");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDocument.mutateAsync(document.id);
    } catch (error) {
      console.error("Delete document error:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleteOpen(false);
    }
  };

  // Local editable state for AI fields (saved only on Confirm & Save)
  const [local, setLocal] = useState(() => ({
    title: document.title ?? null,
    documentOwner: document.documentOwner ?? null,
    author: document.author ?? null,
    documentType: document.documentType ?? null,
    concerning: document.concerning ?? null,
    purpose: document.purpose ?? null,
    documentDate: document.documentDate ?? null,
    summary: document.summary ?? null,
    categoryId: document.category?.id ?? null,
    folderId: document.folder?.id ?? null,
  }));

  const [editingField, setEditingField] = useState<string | null>(null);

  const handleLocalChange = (field: string, value: any) => {
    setLocal((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmSave = async () => {
    setIsConfirming(true);
    try {
      await confirmDocument.mutateAsync({ id: document.id, data: local });
      toast.success("Document saved successfully");
    } catch (error) {
      console.error("Confirm document error:", error);
      toast.error("Failed to save document");
    } finally {
      setIsConfirming(false);
    }
  };

  const openPreview = () => {
    window.open(document.fileUrl, "_blank", "noopener,noreferrer");
  };

  const status = document.processingStatus;

  return (
    <div className={["rounded-3xl border border-default bg-surface p-5 shadow-sm", status === 'confirmed' ? 'opacity-80' : ''].join(' ')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <DocumentTypeIcon fileName={document.fileName} size="lg" />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-foreground">{document.fileName}</h3>
            <p className="mt-2 text-sm text-secondary">Uploaded by {document.uploadedBy.name}</p>
            <p className="text-sm text-secondary">Added on {formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-secondary">
          {status === 'processing' ? (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 animate-pulse">AI Processing...</span>
          ) : status === 'ready' ? (
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Ready for Review</span>
          ) : (
            <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">Confirmed</span>
          )}
        </div>
      </div>
      <div className="mt-5">
        {status === 'processing' && (
          <div className="space-y-3">
            <div className="h-6 w-3/4 rounded-md bg-gray-200 animate-pulse" />
            <div className="h-4 w-1/2 rounded-md bg-gray-200 animate-pulse" />
          </div>
        )}

        {status === 'ready' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Grid of inline editable fields */}
            {[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'documentOwner', label: 'Document Owner', type: 'text' },
              { key: 'author', label: 'Author', type: 'text' },
              { key: 'documentType', label: 'Document Type', type: 'text' },
              { key: 'concerning', label: 'Concerning', type: 'text' },
              { key: 'purpose', label: 'Purpose', type: 'text' },
            ].map((f) => (
              <div key={f.key} className="rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-secondary">{f.label}</p>
                <div
                  className="mt-2 min-h-[38px] relative"
                  onClick={() => setEditingField(f.key)}
                >
                  {editingField === f.key ? (
                    <input
                      autoFocus
                      value={(local as any)[f.key] ?? ''}
                      onChange={(e) => handleLocalChange(f.key, e.target.value)}
                      onBlur={() => setEditingField(null)}
                      className="w-full rounded-2xl border border-default bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${!(local as any)[f.key] ? 'text-secondary' : 'text-foreground'}`}>
                        {(local as any)[f.key] ?? 'Click to add...'}
                      </p>
                      <Pencil className="h-4 w-4 text-secondary" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary">Document Date</p>
              <input
                type="date"
                value={local.documentDate ?? ''}
                onChange={(e) => handleLocalChange('documentDate', e.target.value)}
                className="mt-2 w-full rounded-2xl border border-default bg-surface px-3 py-2 text-sm text-foreground outline-none"
              />
            </div>

            <div className="rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary">Category</p>
              <AppSelect
                className="mt-2"
                value={local.categoryId ?? ""}
                onValueChange={(value) =>
                  handleLocalChange("categoryId", value || null)
                }
                placeholder="Select category"
                triggerClassName="rounded-2xl bg-surface"
                options={[
                  { value: "", label: "Select category" },
                  ...categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ]}
              />
            </div>

            <div className="sm:col-span-2 rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary">Summary</p>
              <textarea
                value={local.summary ?? ''}
                onChange={(e) => handleLocalChange('summary', e.target.value)}
                className="mt-2 w-full min-h-[80px] rounded-2xl border border-default bg-surface px-3 py-2 text-sm text-foreground outline-none"
              />
            </div>
          </div>
        )}

        {status === 'confirmed' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary">Title</p>
              <p className="mt-2 text-sm text-foreground">{document.title}</p>
            </div>
            <div className="rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary">Document Owner</p>
              <p className="mt-2 text-sm text-foreground">{document.documentOwner}</p>
            </div>
            <div className="rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary">Author</p>
              <p className="mt-2 text-sm text-foreground">{document.author}</p>
            </div>
            <div className="rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary">Document Type</p>
              <p className="mt-2 text-sm text-foreground">{document.documentType}</p>
            </div>
            <div className="sm:col-span-2 rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-secondary">Summary</p>
              <p className="mt-2 text-sm text-foreground">{document.summary}</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openPreview}
            className="inline-flex items-center gap-2 rounded-2xl border border-default bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>

          {status === 'ready' && (
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={isConfirming}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              Save & Confirm
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMoveOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-default bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
          >
            <FolderPlus className="h-4 w-4" />
            Move to Folder
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-default bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <MoveFolderModal
        isOpen={isMoveOpen}
        onClose={() => setIsMoveOpen(false)}
        documentId={document.id}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Move to trash?"
        description="This document will be moved to trash for 30 days. You can restore it from Trash."
        itemNameToConfirm={document.fileName}
        isLoading={deleteDocument.isLoading}
      />
    </div>
  );
}
