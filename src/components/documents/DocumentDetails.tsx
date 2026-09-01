"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Folder,
  User,
  CalendarDays,
  Tag,
  FileSearch,
  Info,
  Clock,
  X,
  UploadCloud,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/api-client";
import { AppSelect } from "@/components/ui/AppSelect";
import { uploadApi } from "@/api/upload.api";
import { useCreateCategory, useGetCategories } from "@/lib/hooks/useCategories";
import { useCreateFolder, useGetRootFolders } from "@/lib/hooks/useFolders";
import { useProcessDocument, useUpdateDocument } from "@/lib/hooks/useDocuments";
import { extractTextFromFile } from "@/lib/extract-text";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { getDocumentFileMeta } from "@/lib/upload-file-types";
import type { Document, UpdateDocumentInput } from "@/types/document";

type NullableId = { id?: string | null; name?: string | null };

type NullablePartial<T> = {
  [P in keyof T]?: T[P] | null;
};

type DocumentDetailsModel = Omit<
  NullablePartial<Document>,
  "category" | "folder" | "uploadedBy"
> & {
  category?: string | NullableId | null;
  folder?: string | NullableId | null;
  uploadedBy?: string | NullableId | null;
};

interface DocumentDetailsProps {
  document?: DocumentDetailsModel | null;
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onDownload?: () => void;
  isLoading?: boolean;
  /** View-only: no edit, move folder, or save */
  readOnly?: boolean;
}

function getUploaderName(uploadedBy?: string | NullableId | null) {
  if (!uploadedBy) return "Unknown";
  const name =
    typeof uploadedBy === "string" ? uploadedBy : (uploadedBy.name ?? "");
  return name?.trim() || "Unknown";
}

function getFolderName(folder?: string | NullableId | null) {
  if (!folder) return "Unassigned";
  if (typeof folder === "string") return folder;
  return folder.name?.trim() || "Unassigned";
}

function getCategoryName(category?: string | NullableId | null) {
  if (!category) return "Uncategorized";
  if (typeof category === "string") return category;
  return category.name?.trim() || "Uncategorized";
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentDetails({
  document,
  isOpen,
  onClose,
  onOpen,
  onDownload,
  isLoading = false,
  readOnly = false,
}: DocumentDetailsProps) {
  const portalTarget =
    typeof window !== "undefined" ? window.document.body : null;
  const updateDocument = useUpdateDocument();
  const processDocument = useProcessDocument();
  const createCategory = useCreateCategory();
  const createFolder = useCreateFolder();
  const { categories, isLoading: isCategoriesLoading } = useGetCategories(
    { page: 1, limit: 100 },
    { enabled: !readOnly },
  );
  const { folders, isLoading: isFoldersLoading } = useGetRootFolders({
    mine: true,
    enabled: !readOnly,
  });

  const [formState, setFormState] = useState<UpdateDocumentInput>(() => ({
    title: document?.title ?? document?.fileName ?? "",
    documentOwner: document?.documentOwner ?? undefined,
    author: document?.author ?? undefined,
    documentType: document?.documentType ?? undefined,
    concerning: document?.concerning ?? undefined,
    purpose: document?.purpose ?? undefined,
    documentDate: document?.documentDate ?? undefined,
    summary: document?.summary ?? undefined,
    categoryId:
      document?.category && typeof document.category === "object" && document.category.id != null
        ? document.category.id
        : undefined,
    folderId:
      document?.folder && typeof document.folder === "object" && document.folder.id != null
        ? document.folder.id
        : undefined,
  }));
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacementFileName, setReplacementFileName] = useState<string | null>(
    null,
  );
  const [replacementFileSize, setReplacementFileSize] = useState<number | null>(
    null,
  );
  const [replacementExtractedText, setReplacementExtractedText] = useState("");
  const [replacementCategoryName, setReplacementCategoryName] = useState<
    string | null
  >(null);
  const [isProcessingReplacement, setIsProcessingReplacement] = useState(false);

  const [newFolderName, setNewFolderName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!document) {
      return;
    }

    const nextState = {
      title: document.title ?? document.fileName ?? "",
      documentOwner: document.documentOwner ?? undefined,
      author: document.author ?? undefined,
      documentType: document.documentType ?? undefined,
      concerning: document.concerning ?? undefined,
      purpose: document.purpose ?? undefined,
      documentDate: document.documentDate ?? undefined,
      summary: document.summary ?? undefined,
      categoryId:
        document.category && typeof document.category === "object" &&
        document.category.id != null
          ? document.category.id
          : undefined,
      folderId:
        document.folder && typeof document.folder === "object" &&
        document.folder.id != null
          ? document.folder.id
          : undefined,
    } as UpdateDocumentInput;

    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) return;
      setFormState(nextState);
      setReplacementFile(null);
      setReplacementFileName(null);
      setReplacementFileSize(null);
      setReplacementExtractedText("");
      setReplacementCategoryName(null);
      setHasChanges(false);
    });

    return () => {
      isActive = false;
    };
  }, [document]);

  if (!isOpen || !portalTarget) return null;

  const fileMeta = getDocumentFileMeta(document?.fileName ?? "");

  const handleFieldChange = <K extends keyof UpdateDocumentInput>(
    field: K,
    value: UpdateDocumentInput[K],
  ) => {
    if (readOnly) return;
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleReplacementFileChange = async (file: File | null) => {
    if (readOnly || !file) return;

    setIsProcessingReplacement(true);

    try {
      const text = await extractTextFromFile(file);
      const aiResult = await processDocument.mutateAsync(text);
      const matchedCategory = categories.find(
        (category) =>
          category.name.toLowerCase() === aiResult.category?.toLowerCase(),
      );

      setFormState((current) => ({
        ...current,
        title: aiResult.title ?? current.title,
        documentOwner: aiResult.documentOwner ?? undefined,
        author: aiResult.author ?? undefined,
        documentType: aiResult.documentType ?? undefined,
        concerning: aiResult.concerning ?? undefined,
        purpose: aiResult.purpose ?? undefined,
        documentDate: aiResult.documentDate ?? undefined,
        summary: aiResult.summary ?? undefined,
        categoryId: matchedCategory?.id ?? undefined,
      }));
      setReplacementFile(file);
      setReplacementFileName(file.name);
      setReplacementFileSize(file.size);
      setReplacementExtractedText(text);
      setReplacementCategoryName(
        matchedCategory ? null : (aiResult.category?.trim() || null),
      );
      setHasChanges(true);
      toast.success("Replacement analyzed. Review the updated fields, then save.");

    } catch {
      toast.error("Unable to analyze replacement file. Please try again.");
      setReplacementFile(null);
      setReplacementFileName(null);
      setReplacementFileSize(null);
      setReplacementExtractedText("");
      setReplacementCategoryName(null);
    } finally {
      setIsProcessingReplacement(false);
    }
  };

  const hasFormEdits = (state: UpdateDocumentInput) => {
    if (!document) return false;

    return (
      state.title !== (document.title ?? document.fileName ?? "") ||
      state.documentOwner !== document.documentOwner ||
      state.author !== document.author ||
      state.documentType !== document.documentType ||
      state.concerning !== document.concerning ||
      state.purpose !== document.purpose ||
      state.documentDate !== document.documentDate ||
      state.summary !== document.summary ||
      state.categoryId !==
        (typeof document.category === "object" ? document.category?.id : undefined) ||
      state.folderId !==
        (typeof document.folder === "object" ? document.folder?.id : undefined)
    );
  };

  const clearReplacementFile = () => {
    setReplacementFile(null);
    setReplacementFileName(null);
    setReplacementFileSize(null);
    setReplacementExtractedText("");
    setReplacementCategoryName(null);
    setHasChanges(hasFormEdits(formState));
  };

  const handleCreateFolder = async (name: string) => {
    if (!name.trim()) return;
    try {
      const folder = await createFolder.mutateAsync({ name });
      setFormState((current) => ({
        ...current,
        folderId: folder.id,
      }));
      setNewFolderName("");
      setIsCreatingFolder(false);
      setHasChanges(true);
      toast.success("Folder created and selected.");
    } catch {
      toast.error("Unable to create folder.");
    }
  };

  const handleCreateCategory = async (name: string) => {
    if (!name.trim()) return;
    try {
      const category = await createCategory.mutateAsync({ name });
      setFormState((current) => ({
        ...current,
        categoryId: category.id,
      }));
      setNewCategoryName("");
      setIsCreatingCategory(false);
      setHasChanges(true);
      toast.success("Category created and selected.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to create category."),
      );
    }
  };

  const handleSave = async () => {
    if (readOnly) return;
    if (!document) return;

    const updatePayload: UpdateDocumentInput = {};
    if (formState.title !== (document.title ?? document.fileName ?? "")) {
      updatePayload.title = formState.title;
    }
    if (formState.documentOwner !== document.documentOwner) {
      updatePayload.documentOwner = formState.documentOwner ?? undefined;
    }
    if (formState.author !== document.author) {
      updatePayload.author = formState.author ?? undefined;
    }
    if (formState.documentType !== document.documentType) {
      updatePayload.documentType = formState.documentType ?? undefined;
    }
    if (formState.concerning !== document.concerning) {
      updatePayload.concerning = formState.concerning ?? undefined;
    }
    if (formState.purpose !== document.purpose) {
      updatePayload.purpose = formState.purpose ?? undefined;
    }
    if (formState.documentDate !== document.documentDate) {
      updatePayload.documentDate = formState.documentDate ?? undefined;
    }
    if (formState.summary !== document.summary) {
      updatePayload.summary = formState.summary ?? undefined;
    }
    if (
      formState.categoryId !==
      (typeof document.category === "object" ? document?.category?.id : undefined)
    ) {
      updatePayload.categoryId = formState.categoryId;
    }
    if (
      formState.folderId !==
      (typeof document.folder === "object" ? document?.folder?.id : undefined)
    ) {
      updatePayload.folderId = formState.folderId;
    }

    if (replacementFile) {
      updatePayload.title = formState.title;
      updatePayload.documentOwner = formState.documentOwner ?? undefined;
      updatePayload.author = formState.author ?? undefined;
      updatePayload.documentType = formState.documentType ?? undefined;
      updatePayload.concerning = formState.concerning ?? undefined;
      updatePayload.purpose = formState.purpose ?? undefined;
      updatePayload.documentDate = formState.documentDate ?? undefined;
      updatePayload.summary = formState.summary ?? undefined;
      updatePayload.categoryId = formState.categoryId;
      updatePayload.category = replacementCategoryName ?? undefined;
      updatePayload.extractedText = replacementExtractedText;
      updatePayload.fileName = replacementFile.name;
    }

    if (Object.keys(updatePayload).length === 0) {
      toast("No changes to save.");
      return;
    }

    try {
      if (replacementFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", replacementFile);
        const uploadResult = await uploadApi.uploadFile(uploadFormData);
        updatePayload.fileUrl = uploadResult.url;
      }

      await updateDocument.mutateAsync({
        id: document.id as string,
        data: updatePayload,
      });

      toast.success(
        replacementFile
          ? "Document replaced with the analyzed file."
          : "Document details updated.",
      );
      setReplacementFile(null);
      setReplacementFileName(null);
      setReplacementFileSize(null);
      setReplacementExtractedText("");
      setReplacementCategoryName(null);
      setHasChanges(false);
    } catch {
      toast.error("Unable to save document details.");
    }
  };

  const dateValue = formState.documentDate
    ? formState.documentDate.slice(0, 10)
    : "";

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close document details backdrop"
        className="fixed inset-0 z-[90] bg-black/50"
        onClick={onClose}
      />

      <aside className="fixed right-0 top-0 z-[91] h-screen w-full max-w-[720px] overflow-y-auto border-l border-black/10 bg-surface shadow-[var(--shadow-xl)]">
        <div className="sticky top-0 z-[92] flex justify-end bg-surface px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
            aria-label="Close document details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-5 pb-5 pt-0 sm:px-7 sm:pb-7">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 w-3/4 rounded-xl bg-surface" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="h-20 rounded bg-[var(--color-bg-secondary)]"
                  />
                ))}
              </div>
            </div>
          ) : !document ? (
            <div className="rounded border border-default bg-[var(--color-bg-secondary)] p-6 text-sm text-secondary">
              Document details are not available.
            </div>
          ) : (
            <div className="space-y-6">
              {readOnly ? (
                <p className="rounded-lg border border-default bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-secondary">
                  View only on this page. To edit or move this file, use My Folders.
                </p>
              ) : null}

              <div className="rounded border border-default bg-surface p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <DocumentTypeIcon fileName={document.fileName ?? ""} size="lg" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.24em] text-secondary">
                      {fileMeta.typeLabel}
                    </p>
                    {readOnly ? (
                      <h2 className="truncate text-xl font-semibold text-foreground">
                        {formState.title ?? document.fileName ?? "Untitled"}
                      </h2>
                    ) : (
                      <input
                        value={formState.title ?? document.fileName ?? ""}
                        onChange={(event) =>
                          handleFieldChange("title", event.target.value)
                        }
                        className="w-full truncate border-none bg-transparent px-0 text-xl font-semibold text-foreground outline-none ring-0 focus:ring-0"
                        placeholder={document.fileName ?? ""}
                      />
                    )}
                    <p className="truncate text-sm text-secondary">
                      {document.fileName}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-secondary">Uploaded by</p>
                    <p className="text-base font-medium text-foreground">
                      {getUploaderName(document.uploadedBy)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onOpen}
                      disabled={!onOpen}
                      className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={onDownload}
                      disabled={!onDownload}
                      className="inline-flex items-center gap-2 rounded border border-default bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {!readOnly ? (
                <div className="rounded border border-default bg-surface p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-secondary">
                        <RefreshCw className="h-4 w-4" />
                        Replace file
                      </div>
                      <p className="mt-1 text-sm text-secondary">
                        Choose a file to analyze it and fill these fields before replacing.
                      </p>
                    </div>

                    {!replacementFile ? (
                      <label className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="sr-only"
                          onChange={(event) =>
                            handleReplacementFileChange(
                              event.target.files?.[0] ?? null,
                            )
                          }
                          disabled={isProcessingReplacement}
                        />
                        <UploadCloud className="h-4 w-4" />
                        {isProcessingReplacement ? "Analyzing" : "Choose file"}
                      </label>
                    ) : null}
                  </div>

                  {replacementFile ? (
                    <div className="mt-3 flex flex-col gap-3 rounded bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded bg-primary/10 text-primary">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {replacementFileName}
                          </p>
                          <p className="text-xs text-secondary">
                            Analyzed and ready on save
                            {replacementFileSize
                              ? ` - ${formatFileSize(replacementFileSize)}`
                              : ""}
                          </p>
                          {replacementCategoryName ? (
                            <p className="mt-1 text-xs text-amber-700">
                              New category on save: {replacementCategoryName}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <label className="inline-flex cursor-pointer items-center justify-center rounded border border-default bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="sr-only"
                            onChange={(event) =>
                              handleReplacementFileChange(
                                event.target.files?.[0] ?? null,
                              )
                            }
                            disabled={isProcessingReplacement}
                          />
                          Change
                        </label>
                        <button
                          type="button"
                          onClick={clearReplacementFile}
                          disabled={isProcessingReplacement}
                          className="rounded border border-default bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded border border-default bg-surface p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                    <Folder className="h-4 w-4" />
                    Folder
                  </div>
                  {readOnly ? (
                    <p className="mt-3 text-sm font-medium text-foreground">
                      {getFolderName(document.folder)}
                    </p>
                  ) : (
                    <>
                      <AppSelect
                        className="mt-3"
                        value={isCreatingFolder ? "__add__" : (formState.folderId ?? "")}
                        onValueChange={(value) => {
                          if (value === "__add__") {
                            setIsCreatingFolder(true);
                          } else {
                            handleFieldChange("folderId", value || undefined);
                            setIsCreatingFolder(false);
                          }
                        }}
                        disabled={isFoldersLoading}
                        placeholder="Unassigned"
                        triggerClassName="rounded-lg bg-background"
                        options={[
                          { value: "", label: "Unassigned" },
                          ...folders.map((folderOption) => ({
                            value: folderOption.id,
                            label: folderOption.name,
                          })),
                          { value: "__add__", label: "+ Add new folder" },
                        ]}
                      />
                      {isCreatingFolder ? (
                        <div className="mt-3 flex flex-col gap-3">
                          <input
                            value={newFolderName}
                            onChange={(event) => setNewFolderName(event.target.value)}
                            placeholder="New folder name"
                            className="w-full rounded-lg border border-default bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateFolder(newFolderName);
                              if (e.key === "Escape") {
                                setIsCreatingFolder(false);
                                setNewFolderName("");
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void handleCreateFolder(newFolderName)}
                              disabled={!newFolderName.trim() || createFolder.isLoading}
                              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {createFolder.isLoading ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingFolder(false);
                                setNewFolderName("");
                              }}
                              disabled={createFolder.isLoading}
                              className="flex-1 rounded-lg border border-default px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
                <div className="rounded border border-default bg-surface p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                    <Tag className="h-4 w-4" />
                    Category
                  </div>
                  {readOnly ? (
                    <p className="mt-3 text-sm font-medium text-foreground">
                      {getCategoryName(document.category)}
                    </p>
                  ) : (
                    <>
                      <AppSelect
                        className="mt-3"
                        value={isCreatingCategory ? "__add__" : (formState.categoryId ?? "")}
                        onValueChange={(value) => {
                          if (value === "__add__") {
                            setIsCreatingCategory(true);
                          } else {
                            handleFieldChange("categoryId", value || undefined);
                            setIsCreatingCategory(false);
                          }
                        }}
                        disabled={isCategoriesLoading}
                        placeholder="Uncategorized"
                        triggerClassName="rounded-lg bg-background"
                        options={[
                          { value: "", label: "Uncategorized" },
                          ...categories.map((categoryOption) => ({
                            value: categoryOption.id,
                            label: categoryOption.name,
                          })),
                          { value: "__add__", label: "+ Add new category" },
                        ]}
                      />
                      {isCreatingCategory ? (
                        <div className="mt-3 flex flex-col gap-3">
                          <input
                            value={newCategoryName}
                            onChange={(event) => setNewCategoryName(event.target.value)}
                            placeholder="New category name"
                            className="w-full rounded-lg border border-default bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateCategory(newCategoryName);
                              if (e.key === "Escape") {
                                setIsCreatingCategory(false);
                                setNewCategoryName("");
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void handleCreateCategory(newCategoryName)}
                              disabled={!newCategoryName.trim() || createCategory.isLoading}
                              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {createCategory.isLoading ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingCategory(false);
                                setNewCategoryName("");
                              }}
                              disabled={createCategory.isLoading}
                              className="flex-1 rounded-lg border border-default px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
                <div className="rounded border border-default bg-surface p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                    <User className="h-4 w-4" />
                    Document owner
                  </div>
                  {readOnly ? (
                    <p className="mt-3 text-sm text-foreground">
                      {formState.documentOwner?.trim() || "Not specified"}
                    </p>
                  ) : (
                    <input
                      value={formState.documentOwner ?? ""}
                      onChange={(event) =>
                        handleFieldChange("documentOwner", event.target.value)
                      }
                      className="mt-3 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="Not specified"
                    />
                  )}
                </div>
                <div className="rounded border border-default bg-surface p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                    <User className="h-4 w-4" />
                    Author
                  </div>
                  {readOnly ? (
                    <p className="mt-3 text-sm text-foreground">
                      {formState.author?.trim() || "Unknown"}
                    </p>
                  ) : (
                    <input
                      value={formState.author ?? ""}
                      onChange={(event) =>
                        handleFieldChange("author", event.target.value)
                      }
                      className="mt-3 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="Unknown"
                    />
                  )}
                </div>
                <div className="rounded border border-default bg-surface p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                    <Info className="h-4 w-4" />
                    Document type
                  </div>
                  {readOnly ? (
                    <p className="mt-3 text-sm text-foreground">
                      {formState.documentType?.trim() || "Not specified"}
                    </p>
                  ) : (
                    <input
                      value={formState.documentType ?? ""}
                      onChange={(event) =>
                        handleFieldChange("documentType", event.target.value)
                      }
                      className="mt-3 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="Not specified"
                    />
                  )}
                </div>
                <div className="rounded border border-default bg-surface p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                    <Info className="h-4 w-4" />
                    Concerning
                  </div>
                  {readOnly ? (
                    <p className="mt-3 text-sm text-foreground">
                      {formState.concerning?.trim() || "Not specified"}
                    </p>
                  ) : (
                    <input
                      value={formState.concerning ?? ""}
                      onChange={(event) =>
                        handleFieldChange("concerning", event.target.value)
                      }
                      className="mt-3 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="Not specified"
                    />
                  )}
                </div>
                <div className="rounded border border-default bg-surface p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                    <FileSearch className="h-4 w-4" />
                    Purpose
                  </div>
                  {readOnly ? (
                    <p className="mt-3 text-sm text-foreground">
                      {formState.purpose?.trim() || "Not specified"}
                    </p>
                  ) : (
                    <input
                      value={formState.purpose ?? ""}
                      onChange={(event) =>
                        handleFieldChange("purpose", event.target.value)
                      }
                      className="mt-3 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="Not specified"
                    />
                  )}
                </div>
                <div className="rounded border border-default bg-surface p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                    <CalendarDays className="h-4 w-4" />
                    Document date
                  </div>
                  {readOnly ? (
                    <p className="mt-3 text-sm text-foreground">
                      {formState.documentDate
                        ? formatDisplayDate(formState.documentDate)
                        : "Not specified"}
                    </p>
                  ) : (
                    <input
                      type="date"
                      value={dateValue}
                      onChange={(event) =>
                        handleFieldChange("documentDate", event.target.value)
                      }
                      className="mt-3 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded border border-default bg-surface p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                    <Clock className="h-4 w-4" />
                    Created
                  </div>
                  <p className="mt-3 text-sm text-foreground">
                    {formatDisplayDate(document.createdAt)}
                  </p>
                </div>
                <div className="rounded border border-default bg-surface p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                    <Clock className="h-4 w-4" />
                    Updated
                  </div>
                  <p className="mt-3 text-sm text-foreground">
                    {formatDisplayDate(document.updatedAt ?? document.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded border border-default bg-surface p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-secondary">
                  <FileSearch className="h-4 w-4" />
                  Summary
                </div>
                {readOnly ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {formState.summary?.trim() || "No summary available."}
                  </p>
                ) : (
                  <textarea
                    value={formState.summary ?? ""}
                    onChange={(event) =>
                      handleFieldChange("summary", event.target.value)
                    }
                    rows={5}
                    className="mt-3 w-full rounded-lg border border-default bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="No summary available."
                  />
                )}
              </div>

              {!readOnly ? (
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (document) {
                        setFormState({
                          title: document.title ?? document.fileName ?? "",
                          documentOwner: document.documentOwner ?? null,
                          author: document.author ?? null,
                          documentType: document.documentType ?? null,
                          concerning: document.concerning ?? null,
                          purpose: document.purpose ?? null,
                          documentDate: document.documentDate ?? null,
                          summary: document.summary ?? "",
                          categoryId:
                            document.category &&
                            typeof document.category === "object" &&
                            document.category.id != null
                              ? document.category.id
                              : undefined,
                          folderId:
                            document.folder &&
                            typeof document.folder === "object" &&
                            document.folder.id != null
                              ? document.folder.id
                              : undefined,
                        });
                        setReplacementFile(null);
                        setReplacementFileName(null);
                        setReplacementFileSize(null);
                        setReplacementExtractedText("");
                        setReplacementCategoryName(null);
                        setHasChanges(false);
                      }
                    }}
                    className="rounded border border-default bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={
                      !hasChanges ||
                      updateDocument.isLoading ||
                      isProcessingReplacement
                    }
                    className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
                  >
                    {updateDocument.isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </aside>

    </>,
    portalTarget,
  );
}
