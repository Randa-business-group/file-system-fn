"use client";

import { useState } from "react";
import { ChevronRight, FolderArchive } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { useGetRootFolders } from "@/lib/hooks/useFolders";
import { useMoveToFolder } from "@/lib/hooks/useDocuments";
import type { Folder } from "@/types/folder";

interface MoveFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

export function MoveFolderModal({ isOpen, onClose, documentId }: MoveFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { folders, isLoading } = useGetRootFolders();
  const moveToFolder = useMoveToFolder();

  const handleClose = () => {
    setSelectedFolderId(null);
    onClose();
  };

  const handleMove = async () => {
    if (!selectedFolderId) {
      toast.error("Please select a folder to move the document into.");
      return;
    }

    try {
      await moveToFolder.mutateAsync({ id: documentId, folderId: selectedFolderId });
      toast.success("Document moved successfully");
      handleClose();
    } catch (error) {
      console.error("Move document error:", error);
      toast.error("Failed to move document. Please try again.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Move to Folder"
      variant="center"
    >
      <div className="space-y-4">
        <p className="text-sm text-secondary">
          Pick a destination folder for this document.
        </p>

        <div className="rounded-3xl border border-default bg-[var(--color-bg-secondary)] p-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-2xl bg-[var(--color-bg-tertiary)]" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedFolderId("root")}
                className={[
                  "flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition",
                  selectedFolderId === "root"
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-default bg-surface text-foreground hover:border-primary hover:bg-[var(--color-bg-secondary)]",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <FolderArchive className="h-4 w-4" />
                  Root directory (no folder)
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
              {folders.map((folder: Folder) => {
                const isSelected = folder.id === selectedFolderId;
                return (
                  <button
                    type="button"
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={[
                      "flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition",
                      isSelected
                        ? "border-primary bg-primary-subtle text-primary"
                        : "border-default bg-surface text-foreground hover:border-primary hover:bg-[var(--color-bg-secondary)]",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <FolderArchive className="h-4 w-4" />
                      {folder.name}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-2xl border border-default bg-background px-4 py-3 text-sm font-semibold text-secondary transition hover:bg-[var(--color-bg-secondary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={!selectedFolderId || moveToFolder.isLoading}
            className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {moveToFolder.isLoading ? "Moving..." : "Move Here"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
