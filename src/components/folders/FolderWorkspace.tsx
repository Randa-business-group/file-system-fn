"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  FolderOpen,
  FolderPlus,
  Lock,
  Plus,
  Share2,
  Upload as UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/folders/Breadcrumb";
import { DocumentCard } from "@/components/folders/DocumentCard";
import { FolderCard } from "@/components/folders/FolderCard";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { ShareModal } from "@/components/sharing/ShareModal";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { SortBar } from "@/components/ui/SortBar";
import { useDashboard } from "@/lib/dashboard-context";
import { useDeleteDocument, useUpdateDocument } from "@/lib/hooks/useDocuments";
import {
  useCreateFolder,
  useDeleteFolder,
  useGetFolderContents,
  useGetRootFolders,
  useUpdateFolder,
} from "@/lib/hooks/useFolders";
import type { AuthUser } from "@/types/auth";
import type { SortOption } from "@/types/document";
import { FolderScopeFields } from "@/components/folders/FolderScopeFields";
import {
  ALL_SCOPE_VALUE,
  toScopeApiValue,
} from "@/lib/shared-scope-utils";
import {
  buildFolderQueryString,
  isFolderBrowserPath,
  writeStoredFolderSlug,
} from "@/lib/folder-navigation";
import { Role } from "@/types/enum";

interface FolderWorkspaceProps {
  title: string;
  description: string;
  currentUser: AuthUser;
  /** From server searchParams on first paint (refresh-safe) */
  initialFolderSlug?: string | null;
  onlyMine?: boolean;
  /** Company-wide browse: view and download only */
  readOnly?: boolean;
}

import { getFileTypeFromName } from "@/lib/upload-file-types";

const NEW_FOLDER_ID = "pending-new-folder";

export function FolderWorkspace({
  title,
  description,
  currentUser,
  initialFolderSlug = null,
  onlyMine = false,
  readOnly = false,
}: FolderWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFolderSlug = useMemo(() => {
    if (!isFolderBrowserPath(pathname)) {
      return null;
    }

    return searchParams.get("folder") ?? initialFolderSlug ?? null;
  }, [initialFolderSlug, pathname, searchParams]);
  const [pendingFolderId, setPendingFolderId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<{
    documentId?: string;
    documentName?: string;
    folderId?: string;
    folderName?: string;
  } | null>(null);
  const [folderBranchId, setFolderBranchId] = useState(ALL_SCOPE_VALUE);
  const [folderDepartmentId, setFolderDepartmentId] = useState(ALL_SCOPE_VALUE);
  const isOwner = currentUser.role === Role.OWNER;

  const updateFolderSlug = useCallback(
    (slug: string | null) => {
      writeStoredFolderSlug(pathname, slug);

      router.replace(buildFolderQueryString(pathname, slug), { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    if (!isFolderBrowserPath(pathname)) {
      return;
    }

    writeStoredFolderSlug(pathname, currentFolderSlug);
  }, [currentFolderSlug, pathname]);
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const { openUpload, setUploadFolderId } = useDashboard();

  const {
    folders: rootFolders,
    isLoading: isRootLoading,
    isError: isRootError,
  } = useGetRootFolders({ mine: onlyMine });
  const {
    folderContents,
    isLoading: isContentsLoading,
    isError: isContentsError,
  } = useGetFolderContents(currentFolderSlug, { mine: onlyMine });

  const { mutate: createFolder } = useCreateFolder();
  const { mutate: updateFolder } = useUpdateFolder();
  const { mutate: deleteFolder } = useDeleteFolder();
  const { mutate: updateDocument } = useUpdateDocument();
  const { mutate: deleteDocument } = useDeleteDocument();

  const isLoading = currentFolderSlug ? isContentsLoading : isRootLoading;
  const isError = currentFolderSlug ? isContentsError : isRootError;

  useEffect(() => {
    if (
      currentFolderSlug &&
      !isContentsLoading &&
      isContentsError &&
      isFolderBrowserPath(pathname)
    ) {
      updateFolderSlug(null);
    }
  }, [
    currentFolderSlug,
    isContentsError,
    isContentsLoading,
    pathname,
    updateFolderSlug,
  ]);
  const showDepartmentColumn = currentUser.role === Role.OWNER;
  const isInFolder = currentFolderSlug !== null;
  const currentFolderDbId = folderContents?.folder?.id ?? null;
  const canManage = onlyMine && !readOnly;

  const breadcrumbPath = useMemo(() => {
    const rootItem = { id: "root", name: title };

    if (!currentFolderSlug) {
      return [rootItem];
    }

    return [
      rootItem,
      ...(folderContents?.breadcrumb ?? []).map((item) => ({
        id: item.slug,
        name: item.name,
      })),
    ];
  }, [currentFolderSlug, folderContents?.breadcrumb, title]);

  const currentFolderName =
    breadcrumbPath[breadcrumbPath.length - 1]?.name ?? title;
  const folders = useMemo(
    () => (currentFolderSlug ? (folderContents?.children ?? []) : rootFolders),
    [currentFolderSlug, folderContents?.children, rootFolders],
  );
  const documents = useMemo(
    () => (currentFolderSlug ? (folderContents?.documents ?? []) : []),
    [currentFolderSlug, folderContents?.documents],
  );

  const placeholderFolder = useMemo(
    () =>
      pendingFolderId
        ? {
            id: NEW_FOLDER_ID,
            name: "New Folder",
            slug: "new-folder",
            parentId: currentFolderDbId,
            organizationId: currentUser.organizationId,
            itemCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: { id: currentUser.id, name: currentUser.name },
          }
        : null,
    [pendingFolderId, currentFolderDbId, currentUser.organizationId, currentUser.id, currentUser.name],
  );

  const visibleFolders = useMemo(
    () => (placeholderFolder ? [placeholderFolder, ...folders] : folders),
    [placeholderFolder, folders],
  );
  const sortedFolders = useMemo(() => {
    const items = [...visibleFolders];

    if (sortBy === "name_asc" || sortBy === "name_desc") {
      items.sort((left, right) => left.name.localeCompare(right.name));
      if (sortBy === "name_desc") {
        items.reverse();
      }
      return items;
    }

    items.sort(
      (left, right) =>
        new Date(left.createdAt ?? left.updatedAt).getTime() -
        new Date(right.createdAt ?? right.updatedAt).getTime(),
    );

    if (sortBy === "date_desc") {
      items.reverse();
    }

    return items;
  }, [sortBy, visibleFolders]);
  const sortedDocuments = useMemo(() => {
    const items = [...documents];

    if (sortBy === "name_asc" || sortBy === "name_desc") {
      items.sort((left, right) => left.fileName.localeCompare(right.fileName));
      if (sortBy === "name_desc") {
        items.reverse();
      }
      return items;
    }

    items.sort(
      (left, right) =>
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime(),
    );

    if (sortBy === "date_desc") {
      items.reverse();
    }

    return items;
  }, [documents, sortBy]);
  const hasContent = visibleFolders.length > 0 || documents.length > 0;

  useEffect(() => {
    setUploadFolderId(currentFolderDbId);
  }, [currentFolderDbId, setUploadFolderId]);

  const handleUploadDocument = (folderSlug?: string | null) => {
    if (!folderSlug) {
      openUpload(currentFolderDbId);
      return;
    }

    const match =
      folders.find((folder) => folder.slug === folderSlug) ??
      (folderContents?.children ?? []).find((folder) => folder.slug === folderSlug);

    openUpload(match?.id ?? currentFolderDbId);
  };

  const handleNavigateToFolder = (folderSlug: string) => {
    updateFolderSlug(folderSlug === "root" ? null : folderSlug);
  };

  const handleOpenFolder = (folderSlug: string) => {
    if (pendingFolderId) {
      return;
    }

    updateFolderSlug(folderSlug);
  };

  const handleStartNewFolder = () => {
    if (pendingFolderId) {
      return;
    }

    setFolderBranchId(ALL_SCOPE_VALUE);
    setFolderDepartmentId(ALL_SCOPE_VALUE);
    setPendingFolderId(NEW_FOLDER_ID);
  };

  const showRootFolderScope =
    Boolean(pendingFolderId) && isOwner && !currentFolderDbId;

  const handleCreateFolder = (name: string) => {
    createFolder(
      {
        name,
        parentId: currentFolderDbId,
        ...(showRootFolderScope
          ? {
              branchId: toScopeApiValue(folderBranchId),
              departmentId: toScopeApiValue(folderDepartmentId),
            }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success("Folder created successfully");
          setPendingFolderId(null);
          setFolderBranchId(ALL_SCOPE_VALUE);
          setFolderDepartmentId(ALL_SCOPE_VALUE);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Unable to create folder.",
          );
        },
      },
    );
  };

  const handleRenameFolder = (folderSlug: string, newName: string) => {
    if (folderSlug === pendingFolderId) {
      return;
    }

    updateFolder(
      { slug: folderSlug, data: { name: newName } },
      {
        onSuccess: () => toast.success("Folder renamed successfully"),
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Unable to rename folder.",
          );
        },
      },
    );
  };

  const handleRenameComplete = (folderSlug: string, finalName: string) => {
    if (pendingFolderId) {
      handleCreateFolder(finalName);
    }
  };

  const handleDeleteFolder = (folderSlug: string) => {
    deleteFolder(folderSlug, {
      onSuccess: () => {
        if (currentFolderSlug === folderSlug) {
          updateFolderSlug(null);
        }
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Unable to delete folder.",
        );
      },
    });
  };

  const handleRenameDocument = (documentId: string, newName: string) => {
    updateDocument(
      { id: documentId, data: { title: newName } },
      {
        onSuccess: () => toast.success("Document renamed successfully"),
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to rename document.",
          );
        },
      },
    );
  };

  const handleDeleteDocument = (documentId: string) => {
    deleteDocument(documentId, {
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Unable to delete document.",
        );
      },
    });
  };

  const [selectedDocument, setSelectedDocument] = useState<{
    id?: string | null;
    fileName?: string | null;
    fileUrl?: string | null;
    title?: string | null;
    category?: string | { id: string; name: string } | null;
    folder?: string | { id: string; name: string } | null;
    uploadedBy?: string | { id: string; name: string } | null;
    createdAt?: string | null;
  } | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{
    fileName?: string | null;
    fileUrl?: string | null;
  } | null>(null);

  const handleViewDocument = (documentId: string) => {
    const document = documents.find((item) => item.id === documentId);

    if (!document?.fileUrl) {
      toast.error("This document cannot be opened right now.");
      return;
    }

    setIsDetailsOpen(false);
    setPreviewDocument(document);
  };

  const handleDownloadDocument = (documentId: string) => {
    const document = documents.find((item) => item.id === documentId);

    if (!document?.fileUrl) {
      toast.error("This document cannot be downloaded right now.");
      return;
    }

    const link = window.document.createElement("a");
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const handleOpenDocumentDetails = (documentId: string) => {
    const document = documents.find((item) => item.id === documentId);

    if (!document) {
      toast.error("Document details are not available.");
      return;
    }

    const documentWithFolder = {
      ...document,
      folder:
        document.folder ||
        (currentFolderDbId
          ? { id: currentFolderDbId, name: currentFolderName }
          : undefined),
    };

    setSelectedDocument(documentWithFolder);
    setIsDetailsOpen(true);
  };

  const handleCloseDocumentDetails = () => {
    setIsDetailsOpen(false);
  };

  const handleOpenSelectedDocument = () => {
    if (!selectedDocument?.fileUrl) {
      return;
    }

    setIsDetailsOpen(false);
    setPreviewDocument(selectedDocument);
  };

  const handleDownloadSelectedDocument = () => {
    if (!selectedDocument?.fileUrl) {
      toast.error("This document cannot be downloaded right now.");
      return;
    }

    const link = window.document.createElement("a");
    link.href = selectedDocument.fileUrl;
    link.download = selectedDocument.fileName ?? 'document.pdf';
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const itemCountLabel = `${visibleFolders.length + documents.length} ${
    visibleFolders.length + documents.length === 1 ? "item" : "items"
  }`;

  const tableGridColumns = showDepartmentColumn
    ? "grid-cols-[minmax(280px,2fr)_140px_140px_160px_minmax(120px,1fr)_120px]"
    : "grid-cols-[minmax(280px,2fr)_140px_140px_minmax(120px,1fr)_120px]";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-secondary">
          {description}
        </p>
        {readOnly ? (
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-default bg-surface px-3 py-1.5 text-xs font-medium text-secondary">
            <Lock className="h-3.5 w-3.5" />
            View only
          </span>
        ) : null}
        {canManage ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => handleUploadDocument()}
              className="inline-flex items-center justify-center gap-2 rounded border border-default bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
            >
              <UploadIcon className="h-4 w-4" />
              Upload file
            </button>
            <button
              type="button"
              onClick={handleStartNewFolder}
              className="inline-flex items-center justify-center gap-2 rounded  bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" />
              New folder
            </button>
          </div>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-2xl border border-default bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-default bg-[var(--color-bg-secondary)]/60 px-4 py-3 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 rounded-xl border border-default/80 bg-surface px-3 py-2.5">
            <Breadcrumb
              path={breadcrumbPath}
              onNavigate={handleNavigateToFolder}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-default bg-surface px-3 py-1 text-xs font-medium text-secondary">
              {itemCountLabel}
            </span>
            <span className="rounded-full border border-default bg-surface px-3 py-1 text-xs font-medium text-secondary">
              {isInFolder ? currentFolderName : "Root"}
            </span>
            {isInFolder && currentFolderDbId && !readOnly ? (
              <button
                type="button"
                onClick={() =>
                  setShareTarget({
                    folderId: currentFolderDbId,
                    folderName: currentFolderName,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-default bg-surface px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share folder
              </button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingSkeleton key={index} height={64} rounded="1rem" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6">
            <EmptyState
              title="Unable to load folders"
              description="Please refresh the page or try again later."
              actionLabel="Reload"
              onAction={() => window.location.reload()}
            />
          </div>
        ) : hasContent || showRootFolderScope ? (
          <div className="overflow-x-auto">
            <div className="min-w-[960px]">
              {showRootFolderScope ? (
                <div className="border-b border-default px-4 py-4 sm:px-5">
                  <FolderScopeFields
                    branchId={folderBranchId}
                    departmentId={folderDepartmentId}
                    onBranchChange={setFolderBranchId}
                    onDepartmentChange={setFolderDepartmentId}
                  />
                </div>
              ) : null}
              <div className="border-b border-default px-4 py-3 sm:px-5">
                <SortBar sortBy={sortBy} onChange={setSortBy} />
              </div>

              <div
                className={`grid ${tableGridColumns} gap-3 border-b border-default bg-[var(--color-bg-secondary)]/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-secondary sm:px-5`}
              >
                <span>Name</span>
                <span>Modified</span>
                <span>Type</span>
                {showDepartmentColumn ? <span>Department</span> : null}
                <span>Details</span>
                <span className="text-right">
                  {readOnly ? "Open" : "Actions"}
                </span>
              </div>

              {sortedFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onOpen={handleOpenFolder}
                  onRename={canManage ? handleRenameFolder : undefined}
                  onRenameComplete={canManage ? handleRenameComplete : undefined}
                  onDelete={canManage ? handleDeleteFolder : undefined}
                  onUpload={canManage ? handleUploadDocument : undefined}
                  isOwner={canManage}
                  readOnly={readOnly}
                  startInRenameMode={canManage && folder.id === pendingFolderId}
                  showDepartmentColumn={showDepartmentColumn}
                />
              ))}

              {sortedDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={{
                    ...document,
                    category:
                      typeof document.category === "string"
                        ? document.category
                        : document.category?.name,
                  }}
                  onDelete={canManage ? handleDeleteDocument : undefined}
                  onView={handleViewDocument}
                  onDetails={handleOpenDocumentDetails}
                  onDownload={handleDownloadDocument}
                  onRename={canManage ? handleRenameDocument : undefined}
                  onShare={
                    !readOnly
                      ? (documentId, documentName) =>
                          setShareTarget({ documentId, documentName })
                      : undefined
                  }
                  isOwner={canManage}
                  readOnly={readOnly}
                  showDepartmentColumn={showDepartmentColumn}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-10">
            {canManage ? (
              <EmptyState
                title={
                  isInFolder ? "This folder is empty" : "No folders or files yet"
                }
                description={
                  isInFolder
                    ? "Create a subfolder or upload documents directly here."
                    : "Start with a folder, then add files as you go."
                }
                actionLabel={isInFolder ? "Upload file" : "Create folder"}
                actionIcon={isInFolder ? UploadIcon : FolderPlus}
                onAction={
                  isInFolder ? () => handleUploadDocument() : handleStartNewFolder
                }
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-default bg-[var(--color-bg-secondary)]/50 px-6 py-14 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-subtle">
                  <FolderOpen className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {isInFolder ? "This folder is empty" : "No folders or files yet"}
                </h2>
                <p className="mt-2 max-w-sm text-sm text-secondary">
                  {readOnly
                    ? "Nothing has been added here yet. Check back later or browse another folder."
                    : "There is no content to display."}
                </p>
                {readOnly ? (
                  <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-secondary">
                    <Eye className="h-3.5 w-3.5" />
                    View and download only on this page
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </section>

      <DocumentDetails
        key={selectedDocument?.id ?? 'no-document'}
        document={selectedDocument}
        isOpen={isDetailsOpen}
        onClose={handleCloseDocumentDetails}
        onOpen={handleOpenSelectedDocument}
        onDownload={handleDownloadSelectedDocument}
        readOnly={readOnly}
      />

      <DocumentPreview
        isOpen={Boolean(previewDocument?.fileUrl)}
        onClose={() => setPreviewDocument(null)}
        fileUrl={previewDocument?.fileUrl ?? ""}
        fileName={previewDocument?.fileName ?? ""}
        fileType={previewDocument?.fileName ? getFileTypeFromName(previewDocument.fileName) : "application/octet-stream"}
      />

      <ShareModal
        isOpen={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        documentId={shareTarget?.documentId}
        folderId={shareTarget?.folderId}
        documentName={shareTarget?.documentName ?? shareTarget?.folderName}
      />
    </div>
  );
}
