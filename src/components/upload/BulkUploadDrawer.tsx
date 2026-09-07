"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  X,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { useBulkUpload } from "@/lib/hooks/useDocuments";
import type { BulkUploadFile, UploadProcessingMode } from "@/types/document";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import {
  getUploadFileKind,
  isSupportedUploadFile,
  UPLOAD_ACCEPT,
} from "@/lib/upload-file-types";

const MAX_FILES = 15;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface BulkUploadDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
  initialFiles?: File[];
  onReset?: () => void;
}

function FileTypeIcon({ file }: { file: BulkUploadFile }) {
  const kind = getUploadFileKind({
    type: file.file.type,
    name: file.fileName,
  });

  if (kind === "image") {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-default">
        <Image
          src={file.preview}
          alt={file.fileName}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return <DocumentTypeIcon fileName={file.fileName} size="sm" />;
}

export function BulkUploadDrawer({
  isOpen = true,
  onClose = () => undefined,
  embedded = false,
  initialFiles,
  onReset,
}: BulkUploadDrawerProps) {
  const [files, setFiles] = useState<BulkUploadFile[]>(() => {
    if (!initialFiles || initialFiles.length === 0) return [];
    return initialFiles
      .filter((file) => isSupportedUploadFile(file) && file.size <= MAX_FILE_SIZE)
      .map((file) => ({
        file,
        fileName: file.name,
        preview: URL.createObjectURL(file),
        size: file.size,
        fileType: getUploadFileKind(file),
        mode: "ai" as const,
        status: "pending" as const,
      }));
  });
  const [isUploading, setIsUploading] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const bulkUpload = useBulkUpload();

  const isValidFile = (file: File): boolean =>
    isSupportedUploadFile(file) && file.size <= MAX_FILE_SIZE;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.currentTarget.files
      ? Array.from(e.currentTarget.files)
      : [];
    addFiles(selectedFiles);
    e.currentTarget.value = "";
  };

  const addFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed at once`);
      return;
    }

    const invalidFiles = newFiles.filter((f) => !isValidFile(f));
    if (invalidFiles.length > 0) {
      invalidFiles.forEach((f) => {
        if (f.size > MAX_FILE_SIZE) {
          toast.error(`File ${f.name} exceeds 10MB limit`);
        } else {
          toast.error(`File ${f.name} is not a supported file type`);
        }
      });
      return;
    }

    const bulkUploadFiles: BulkUploadFile[] = newFiles.map((file) => ({
      file,
      fileName: file.name,
      preview: URL.createObjectURL(file),
      size: file.size,
      fileType: getUploadFileKind(file),
      mode: "ai",
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...bulkUploadFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleRenameFile = (index: number, newName: string) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles[index].fileName = newName;
      return newFiles;
    });
  };

  const handleModeChange = (index: number, mode: UploadProcessingMode) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], mode };
      return newFiles;
    });
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setAllComplete(false);

    setFiles((prev) =>
      prev.map((item) => ({
        ...item,
        status: "uploading" as const,
        error: undefined,
      })),
    );

    const items = files.map((item) => ({
      file: item.file,
      fileName: item.fileName,
      fileType: item.fileType,
      mode: item.mode,
    }));

    try {
      const { saved, failed } = await bulkUpload.mutateAsync({ items });

      const savedByName = new Map(
        saved.map((doc) => [doc.fileName, doc]),
      );
      const failedByName = new Map(
        failed.map((entry) => [entry.fileName, entry.reason]),
      );

      setFiles((prev) =>
        prev.map((item) => {
          const savedDoc =
            savedByName.get(item.file.name) ?? savedByName.get(item.fileName);

          if (savedDoc) {
            if (item.mode === "manual" || savedDoc.processingStatus === "confirmed") {
              return { ...item, status: "done" as const };
            }
            return { ...item, status: "queued" as const };
          }

          const reason =
            failedByName.get(item.file.name) ?? failedByName.get(item.fileName);
          if (reason) {
            return { ...item, status: "error" as const, error: reason };
          }
          return { ...item, status: "error" as const, error: "Upload failed" };
        }),
      );

      setAllComplete(true);

      const manualCount = files.filter((file) => file.mode === "manual").length;
      const aiCount = files.length - manualCount;

      if (saved.length === 0) {
        toast.error("No files were uploaded.");
      } else if (failed.length > 0) {
        toast.warning(
          `${saved.length} file${saved.length === 1 ? "" : "s"} uploaded. ${failed.length} failed.`,
        );
      } else if (aiCount > 0 && manualCount > 0) {
        toast.success(
          `${manualCount} saved immediately. ${aiCount} queued for AI analysis in Tray.`,
        );
      } else if (manualCount > 0) {
        toast.success(
          `${manualCount} file${manualCount === 1 ? "" : "s"} saved immediately.`,
        );
      } else {
        toast.success(
          `${saved.length} file${saved.length === 1 ? "" : "s"} uploaded. AI analyzes them one by one — open Tray to follow progress.`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Bulk upload failed";
      setFiles((prev) =>
        prev.map((item) => ({
          ...item,
          status: "error" as const,
          error: message,
        })),
      );
      setAllComplete(true);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDone = () => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    setFiles([]);
    setAllComplete(false);
    onClose();
  };

  const canClose = !isUploading;
  const showProgressStep = isUploading || allComplete;
  const queuedCount = files.filter((f) => f.status === "queued").length;
  const doneCount = files.filter((f) => f.status === "done").length;

  const content = (
    <>
      <div className="space-y-6">
        <p className="text-sm text-secondary">
          Choose AI or manual per file. AI files upload first, then OCR and AI run{" "}
          <strong className="font-medium text-foreground">one at a time</strong>.
        </p>

        {!showProgressStep && (
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="rounded border-2 border-dashed border-default bg-[var(--color-bg-secondary)] p-8 text-center transition hover:border-primary/60 hover:bg-[var(--color-bg-tertiary)]"
            >
              <Upload className="mx-auto h-12 w-12 text-secondary" />
              <p className="mt-4 text-sm font-medium text-foreground">
                Drag & drop or click to browse
              </p>
              <p className="mt-1 text-xs text-secondary">
                Supports PDF, Word, Excel, CSV and images · max {MAX_FILES} files · 10MB each
              </p>
              <label
                htmlFor="bulk-file-input"
                className="mt-4 inline-flex cursor-pointer rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                Choose Files
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                  </p>
                  {onReset && (
                    <button
                      type="button"
                      onClick={onReset}
                      className="text-xs font-semibold text-primary transition hover:underline"
                    >
                      Change files
                    </button>
                  )}
                </div>
                {files.map((file, index) => (
                  <div
                    key={`${file.fileName}-${index}`}
                    className="flex items-start gap-3 rounded border border-default bg-[var(--color-bg-secondary)] p-3"
                  >
                    <FileTypeIcon file={file} />

                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        type="text"
                        value={file.fileName}
                        onChange={(e) => handleRenameFile(index, e.target.value)}
                        className="w-full rounded border border-default bg-surface px-2 py-1 text-xs text-foreground placeholder-secondary focus:border-primary focus:outline-none"
                      />
                      <p className="text-xs text-secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleModeChange(index, "ai")}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            file.mode === "ai"
                              ? "bg-primary text-primary-foreground"
                              : "border border-default bg-surface text-secondary"
                          }`}
                        >
                          <Sparkles className="h-3 w-3" />
                          AI
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModeChange(index, "manual")}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            file.mode === "manual"
                              ? "bg-[var(--color-bg-tertiary)] text-foreground"
                              : "border border-default bg-surface text-secondary"
                          }`}
                        >
                          <Pencil className="h-3 w-3" />
                          Manual
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="rounded p-1 hover:bg-[var(--color-bg-tertiary)]"
                    >
                      <X className="h-4 w-4 text-secondary" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length > 0 && (
              <button
                type="button"
                onClick={handleUploadAll}
                disabled={isUploading}
                className="inline-flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Upload Files
              </button>
            )}
          </div>
        )}

        {showProgressStep && (
          <div className="space-y-4">
            {isUploading && (
              <div className="flex items-center gap-3 rounded border border-primary/20 bg-primary/5 px-4 py-3">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Uploading files…
                  </p>
                  <p className="text-xs text-secondary">
                    Manual files save immediately. AI files continue on Tray.
                  </p>
                </div>
              </div>
            )}

            {allComplete && queuedCount > 0 && (
              <div className="rounded border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">
                  {queuedCount} document{queuedCount === 1 ? "" : "s"} queued for analysis
                </p>
                <p className="mt-1 text-xs opacity-90">
                  You can close this window. Progress updates live on Tray.
                </p>
                <Link
                  href="/dashboard/unsorted"
                  onClick={onClose}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  Open Tray
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {allComplete && doneCount > 0 && queuedCount === 0 && (
              <div className="rounded border border-green-200/80 bg-green-50/80 px-4 py-3 text-sm text-green-900">
                <p className="font-medium">
                  {doneCount} document{doneCount === 1 ? "" : "s"} saved immediately
                </p>
              </div>
            )}

            {files.map((file, index) => (
              <div
                key={`${file.fileName}-progress-${index}`}
                className="flex items-center gap-3 rounded border border-default bg-[var(--color-bg-secondary)] p-3"
              >
                {file.status === "pending" && (
                  <div className="h-5 w-5 shrink-0 rounded-full bg-[var(--color-bg-tertiary)]" />
                )}
                {file.status === "uploading" && (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                )}
                {file.status === "queued" && (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-600" />
                )}
                {file.status === "done" && (
                  <Check className="h-5 w-5 shrink-0 text-green-600" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.fileName}
                  </p>
                  {file.status === "uploading" && (
                    <p className="text-xs text-secondary">Uploading…</p>
                  )}
                  {file.status === "queued" && (
                    <p className="text-xs text-amber-700">
                      In Tray — waiting for AI (one-by-one)
                    </p>
                  )}
                  {file.status === "done" && (
                    <p className="text-xs text-green-700">Saved immediately</p>
                  )}
                  {file.error && (
                    <p className="text-xs text-red-600">{file.error}</p>
                  )}
                </div>
              </div>
            ))}

            {allComplete && (
              <div className="flex flex-col gap-2">
                {queuedCount > 0 && (
                  <Link
                    href="/dashboard/unsorted"
                    onClick={onClose}
                    className="inline-flex w-full items-center justify-center gap-2 rounded border border-primary bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
                  >
                    View progress in Tray
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleDone}
                  className="w-full rounded bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  {queuedCount > 0 ? "Close" : "Done"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <input
        id="bulk-file-input"
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Upload"
      variant="side"
      disableClose={!canClose}
      disableOverlayClick={!canClose}
    >
      {content}
    </Modal>
  );
}
