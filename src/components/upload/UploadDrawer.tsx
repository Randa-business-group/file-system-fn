"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { DropZone } from "./DropZone";
import { ProcessingState } from "./ProcessingState";
import { ConfirmDocumentForm } from "./ConfirmDocumentForm";
import { BulkUploadDrawer } from "./BulkUploadDrawer";
import { FolderUploadDrawer } from "./FolderUploadDrawer";
import { ModeSelector } from "./ModeSelector";
import {
  useConfirmDocument,
  useCreateDocument,
  useProcessDocument,
} from "@/lib/hooks/useDocuments";
import { useDashboard } from "@/lib/dashboard-context";
import { uploadApi } from "@/api/upload.api";
import { extractTextFromFile } from "@/lib/extract-text";
import { getUploadFileKind } from "@/lib/upload-file-types";
import type { ProcessDocumentResult, UploadProcessingMode } from "@/types/document";
import type {
  ConfirmDocumentFormData,
  ManualConfirmDocumentFormData,
} from "@/types/schema/document.schema";

type UploadState = "IDLE" | "SELECTING_MODE" | "PROCESSING" | "CONFIRM" | "SUCCESS";
type UploadMode = "single" | "multiple" | "folder";

interface UploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string | null;
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "") || fileName;
}

function emptyManualDefaults(fileName: string): ProcessDocumentResult {
  return {
    title: stripExtension(fileName),
    category: "",
    summary: "",
  };
}

export function UploadDrawer({ isOpen, onClose, folderId: propFolderId }: UploadDrawerProps) {
  const { uploadFolderId, uploadInitialTab } = useDashboard();
  const [mode, setMode] = useState<UploadMode>(uploadInitialTab ?? "single");
  const [state, setState] = useState<UploadState>("IDLE");
  const [processingMode, setProcessingMode] = useState<UploadProcessingMode>("ai");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [aiResult, setAiResult] = useState<ProcessDocumentResult | null>(null);

  const prevIsOpenRef = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setMode(uploadInitialTab ?? "single");
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, uploadInitialTab]);

  const processDocument = useProcessDocument();
  const createDocument = useCreateDocument();
  const confirmDocument = useConfirmDocument();
  const effectiveFolderId = propFolderId ?? uploadFolderId;

  const resetUploadState = useCallback(() => {
    setState("IDLE");
    setProcessingMode("ai");
    setCurrentStep(1);
    setSelectedFile(null);
    setExtractedText("");
    setAiResult(null);
  }, []);

  const handleProcessFile = async (file: File) => {
    setState("PROCESSING");
    setCurrentStep(1);

    try {
      const text = await extractTextFromFile(file);
      setExtractedText(text);

      setCurrentStep(2);
      const result = await processDocument.mutateAsync(text);
      setAiResult(result);
      setState("CONFIRM");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process document. Please try again.");
      resetUploadState();
    }
  };

  const handleFileSelected = useCallback((file: File | null) => {
    if (!file) {
      resetUploadState();
      return;
    }

    setSelectedFile(file);
    setState("SELECTING_MODE");
  }, [resetUploadState]);

  const handleModeSelect = (nextMode: UploadProcessingMode) => {
    if (!selectedFile) return;

    setProcessingMode(nextMode);

    if (nextMode === "manual") {
      setExtractedText("");
      setAiResult(emptyManualDefaults(selectedFile.name));
      setState("CONFIRM");
      return;
    }

    void handleProcessFile(selectedFile);
  };

  const handleConfirmDocument = async (
    data: ConfirmDocumentFormData | ManualConfirmDocumentFormData,
  ) => {
    if (!selectedFile) {
      toast.error("Missing document data");
      return;
    }

    const targetFolderId =
      processingMode === "manual"
        ? (data as ManualConfirmDocumentFormData).folderId ?? effectiveFolderId
        : effectiveFolderId;

    if (!targetFolderId) {
      toast.error("Please select a folder");
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);
      const uploadResult = await uploadApi.uploadFile(uploadFormData);
      const fileUrl = uploadResult.url;

      if (processingMode === "manual") {
        const manualData = data as ManualConfirmDocumentFormData;
        const created = await createDocument.mutateAsync({
          fileUrl,
          fileName: selectedFile.name,
          extractedText: "",
          folderId: targetFolderId,
          title: manualData.title,
          summary: "Uploaded manually.",
        });

        await confirmDocument.mutateAsync({
          id: created.id,
          data: {
            title: manualData.title,
            folderId: targetFolderId,
          },
        });
      } else {
        if (!extractedText) {
          toast.error("Missing document data");
          return;
        }

        const aiData = data as ConfirmDocumentFormData;
        await createDocument.mutateAsync({
          fileUrl,
          fileName: selectedFile.name,
          extractedText,
          folderId: targetFolderId,
          title: aiData.title,
          summary: aiData.summary,
          categoryId: aiData.categoryId?.trim() ? aiData.categoryId : undefined,
          category:
            !aiData.categoryId?.trim() && aiData.categoryName?.trim()
              ? aiData.categoryName.trim()
              : undefined,
          documentOwner: aiData.documentOwner,
          author: aiData.author,
          documentType: aiData.documentType,
          concerning: aiData.concerning,
          purpose: aiData.purpose,
          documentDate: aiData.documentDate,
        });
      }

      toast.success("Document uploaded successfully");
      setState("SUCCESS");

      setTimeout(() => {
        onClose();
        resetUploadState();
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
      setState("CONFIRM");
    }
  };

  const selectedFileUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (selectedFileUrl) {
        URL.revokeObjectURL(selectedFileUrl);
      }
    };
  }, [selectedFileUrl]);

  const handleCancel = () => {
    resetUploadState();
  };

  const handleChangeFile = () => {
    resetUploadState();
  };

  const handleModeChange = (newMode: UploadMode) => {
    setMode(newMode);
  };

  if (!isOpen) return null;

  const confirmDefaults =
    aiResult ??
    (selectedFile ? emptyManualDefaults(selectedFile.name) : null);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" />

      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-3xl overflow-y-auto bg-surface shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-default bg-surface px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {mode === "folder"
                ? "Upload Folder"
                : mode === "multiple"
                ? "Bulk Upload Files"
                : "Upload Document"}
            </h2>
            <div className="mt-2 flex items-center gap-2 rounded-2xl bg-[var(--color-bg-secondary)] p-1">
              <button
                type="button"
                onClick={() => handleModeChange("single")}
                className={`rounded px-3 py-1 text-sm font-semibold transition ${
                  mode === "single"
                    ? "bg-primary text-primary-foreground"
                    : "text-secondary hover:bg-[var(--color-bg-tertiary)]"
                }`}
              >
                Single File
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("multiple")}
                className={`rounded px-3 py-1 text-sm font-semibold transition ${
                  mode === "multiple"
                    ? "bg-primary text-primary-foreground"
                    : "text-secondary hover:bg-[var(--color-bg-tertiary)]"
                }`}
              >
                Multiple Files
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("folder")}
                className={`rounded px-3 py-1 text-sm font-semibold transition ${
                  mode === "folder"
                    ? "bg-primary text-primary-foreground"
                    : "text-secondary hover:bg-[var(--color-bg-tertiary)]"
                }`}
              >
                Upload Folder
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 hover:bg-[var(--color-bg-secondary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {mode === "folder" ? (
            <FolderUploadDrawer
              embedded
              parentFolderId={effectiveFolderId}
              onClose={() => {
                handleModeChange("single");
                onClose();
              }}
            />
          ) : null}

          {mode === "multiple" ? (
            <BulkUploadDrawer
              embedded
              onClose={() => {
                handleModeChange("single");
                onClose();
              }}
            />
          ) : null}

          {state === "IDLE" && mode === "single" ? (
            <div className="space-y-4">
              <p className="text-sm text-secondary">
                Upload a PDF, Word, Excel, CSV, or image file. Choose AI analysis or save manually.
              </p>
              <DropZone onFileSelected={handleFileSelected} selectedFile={selectedFile} />
            </div>
          ) : null}

          {state === "SELECTING_MODE" && selectedFile && mode === "single" ? (
            <ModeSelector
              fileName={selectedFile.name}
              fileType={selectedFile.type}
              onSelect={handleModeSelect}
              onBack={handleChangeFile}
            />
          ) : null}

          {state === "PROCESSING" && mode === "single" ? (
            <div>
              <p className="mb-6 text-sm text-secondary">
                Please wait while we process your document...
              </p>
              <ProcessingState
                currentStep={currentStep}
                isComplete={currentStep > 2}
                fileType={selectedFile?.type ?? ""}
                fileName={selectedFile?.name}
              />
            </div>
          ) : null}

          {state === "CONFIRM" && confirmDefaults && mode === "single" ? (
            <div className="space-y-6">
              <div className="rounded border border-default bg-surface p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Selected file</p>
                    <p className="truncate text-sm text-secondary">{selectedFile?.name}</p>
                    <p className="text-xs text-secondary">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : "No file selected"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedFileUrl ? (
                      <a
                        href={selectedFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded border border-default bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
                      >
                        Preview
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleChangeFile}
                      className="inline-flex rounded border border-default bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
                    >
                      Change file
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-6 text-sm text-secondary">
                  {processingMode === "manual"
                    ? "Enter a title and choose a folder to save this document."
                    : "Please review and edit the extracted information below:"}
                </p>
                <ConfirmDocumentForm
                  mode={processingMode}
                  defaultValues={confirmDefaults}
                  defaultFolderId={effectiveFolderId}
                  onConfirm={handleConfirmDocument}
                  onCancel={handleCancel}
                  isLoading={createDocument.isLoading || confirmDocument.isLoading}
                />
              </div>
            </div>
          ) : null}

          {state === "SUCCESS" && mode === "single" ? (
            <div className="space-y-4 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Upload Complete</h3>
              <p className="text-sm text-secondary">
                Your document has been successfully uploaded
                {processingMode === "manual" ? "." : " and categorized."}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
