"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderUp,
  FolderTree,
  X,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  Pencil,
  Folder,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { documentApi } from "@/api/document.api";
import type {
  Document,
  FolderUploadFileItem,
  UploadFolderResult,
  UploadProcessingMode,
} from "@/types/document";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { isSupportedUploadFile } from "@/lib/upload-file-types";

const MAX_FOLDER_FILES = 500;
const FOLDER_UPLOAD_BATCH_SIZE = 8;
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB limit for large files

type FolderUploadPhase = "idle" | "structure" | "files" | "done";

interface FolderUploadDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
  parentFolderId?: string | null;
  initialItems?: ScannedItem[];
  onReset?: () => void;
}

export interface ScannedItem {
  file: File;
  relativePath: string;
}

export function shouldIgnoreFile(fileName: string): boolean {
  if (fileName.startsWith(".")) return true;
  if (fileName === "Thumbs.db" || fileName === "desktop.ini") return true;
  if (fileName.startsWith("~$")) return true;
  return false;
}

async function readAllDirectoryEntries(
  dirReader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
  const entries: FileSystemEntry[] = [];
  const readBatch = async (): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
      dirReader.readEntries(
        (batch) => {
          if (batch.length === 0) {
            resolve(entries);
          } else {
            entries.push(...batch);
            resolve(readBatch());
          }
        },
        (error) => reject(error),
      );
    });
  };
  return readBatch();
}

export async function scanFileSystemEntry(
  entry: FileSystemEntry,
  currentPath = "",
): Promise<ScannedItem[]> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    return new Promise((resolve) => {
      fileEntry.file(
        (file) => {
          if (shouldIgnoreFile(file.name)) {
            resolve([]);
            return;
          }
          const relPath = currentPath ? `${currentPath}/${file.name}` : file.name;
          resolve([{ file, relativePath: relPath }]);
        },
        () => resolve([]),
      );
    });
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    if (shouldIgnoreFile(dirEntry.name)) {
      return [];
    }
    const dirReader = dirEntry.createReader();
    const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

    try {
      const entries = await readAllDirectoryEntries(dirReader);
      const nested: ScannedItem[] = [];
      for (const child of entries) {
        const childItems = await scanFileSystemEntry(child, nextPath);
        nested.push(...childItems);
      }
      return nested;
    } catch {
      return [];
    }
  }
  return [];
}

export function FolderUploadDrawer({
  isOpen = true,
  onClose = () => undefined,
  embedded = false,
  parentFolderId,
  initialItems,
  onReset,
}: FolderUploadDrawerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<FolderUploadFileItem[]>(() => {
    if (!initialItems || initialItems.length === 0) return [];
    return initialItems
      .filter((item) => isSupportedUploadFile(item.file) && item.file.size <= MAX_FILE_SIZE)
      .map((item) => ({
        file: item.file,
        relativePath: item.relativePath,
        fileName: item.file.name,
        size: item.file.size,
        mode: "ai" as const,
        status: "pending" as const,
      }));
  });
  const [rootFolderName, setRootFolderName] = useState<string>(() => {
    if (!initialItems || initialItems.length === 0) return "";
    const firstRel = initialItems[0].relativePath;
    return firstRel.includes("/") ? firstRel.split("/")[0] : "Uploaded Folder";
  });
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<FolderUploadPhase>("idle");
  const [filesCompleted, setFilesCompleted] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadFolderResult | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setIsScanning(true);
    try {
      const scanned: ScannedItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          const res = await scanFileSystemEntry(entry);
          scanned.push(...res);
        } else {
          const file = item.getAsFile();
          if (file && !shouldIgnoreFile(file.name)) {
            scanned.push({ file, relativePath: file.name });
          }
        }
      }

      addScannedFiles(scanned);
    } catch (err) {
      console.error("Error scanning dropped folder:", err);
      toast.error("Failed to read folder contents. Please try selecting the folder via button.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
    if (rawFiles.length === 0) return;

    const scanned: ScannedItem[] = rawFiles
      .filter((file) => !shouldIgnoreFile(file.name))
      .map((file) => ({
        file,
        relativePath: file.webkitRelativePath || file.name,
      }));

    addScannedFiles(scanned);
    e.currentTarget.value = "";
  };

  const addScannedFiles = (newItems: ScannedItem[]) => {
    if (newItems.length === 0) {
      toast.error("No valid files found in selected folder.");
      return;
    }

    if (newItems.length > MAX_FOLDER_FILES) {
      toast.error(`Maximum ${MAX_FOLDER_FILES} files allowed per folder upload. Found ${newItems.length}.`);
      return;
    }

    // Determine initial root folder name from first item's relative path
    const firstRel = newItems[0].relativePath;
    const topLevelDir = firstRel.includes("/") ? firstRel.split("/")[0] : "Uploaded Folder";
    if (!rootFolderName) {
      setRootFolderName(topLevelDir);
    }

    // Filter invalid files
    const valid: ScannedItem[] = [];
    newItems.forEach((item) => {
      if (item.file.size > MAX_FILE_SIZE) {
        toast.error(`File ${item.file.name} exceeds size limit (skipped)`);
      } else if (!isSupportedUploadFile(item.file)) {
        toast.error(`File ${item.file.name} is not a supported file type (skipped)`);
      } else {
        valid.push(item);
      }
    });

    if (valid.length === 0) {
      return;
    }

    const fileItems: FolderUploadFileItem[] = valid.map((item) => ({
      file: item.file,
      relativePath: item.relativePath,
      fileName: item.file.name,
      size: item.file.size,
      mode: "ai",
      status: "pending",
    }));

    setFiles(fileItems);
    setUploadResult(null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleModeChange = (index: number, mode: UploadProcessingMode) => {
    setFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], mode };
      return next;
    });
  };

  const handleSetAllModes = (mode: UploadProcessingMode) => {
    setFiles((prev) => prev.map((file) => ({ ...file, mode })));
  };

  const applyBatchResults = (
    batchIndices: number[],
    savedDocs: Document[],
    failedList: { fileName: string; reason: string }[],
  ) => {
    const savedByName = new Map(savedDocs.map((doc) => [doc.fileName, doc]));
    const failedByName = new Map(failedList.map((f) => [f.fileName, f.reason]));

    setFiles((prev) =>
      prev.map((item, index) => {
        if (!batchIndices.includes(index)) return item;

        const doc =
          savedByName.get(item.fileName) ?? savedByName.get(item.file.name);
        if (doc) {
          if (item.mode === "manual" || doc.processingStatus === "confirmed") {
            return { ...item, status: "done" as const };
          }
          return { ...item, status: "queued" as const };
        }

        const failReason =
          failedByName.get(item.fileName) ?? failedByName.get(item.file.name);
        if (failReason) {
          return { ...item, status: "error" as const, error: failReason };
        }
        return { ...item, status: "error" as const, error: "Upload failed" };
      }),
    );
  };

  const handleUploadFolder = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadPhase("structure");
    setFilesCompleted(0);
    setUploadResult(null);

    setFiles((prev) =>
      prev.map((item) => ({
        ...item,
        status: "pending" as const,
        error: undefined,
      })),
    );

    const allPaths = files.map((f) => f.relativePath);
    const aiQueuedTotal = files.filter((f) => f.mode === "ai").length;
    const allSaved: Document[] = [];
    const allFailed: { fileName: string; reason: string }[] = [];

    try {
      const initResult = await documentApi.initFolderUpload({
        paths: allPaths,
        parentFolderId,
        rootFolderName: rootFolderName.trim() || undefined,
      });

      setUploadPhase("files");

      const totalBatches = Math.ceil(files.length / FOLDER_UPLOAD_BATCH_SIZE);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * FOLDER_UPLOAD_BATCH_SIZE;
        const end = Math.min(start + FOLDER_UPLOAD_BATCH_SIZE, files.length);
        const batchItems = files.slice(start, end);
        const batchIndices = Array.from(
          { length: end - start },
          (_, offset) => start + offset,
        );

        setFiles((prev) =>
          prev.map((item, index) =>
            batchIndices.includes(index)
              ? { ...item, status: "uploading" as const }
              : item,
          ),
        );

        const isLastBatch = batchIndex === totalBatches - 1;

        const batchResult = await documentApi.uploadFolderBatch({
          rootFolderId: initResult.folder.id,
          files: batchItems.map((f) => f.file),
          paths: batchItems.map((f) => f.relativePath),
          modes: batchItems.map((f) => f.mode),
          notifyTray: isLastBatch && aiQueuedTotal > 0,
          totalAiQueued: isLastBatch && aiQueuedTotal > 0 ? aiQueuedTotal : undefined,
        });

        allSaved.push(...batchResult.uploadedDocuments);
        allFailed.push(...batchResult.failures);
        applyBatchResults(
          batchIndices,
          batchResult.uploadedDocuments,
          batchResult.failures,
        );
        setFilesCompleted(end);
      }

      const aggregated: UploadFolderResult = {
        folder: initResult.folder,
        createdFoldersCount: initResult.createdFoldersCount,
        uploadedDocuments: allSaved,
        failures: allFailed,
      };

      setUploadResult(aggregated);
      setUploadPhase("done");

      if (allSaved.length > 0) {
        toast.success(
          `Folder "${initResult.folder.name}" created with ${initResult.createdFoldersCount} subfolder(s) and ${allSaved.length} file(s).`,
        );
      } else {
        toast.error("Failed to upload folder contents.");
      }

      if (allFailed.length > 0) {
        toast.warning(`${allFailed.length} file(s) failed to upload.`);
      }

      if (aiQueuedTotal > 0) {
        toast.message(
          `${aiQueuedTotal} file(s) queued for AI. Open Tray to review and confirm each document.`,
          { duration: 6000 },
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["folders"] });
      await queryClient.invalidateQueries({ queryKey: ["tray"] });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Folder upload failed";
      setFiles((prev) =>
        prev.map((item) =>
          item.status === "done" || item.status === "queued"
            ? item
            : {
                ...item,
                status: "error" as const,
                error: message,
              },
        ),
      );
      toast.error(message);
      setUploadPhase("idle");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setRootFolderName("");
    setUploadResult(null);
    setIsUploading(false);
    setUploadPhase("idle");
    setFilesCompleted(0);
  };

  const handleDone = () => {
    handleReset();
    onClose();
  };

  const handleOpenFolder = (slug: string) => {
    handleReset();
    onClose();
    router.push(`/dashboard/folders?folder=${slug}`);
  };

  // Stats calculation
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
  const uniqueSubdirectories = new Set(
    files
      .map((f) => {
        const parts = f.relativePath.split("/").slice(1, -1);
        return parts.join("/");
      })
      .filter(Boolean),
  ).size;

  const canClose = !isUploading && !isScanning;
  const showProgress = isUploading || uploadResult !== null;
  const queuedCount = files.filter((f) => f.status === "queued").length;
  const overallPercent =
    uploadPhase === "structure"
      ? 8
      : files.length > 0
        ? Math.min(100, Math.round((filesCompleted / files.length) * 100))
        : 0;

  const content = (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-secondary">
          Upload an entire folder hierarchy. All nested subfolders and files will be automatically preserved in the system.
        </p>
      </div>

      {!showProgress && files.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="rounded border-2 border-dashed border-default bg-[var(--color-bg-secondary)] p-8 text-center transition hover:border-primary/60 hover:bg-[var(--color-bg-tertiary)]"
        >
          <FolderUp className="mx-auto h-12 w-12 text-secondary" />
          <p className="mt-4 text-sm font-medium text-foreground">
            {isScanning ? "Scanning folder contents…" : "Drag & drop a folder here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-secondary">
            Preserves full folder tree · up to {MAX_FOLDER_FILES} files · fast parallel upload
          </p>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={isScanning}
            className="mt-4 inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <FolderTree className="h-4 w-4" />
                Select Folder
              </>
            )}
          </button>
        </div>
      )}

      {!showProgress && files.length > 0 && (
        <div className="space-y-5">
          {/* Root Folder Name input */}
          <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
                Root Folder Name
              </label>
              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="text-xs font-semibold text-primary transition hover:underline"
                >
                  Change folder
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary shrink-0" />
              <input
                type="text"
                value={rootFolderName}
                onChange={(e) => setRootFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="w-full rounded border border-default bg-[var(--color-bg-secondary)] px-3 py-1.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-secondary">
              This will be the top-level folder created in the system.
            </p>
          </div>

          {/* Hierarchy summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-default bg-[var(--color-bg-secondary)] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-secondary">
                <Layers className="h-3.5 w-3.5" />
                Subfolders
              </div>
              <p className="mt-1 text-base font-semibold text-foreground">
                {uniqueSubdirectories}
              </p>
            </div>
            <div className="rounded-xl border border-default bg-[var(--color-bg-secondary)] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-secondary">
                <FolderUp className="h-3.5 w-3.5" />
                Files
              </div>
              <p className="mt-1 text-base font-semibold text-foreground">
                {files.length}
              </p>
            </div>
            <div className="rounded-xl border border-default bg-[var(--color-bg-secondary)] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-secondary">
                Size
              </div>
              <p className="mt-1 text-base font-semibold text-foreground">
                {totalSizeMB} MB
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-xs text-amber-950">
            <p className="font-semibold">AI analysis runs in Tray</p>
            <p className="mt-1 leading-relaxed opacity-90">
              Files set to <strong>AI</strong> upload to the folder, then appear in{" "}
              <strong>Tray</strong> one at a time for you to review metadata and confirm.
              Use <strong>Manual</strong> to save titles immediately without Tray.
            </p>
          </div>

          {/* Bulk mode switch */}
          <div className="flex items-center justify-between border-y border-default py-2.5">
            <span className="text-xs font-medium text-secondary">
              Processing mode for all files:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetAllModes("ai")}
                className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                All AI
              </button>
              <button
                type="button"
                onClick={() => handleSetAllModes("manual")}
                className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5 text-secondary" />
                All Manual
              </button>
            </div>
          </div>

          {/* File listing with relative paths */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {files.map((item, index) => {
              // Path within root folder
              const pathDisplay = item.relativePath.includes("/")
                ? item.relativePath.split("/").slice(1).join("/")
                : item.fileName;

              return (
                <div
                  key={`${item.relativePath}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-default bg-[var(--color-bg-secondary)] p-2.5 text-xs"
                >
                  <DocumentTypeIcon fileName={item.fileName} size="sm" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground" title={item.relativePath}>
                      {pathDisplay}
                    </p>
                    <p className="text-[11px] text-secondary">
                      {(item.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {/* Mode toggles */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleModeChange(index, "ai")}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                        item.mode === "ai"
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
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                        item.mode === "manual"
                          ? "bg-[var(--color-bg-tertiary)] text-foreground"
                          : "border border-default bg-surface text-secondary"
                      }`}
                    >
                      <Pencil className="h-3 w-3" />
                      Manual
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="rounded p-1 text-secondary hover:bg-[var(--color-bg-tertiary)] hover:text-foreground shrink-0"
                    title="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded border border-default px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
            >
              Choose different folder
            </button>
            <button
              type="button"
              onClick={handleUploadFolder}
              disabled={isUploading || !rootFolderName.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
            >
              <FolderUp className="h-4 w-4" />
              Upload &quot;{rootFolderName.trim() || "Folder"}&quot; ({files.length} files)
            </button>
          </div>
        </div>
      )}

      {/* Progress and Result Display */}
      {showProgress && (
        <div className="space-y-4">
          {(isUploading || uploadPhase === "done") && (
            <div className="rounded-xl border border-default bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {uploadPhase === "structure"
                      ? "Creating folder structure…"
                      : uploadPhase === "files"
                        ? `Uploading files (${filesCompleted}/${files.length})`
                        : "Upload complete"}
                  </p>
                  <p className="mt-0.5 text-xs text-secondary">
                    {uploadPhase === "structure"
                      ? "Setting up subfolders before file transfer"
                      : "Uploading in small batches for reliability on slow connections"}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {overallPercent}%
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              {isUploading ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-secondary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Please keep this window open until all batches finish.
                </div>
              ) : null}
            </div>
          )}

          {uploadResult && (
            <div className="rounded-xl border border-green-200/80 bg-green-50/90 p-4 text-green-950">
              <div className="flex items-center gap-2 font-semibold">
                <Check className="h-5 w-5 text-green-600 shrink-0" />
                <span>Folder Upload Completed</span>
              </div>
              <p className="mt-1 text-xs text-green-900 leading-relaxed">
                Folder <strong>{uploadResult.folder.name}</strong> created with{" "}
                <strong>{uploadResult.createdFoldersCount}</strong> subfolder(s) and{" "}
                <strong>{uploadResult.uploadedDocuments.length}</strong> file(s).
              </p>

              {queuedCount > 0 && (
                <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
                  <p className="font-medium">
                    {queuedCount} document(s) queued for AI analysis in Tray
                  </p>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    AI analyses files one by one. You can monitor progress in Tray.
                  </p>
                  <Link
                    href="/dashboard/unsorted"
                    onClick={onClose}
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    Open Tray
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Progress file items */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {files.map((file, index) => (
              <div
                key={`${file.relativePath}-prog-${index}`}
                className="rounded-lg border border-default bg-[var(--color-bg-secondary)] p-2.5"
              >
                <div className="flex items-center gap-3">
                  <DocumentTypeIcon fileName={file.fileName} size="sm" />
                  {file.status === "pending" && (
                    <div className="h-4 w-4 shrink-0 rounded-full bg-[var(--color-bg-tertiary)]" />
                  )}
                  {file.status === "uploading" && (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  )}
                  {file.status === "queued" && (
                    <Layers className="h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  {file.status === "done" && (
                    <Check className="h-4 w-4 shrink-0 text-green-600" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {file.relativePath}
                    </p>
                    {file.status === "pending" && (
                      <p className="text-[11px] text-secondary">Waiting…</p>
                    )}
                    {file.status === "uploading" && (
                      <p className="text-[11px] text-primary">Uploading…</p>
                    )}
                    {file.status === "queued" && (
                      <p className="text-[11px] text-amber-700">
                        In Tray — confirm metadata when ready
                      </p>
                    )}
                    {file.status === "done" && (
                      <p className="text-[11px] text-green-700">Saved in folder</p>
                    )}
                    {file.error && (
                      <p className="text-[11px] text-red-600">{file.error}</p>
                    )}
                  </div>
                </div>
                {file.status === "uploading" ? (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Completion actions */}
          {uploadResult && (
            <div className="flex flex-col gap-2 pt-2">
              {queuedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleDone();
                    router.push("/dashboard/unsorted");
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  <Layers className="h-4 w-4" />
                  Open Tray ({queuedCount} to confirm)
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => handleOpenFolder(uploadResult.folder.slug)}
                className="inline-flex w-full items-center justify-center gap-2 rounded border border-default bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
              >
                <Folder className="h-4 w-4" />
                Open &quot;{uploadResult.folder.name}&quot; Folder
              </button>

              <button
                type="button"
                onClick={handleDone}
                className="w-full rounded border border-default px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden input for folder browsing */}
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...{
          webkitdirectory: "",
          directory: "",
        }}
        onChange={handleFolderInputChange}
        className="hidden"
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Folder"
      variant="side"
      disableClose={!canClose}
      disableOverlayClick={!canClose}
    >
      {content}
    </Modal>
  );
}
