"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  ExternalLink,
  Eye,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderUp,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/folders/Breadcrumb";
import { DataTable, type ColumnDef, type TableFilter } from "@/components/table/page";
import { DocumentDetails } from "@/components/documents/DocumentDetails";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { ShareModal } from "@/components/sharing/ShareModal";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { EmptyState } from "@/components/ui/EmptyState";
import { SortBar } from "@/components/ui/SortBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { getDocumentFileMeta, getFileTypeFromName } from "@/lib/upload-file-types";
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

const NEW_FOLDER_ID = "pending-new-folder";

export type FolderWorkspaceItem =
  | {
      kind: "folder";
      id: string;
      slug: string;
      name: string;
      itemCount?: number;
      updatedAt?: string;
      createdAt?: string;
      createdBy?: { id: string; name: string };
      department?: { id: string; name: string } | null;
      isPending?: boolean;
    }
  | {
      kind: "document";
      id: string;
      fileName: string;
      name: string;
      fileUrl?: string;
      title?: string | null;
      summary?: string | null;
      category?: string | { id: string; name: string } | null;
      updatedAt?: string;
      createdAt: string;
      uploadedBy: string | { id: string; name: string };
      department?: { id: string; name: string } | null;
    };

function formatFolderItems(itemCount?: number) {
  const count = itemCount ?? 0;
  if (count === 0) return "Empty";
  return count === 1 ? "1 item" : `${count} items`;
}

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
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "folder" | "document";
    id: string;
    slug?: string;
    name: string;
  } | null>(null);

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
            department: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: { id: currentUser.id, name: currentUser.name },
          }
        : null,
    [
      pendingFolderId,
      currentFolderDbId,
      currentUser.organizationId,
      currentUser.id,
      currentUser.name,
    ],
  );

  const visibleFolders = useMemo(
    () => (placeholderFolder ? [placeholderFolder, ...folders] : folders),
    [placeholderFolder, folders],
  );

  const workspaceItems: FolderWorkspaceItem[] = useMemo(() => {
    const folderList: FolderWorkspaceItem[] = visibleFolders.map((folder) => ({
      kind: "folder",
      id: folder.id,
      slug: folder.slug,
      name: folder.name,
      itemCount: folder.itemCount,
      updatedAt: folder.updatedAt,
      createdAt: folder.createdAt,
      createdBy: folder.createdBy,
      department: "department" in folder ? (folder.department as { id: string; name: string } | null | undefined) : null,
      isPending: folder.id === pendingFolderId,
    }));

    const docList: FolderWorkspaceItem[] = documents.map((doc) => ({
      kind: "document",
      id: doc.id,
      fileName: doc.fileName,
      name: doc.title || doc.fileName,
      fileUrl: doc.fileUrl,
      title: doc.title,
      summary: doc.summary,
      category: doc.category,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
      uploadedBy: doc.uploadedBy,
      department: (doc as unknown as { department?: { id: string; name: string } | null })
        .department ?? null,
    }));

    return [...folderList, ...docList];
  }, [visibleFolders, documents, pendingFolderId]);

  const sortedWorkspaceItems = useMemo(() => {
    const items = [...workspaceItems];

    if (sortBy === "name_asc" || sortBy === "name_desc") {
      items.sort((left, right) => {
        if ("isPending" in left && left.isPending) return -1;
        if ("isPending" in right && right.isPending) return 1;

        if (left.kind !== right.kind) {
          return left.kind === "folder" ? -1 : 1;
        }
        return sortBy === "name_asc"
          ? left.name.localeCompare(right.name)
          : right.name.localeCompare(left.name);
      });
      return items;
    }

    items.sort((left, right) => {
      if ("isPending" in left && left.isPending) return -1;
      if ("isPending" in right && right.isPending) return 1;

      if (left.kind !== right.kind) {
        return left.kind === "folder" ? -1 : 1;
      }

      const dateLeft = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const dateRight = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return sortBy === "date_desc" ? dateRight - dateLeft : dateLeft - dateRight;
    });

    return items;
  }, [workspaceItems, sortBy]);

  useEffect(() => {
    setUploadFolderId(currentFolderDbId);
  }, [currentFolderDbId, setUploadFolderId]);

  const handleUploadDocument = useCallback(
    (folderSlug?: string | null) => {
      if (!folderSlug) {
        openUpload(currentFolderDbId);
        return;
      }

      const match =
        folders.find((folder) => folder.slug === folderSlug) ??
        (folderContents?.children ?? []).find((folder) => folder.slug === folderSlug);

      openUpload(match?.id ?? currentFolderDbId);
    },
    [currentFolderDbId, folders, folderContents?.children, openUpload],
  );

  const handleUploadFolder = (folderSlug?: string | null) => {
    if (!folderSlug) {
      openUpload(currentFolderDbId, "folder");
      return;
    }

    const match =
      folders.find((folder) => folder.slug === folderSlug) ??
      (folderContents?.children ?? []).find((folder) => folder.slug === folderSlug);

    openUpload(match?.id ?? currentFolderDbId, "folder");
  };

  const handleNavigateToFolder = (folderSlug: string) => {
    updateFolderSlug(folderSlug === "root" ? null : folderSlug);
  };

  const handleOpenFolder = useCallback(
    (folderSlug: string) => {
      if (pendingFolderId) {
        return;
      }
      updateFolderSlug(folderSlug);
    },
    [pendingFolderId, updateFolderSlug],
  );

  const handleStartNewFolder = () => {
    if (pendingFolderId) {
      return;
    }

    setFolderBranchId(ALL_SCOPE_VALUE);
    setFolderDepartmentId(ALL_SCOPE_VALUE);
    setPendingFolderId(NEW_FOLDER_ID);
    setRenamingId(NEW_FOLDER_ID);
    setRenamingValue("New Folder");
  };

  const showRootFolderScope =
    Boolean(pendingFolderId) && isOwner && !currentFolderDbId;

  const handleCreateFolder = useCallback(
    (name: string) => {
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
    },
    [
      createFolder,
      currentFolderDbId,
      folderBranchId,
      folderDepartmentId,
      showRootFolderScope,
    ],
  );

  const handleRenameFolder = useCallback(
    (folderSlug: string, newName: string) => {
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
    },
    [pendingFolderId, updateFolder],
  );

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

  const handleRenameDocument = useCallback(
    (documentId: string, newName: string) => {
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
    },
    [updateDocument],
  );

  const handleDeleteDocument = (documentId: string) => {
    deleteDocument(documentId, {
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Unable to delete document.",
        );
      },
    });
  };

  // Renaming handlers
  const handleStartRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenamingValue(currentName);
  };

  const handleCancelRename = useCallback(() => {
    if (pendingFolderId) {
      setPendingFolderId(null);
    }
    setRenamingId(null);
    setRenamingValue("");
  }, [pendingFolderId]);

  const handleCommitRename = useCallback(() => {
    if (!renamingId) return;

    const trimmed = renamingValue.trim();
    if (!trimmed) {
      handleCancelRename();
      return;
    }

    if (renamingId === NEW_FOLDER_ID) {
      handleCreateFolder(trimmed);
      setRenamingId(null);
      setRenamingValue("");
      return;
    }

    const targetItem = workspaceItems.find((item) => item.id === renamingId);
    if (targetItem) {
      if (targetItem.kind === "folder") {
        handleRenameFolder(targetItem.slug, trimmed);
      } else {
        handleRenameDocument(targetItem.id, trimmed);
      }
    }

    setRenamingId(null);
    setRenamingValue("");
  }, [
    handleCancelRename,
    handleCreateFolder,
    handleRenameDocument,
    handleRenameFolder,
    renamingId,
    renamingValue,
    workspaceItems,
  ]);

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

  const handleViewDocument = useCallback(
    (documentId: string) => {
      const document = documents.find((item) => item.id === documentId);

      if (!document?.fileUrl) {
        toast.error("This document cannot be opened right now.");
        return;
      }

      setIsDetailsOpen(false);
      setPreviewDocument(document);
    },
    [documents],
  );

  const handleDownloadDocument = useCallback(
    (documentId: string) => {
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
    },
    [documents],
  );

  const handleOpenDocumentDetails = useCallback(
    (documentId: string) => {
      const document = documents.find((item) => item.id === documentId);

      if (!document) {
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
    },
    [currentFolderDbId, currentFolderName, documents],
  );

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
    link.download = selectedDocument.fileName ?? "document.pdf";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const itemCountLabel = `${visibleFolders.length + documents.length} ${
    visibleFolders.length + documents.length === 1 ? "item" : "items"
  }`;

  // Column definitions for DataTable
  const columns: ColumnDef<FolderWorkspaceItem>[] = useMemo(() => {
    const cols: ColumnDef<FolderWorkspaceItem>[] = [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        sortable: true,
        cell: ({ row }) => {
          const isRenamingThis = renamingId === row.id;

          if (row.kind === "folder") {
            return (
              <div
                className="flex min-w-0 items-center gap-3"
                onClick={(e) => isRenamingThis && e.stopPropagation()}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                  <Folder className="h-5 w-5 text-amber-600" />
                </div>

                <div className="min-w-0 flex-1">
                  {isRenamingThis ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCommitRename();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={renamingValue}
                        onChange={(e) => setRenamingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        onBlur={handleCommitRename}
                        className="w-full max-w-[280px] rounded-lg border border-primary bg-surface px-2.5 py-1 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary sm:max-w-[340px]"
                      />
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFolder(row.slug);
                        }}
                        className="block max-w-[280px] truncate text-left font-medium text-foreground transition hover:text-primary sm:max-w-[340px]"
                        title={row.name}
                      >
                        {row.name}
                      </button>
                      <p className="truncate text-xs text-secondary">
                        {formatFolderItems(row.itemCount)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          }

          const fileMeta = getDocumentFileMeta(row.fileName);
          return (
            <div
              className="flex min-w-0 items-center gap-3"
              onClick={(e) => isRenamingThis && e.stopPropagation()}
            >
              <DocumentTypeIcon fileName={row.fileName} size="sm" />

              <div className="min-w-0 flex-1">
                {isRenamingThis ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCommitRename();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={renamingValue}
                      onChange={(e) => setRenamingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") handleCancelRename();
                      }}
                      onBlur={handleCommitRename}
                      className="w-full max-w-[280px] rounded-lg border border-primary bg-surface px-2.5 py-1 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary sm:max-w-[340px]"
                    />
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDocumentDetails(row.id);
                      }}
                      className="block max-w-[280px] truncate text-left font-medium text-foreground transition hover:text-primary sm:max-w-[340px]"
                      title={row.name}
                    >
                      {row.name}
                    </button>
                    <p className="truncate text-xs text-secondary">
                      {fileMeta.typeLabel}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        header: "Modified",
        sortable: true,
        cell: ({ row }) => {
          const rawDate = row.updatedAt || row.createdAt;
          const formatted = rawDate
            ? new Date(rawDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "-";
          return <span className="text-secondary">{formatted}</span>;
        },
      },
      {
        id: "kind",
        accessorKey: "kind",
        header: "Type",
        sortable: true,
        cell: ({ row }) => {
          if (row.kind === "folder") {
            return (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Folder
              </span>
            );
          }
          const categoryName =
            typeof row.category === "string"
              ? row.category
              : row.category?.name ?? "Document";
          return (
            <span className="inline-flex items-center rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-secondary">
              {categoryName}
            </span>
          );
        },
      },
    ];

    if (showDepartmentColumn) {
      cols.push({
        id: "department",
        accessorKey: "department.name",
        header: "Department",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-secondary">
            {row.department?.name || "Company Wide"}
          </span>
        ),
      });
    }

    cols.push(
      {
        id: "details",
        header: "Details",
        cell: ({ row }) => {
          if (row.kind === "folder") {
            return (
              <span className="text-secondary">
                {row.createdBy?.name
                  ? `By ${row.createdBy.name}`
                  : formatFolderItems(row.itemCount)}
              </span>
            );
          }
          const uploadedBy =
            typeof row.uploadedBy === "string"
              ? row.uploadedBy
              : row.uploadedBy?.name ?? "Unknown";
          return <span className="text-secondary">By {uploadedBy}</span>;
        },
      },
      {
        id: "actions",
        header: readOnly ? "Open" : "Actions",
        align: "right",
        cell: ({ row }) => {
          if (row.kind === "folder") {
            if (row.isPending) return null;
            return (
              <div
                className="flex items-center justify-end gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {readOnly ? (
                  <button
                    type="button"
                    onClick={() => handleOpenFolder(row.slug)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-default bg-surface px-3 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)]"
                  >
                    Open
                  </button>
                ) : (
                  <>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleUploadDocument(row.slug)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-default bg-surface px-2.5 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)]"
                      >
                        <UploadIcon className="h-3.5 w-3.5" />
                        Upload
                      </button>
                    )}
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-default text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
                          ariaLabel={`Folder actions for ${row.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[160px]">
                          <DropdownMenuItem
                            onClick={() => handleStartRename(row.id, row.name)}
                          >
                            <Pencil className="h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDeleteTarget({
                                type: "folder",
                                id: row.id,
                                slug: row.slug,
                                name: row.name,
                              })
                            }
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </>
                )}
              </div>
            );
          }

          // Document row actions
          return (
            <div
              className="flex items-center justify-end gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => handleViewDocument(row.id)}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-default bg-surface px-2.5 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)]"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Preview
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-default text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
                  ariaLabel={`Document actions for ${row.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px]">
                  <DropdownMenuItem onClick={() => handleOpenDocumentDetails(row.id)}>
                    <Eye className="h-4 w-4" />
                    Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewDocument(row.id)}>
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadDocument(row.id)}>
                    <Download className="h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  {!readOnly && (
                    <DropdownMenuItem
                      onClick={() =>
                        setShareTarget({
                          documentId: row.id,
                          documentName: row.name,
                        })
                      }
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                  )}
                  {canManage && (
                    <DropdownMenuItem
                      onClick={() => handleStartRename(row.id, row.name)}
                    >
                      <Pencil className="h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                  )}
                  {canManage && (
                    <DropdownMenuItem
                      onClick={() =>
                        setDeleteTarget({
                          type: "document",
                          id: row.id,
                          name: row.name,
                        })
                      }
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    );

    return cols;
  }, [
    showDepartmentColumn,
    readOnly,
    canManage,
    renamingId,
    renamingValue,
    handleCancelRename,
    handleCommitRename,
    handleDownloadDocument,
    handleOpenDocumentDetails,
    handleOpenFolder,
    handleUploadDocument,
    handleViewDocument,
  ]);

  // Synchronize column header sorting with SortBar
  const sortKey = sortBy.startsWith("name") ? "name" : "updatedAt";
  const sortOrder: "asc" | "desc" = sortBy.endsWith("asc") ? "asc" : "desc";

  const handleSortChange = (key: string, order: "asc" | "desc" | null) => {
    if (key === "name") {
      setSortBy(order === "desc" ? "name_desc" : "name_asc");
    } else if (key === "updatedAt" || key === "createdAt") {
      setSortBy(order === "asc" ? "date_asc" : "date_desc");
    }
  };

  const typeFilter: TableFilter<FolderWorkspaceItem>[] = useMemo(
    () => [
      {
        id: "kind",
        label: "Type",
        placeholder: "All Types",
        options: [
          { value: "", label: "All Types" },
          { value: "folder", label: "Folders only" },
          { value: "document", label: "Documents only" },
        ],
        filterFn: (item, value) => !value || item.kind === value,
      },
    ],
    [],
  );

  const emptyStateContent = (
    <div className="py-8">
      {canManage ? (
        <EmptyState
          title={isInFolder ? "This folder is empty" : "No folders or files yet"}
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
          {readOnly && (
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-secondary">
              <Eye className="h-3.5 w-3.5" />
              View and download only on this page
            </p>
          )}
        </div>
      )}
    </div>
  );

  const headerActionsNode = (
    <div className="flex flex-wrap items-center gap-2">
      {readOnly ? (
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-default bg-surface px-3 py-1.5 text-xs font-medium text-secondary">
          <Lock className="h-3.5 w-3.5" />
          View only
        </span>
      ) : null}
      {canManage ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleUploadDocument()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-default bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
          >
            <UploadIcon className="h-4 w-4" />
            Upload file
          </button>
          <button
            type="button"
            onClick={() => handleUploadFolder()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-default bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
          >
            <FolderUp className="h-4 w-4" />
            Upload folder
          </button>
          <button
            type="button"
            onClick={handleStartNewFolder}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            New folder
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Scope fields for owner on root folder */}
      {showRootFolderScope && (
        <div className="rounded-2xl border border-default bg-surface p-4 shadow-sm">
          <FolderScopeFields
            branchId={folderBranchId}
            departmentId={folderDepartmentId}
            onBranchChange={setFolderBranchId}
            onDepartmentChange={setFolderDepartmentId}
          />
        </div>
      )}

      {/* Breadcrumbs bar with action pills */}
      <div className="flex flex-col gap-3 rounded-2xl border border-default bg-[var(--color-bg-secondary)]/60 px-4 py-3 shadow-sm sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 rounded-xl border border-default/80 bg-surface px-3 py-2.5 shadow-sm">
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

      {/* Main DataTable */}
      {isError ? (
        <div className="rounded-2xl border border-default bg-surface p-6 shadow-sm">
          <EmptyState
            title="Unable to load folders"
            description="Please refresh the page or try again later."
            actionLabel="Reload"
            onAction={() => window.location.reload()}
          />
        </div>
      ) : (
        <DataTable<FolderWorkspaceItem>
          title={title}
          description={description}
          headerActions={headerActionsNode}
          data={sortedWorkspaceItems}
          columns={columns}
          isLoading={isLoading}
          emptyMessage={emptyStateContent}
          searchable={true}
          searchPlaceholder="Search folders and files..."
          filters={typeFilter}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          sortSlot={<SortBar sortBy={sortBy} onChange={setSortBy} />}
          paginated={true}
          pageSize={20}
          onRowClick={(item) => {
            if (renamingId) return;
            if (item.kind === "folder") {
              if (item.isPending) return;
              handleOpenFolder(item.slug);
            } else {
              handleViewDocument(item.id);
            }
          }}
        />
      )}

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={
          deleteTarget?.type === "folder" ? "Delete Folder" : "Delete Document"
        }
        description={
          deleteTarget?.type === "folder"
            ? `Are you sure you want to delete the folder "${deleteTarget.name}"? This action cannot be undone.`
            : `Are you sure you want to delete the document "${deleteTarget?.name}"? This action cannot be undone.`
        }
        itemNameToConfirm={deleteTarget?.name ?? ""}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "folder" && deleteTarget.slug) {
            handleDeleteFolder(deleteTarget.slug);
          } else if (deleteTarget.type === "document") {
            handleDeleteDocument(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />

      <DocumentDetails
        key={selectedDocument?.id ?? "no-document"}
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
        fileType={
          previewDocument?.fileName
            ? getFileTypeFromName(previewDocument.fileName)
            : "application/octet-stream"
        }
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
