"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FolderUp,
  FileText,
  Layers,
  Loader2,
  Folder,
} from "lucide-react";
import { toast } from "sonner";
import {
  isSupportedUploadFile,
  UPLOAD_ACCEPT,
} from "@/lib/upload-file-types";
import {
  scanFileSystemEntry,
  shouldIgnoreFile,
  type ScannedItem,
} from "./FolderUploadDrawer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

export type DropResult =
  | { type: "single"; file: File }
  | { type: "multiple"; files: File[] }
  | { type: "folder"; folderItems: ScannedItem[] };

interface DropZoneProps {
  onItemsSelected: (result: DropResult) => void;
  targetFolderName?: string | null;
}

export function DropZone({ onItemsSelected, targetFolderName }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if left the container itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const processScannedItems = (items: ScannedItem[], hasDirectory: boolean) => {
    if (items.length === 0) {
      toast.error("No valid items found.");
      return;
    }

    const valid: ScannedItem[] = [];
    let oversizedCount = 0;
    let unsupportedCount = 0;

    items.forEach((item) => {
      if (item.file.size > MAX_FILE_SIZE) {
        oversizedCount++;
      } else if (!isSupportedUploadFile(item.file)) {
        unsupportedCount++;
      } else {
        valid.push(item);
      }
    });

    if (oversizedCount > 0) {
      toast.error(
        `${oversizedCount} file${oversizedCount > 1 ? "s" : ""} skipped (exceeds 10MB limit)`,
      );
    }
    if (unsupportedCount > 0) {
      toast.error(
        `${unsupportedCount} file${unsupportedCount > 1 ? "s" : ""} skipped (unsupported file format)`,
      );
    }

    if (valid.length === 0) {
      toast.error("No compatible files found to upload.");
      return;
    }

    const isFolder =
      hasDirectory || valid.some((i) => i.relativePath.includes("/"));

    if (isFolder) {
      toast.info(`Folder detected (${valid.length} files)`);
      onItemsSelected({ type: "folder", folderItems: valid });
    } else if (valid.length > 1) {
      toast.info(`${valid.length} files detected`);
      onItemsSelected({ type: "multiple", files: valid.map((i) => i.file) });
    } else {
      onItemsSelected({ type: "single", file: valid[0].file });
    }
  };

  const processRawFiles = (rawFiles: File[]) => {
    const scanned: ScannedItem[] = rawFiles
      .filter((file) => !shouldIgnoreFile(file.name))
      .map((file) => ({
        file,
        relativePath: file.webkitRelativePath || file.name,
      }));
    const hasDirectory = scanned.some((i) => i.relativePath.includes("/"));
    processScannedItems(scanned, hasDirectory);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) {
      const rawFiles = Array.from(e.dataTransfer.files || []);
      if (rawFiles.length > 0) {
        processRawFiles(rawFiles);
      }
      return;
    }

    setIsScanning(true);
    try {
      let hasDirectory = false;
      const scanned: ScannedItem[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          if (entry.isDirectory) {
            hasDirectory = true;
          }
          const res = await scanFileSystemEntry(entry);
          scanned.push(...res);
        } else {
          const file = item.getAsFile();
          if (file && !shouldIgnoreFile(file.name)) {
            scanned.push({ file, relativePath: file.name });
          }
        }
      }

      processScannedItems(scanned, hasDirectory);
    } catch (err) {
      console.error("Error scanning dropped items:", err);
      toast.error("Failed to read dropped items.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
    if (rawFiles.length > 0) {
      processRawFiles(rawFiles);
    }
    e.currentTarget.value = "";
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
    if (rawFiles.length > 0) {
      const scanned: ScannedItem[] = rawFiles
        .filter((file) => !shouldIgnoreFile(file.name))
        .map((file) => ({
          file,
          relativePath: file.webkitRelativePath || file.name,
        }));
      processScannedItems(scanned, true);
    }
    e.currentTarget.value = "";
  };

  return (
    <div className="space-y-6">
      {targetFolderName && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-secondary">
          <Folder className="h-4 w-4 text-primary shrink-0" />
          <span>
            Target destination:{" "}
            <strong className="font-semibold text-foreground">
              {targetFolderName}
            </strong>
          </span>
        </div>
      )}

      {/* Unified Portal Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
          isDragging
            ? "border-primary bg-primary-subtle/40 ring-4 ring-primary/10"
            : "border-default bg-[var(--color-bg-secondary)] hover:border-primary/60 hover:bg-[var(--color-bg-tertiary)]"
        }`}
      >
        {isScanning ? (
          <div className="py-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-subtle text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                Scanning items…
              </p>
              <p className="mt-1 text-xs text-secondary">
                Analyzing directory structure and validating file compatibility
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Visual Icon Group */}
            <div className="mx-auto flex items-center justify-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle text-primary shadow-sm transition group-hover:scale-105">
                <Upload className="h-7 w-7" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-default text-secondary shadow-sm transition group-hover:scale-105">
                <FolderUp className="h-6 w-6 text-primary/80" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-default text-secondary shadow-sm transition group-hover:scale-105">
                <Layers className="h-5 w-5 text-secondary" />
              </div>
            </div>

            <div>
              <p className="text-lg font-semibold text-foreground">
                Drag & drop files or folders here
              </p>
              <p className="mt-1 text-sm text-secondary max-w-md mx-auto">
                Drop a single document, multiple files, or an entire folder.
                The system automatically adjusts.
              </p>
            </div>

            {/* Direct Browse Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover active:scale-95"
              >
                <FileText className="h-4 w-4" />
                Browse Files
              </button>

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-default bg-surface px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-[var(--color-bg-secondary)] active:scale-95"
              >
                <FolderUp className="h-4 w-4 text-primary" />
                Upload Folder
              </button>
            </div>

            {/* Supported Formats & Rules */}
            <div className="pt-4 border-t border-default/60 max-w-lg mx-auto">
              <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2.5">
                Supported Formats · Up to 10MB per file
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="rounded-md bg-red-100/70 px-2 py-0.5 text-xs font-medium text-red-700">
                  PDF
                </span>
                <span className="rounded-md bg-blue-100/70 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Word (.docx)
                </span>
                <span className="rounded-md bg-emerald-100/70 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Excel (.xlsx)
                </span>
                <span className="rounded-md bg-teal-100/70 px-2 py-0.5 text-xs font-medium text-teal-700">
                  CSV
                </span>
                <span className="rounded-md bg-violet-100/70 px-2 py-0.5 text-xs font-medium text-violet-700">
                  Images (JPG, PNG, WebP)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input (multiple files) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Hidden Folder Input (directory) */}
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
}
