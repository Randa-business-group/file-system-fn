"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Library, MoreVertical, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useGetCollections, useDeleteCollection } from "@/lib/hooks/useCollections";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { DataTable, type ColumnDef, type TableFilter } from "@/components/table/page";
import { CreateCollectionModal } from "@/components/collections/CreateCollectionModal";
import { EditCollectionModal } from "@/components/collections/EditCollectionModal";
import { ShareModal } from "@/components/sharing/ShareModal";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canManageScopedResource } from "@/lib/shared-scope-utils";
import { SharedLevel } from "@/types/shared-space";
import { Role } from "@/types/enum";
import type { AuthUser } from "@/types/auth";
import type { Collection } from "@/types/collection";

function canModifyCollection(collection: Collection, currentUser: AuthUser | null) {
  if (!currentUser) return false;
  const isCreator = currentUser.id === collection.createdBy.id;
  const canManageScope =
    currentUser.role === Role.OWNER ||
    currentUser.role === Role.BRANCH_MANAGER ||
    currentUser.role === Role.DEPT_MANAGER;

  return collection.isShared
    ? canManageScopedResource(currentUser, {
        level: collection.level ?? SharedLevel.ORGANIZATION,
        branchId: collection.branchId,
        departmentId: collection.departmentId,
      })
    : isCreator || canManageScope;
}

export default function CollectionsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { collections, isLoading } = useGetCollections();
  const deleteCollection = useDeleteCollection();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [shareCollection, setShareCollection] = useState<Collection | null>(null);

  const canViewAll =
    user?.role === Role.OWNER || user?.role === Role.BRANCH_MANAGER;
  const userCollections = useMemo(() => {
    return canViewAll
      ? collections
      : collections.filter((c) => c.createdBy.id === user?.id);
  }, [canViewAll, collections, user?.id]);

  const ownerOptions = useMemo(() => {
    const seenOwners = new Set<string>();
    return userCollections.reduce<{ id: string; name: string }[]>((owners, collection) => {
      const owner = collection.createdBy;
      if (!seenOwners.has(owner.id)) {
        seenOwners.add(owner.id);
        owners.push({ id: owner.id, name: owner.name });
      }
      return owners;
    }, []);
  }, [userCollections]);

  const columns: ColumnDef<Collection>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        sortable: true,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-bg-secondary)] text-primary">
              <Library className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/dashboard/collections/${row.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="block truncate text-sm font-semibold text-foreground transition hover:text-primary"
              >
                {row.name}
              </Link>
              <p className="mt-0.5 line-clamp-1 text-xs text-secondary">
                {row.description ?? "No description"}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "owner",
        accessorKey: "createdBy.name",
        header: "Owner",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-secondary">{row.createdBy.name}</span>
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Created",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-secondary">
            {new Date(row.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        id: "documentCount",
        accessorKey: "documentCount",
        header: "Documents",
        sortable: true,
        cell: ({ row }) => (
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {row.documentCount} {row.documentCount === 1 ? "document" : "documents"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        cell: ({ row }) => {
          const canModify = canModifyCollection(row, user as AuthUser);
          if (!canModify) return null;

          return (
            <div
              className="flex justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-default bg-surface text-secondary transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
                  ariaLabel={`Collection actions for ${row.name}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setEditingCollection(row)}
                    className="flex items-center gap-2 text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShareCollection(row)}
                    className="flex items-center gap-2 text-foreground"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeletingCollection(row)}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [user],
  );

  const filters: TableFilter<Collection>[] = useMemo(() => {
    if (!canViewAll || ownerOptions.length === 0) return [];

    return [
      {
        id: "ownerId",
        label: "Owner",
        placeholder: "All owners",
        options: [
          { value: "", label: "All owners" },
          ...ownerOptions.map((owner) => ({
            value: owner.id,
            label: owner.name,
          })),
        ],
        filterFn: (collection, value) =>
          !value || collection.createdBy.id === value,
      },
    ];
  }, [canViewAll, ownerOptions]);

  const handleDeleteConfirm = async () => {
    if (!deletingCollection) return;

    try {
      await deleteCollection.mutateAsync(deletingCollection.slug);
      toast.success("Collection moved to trash");
      setDeletingCollection(null);
    } catch {
      toast.error("Failed to delete collection");
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-3">
          <LoadingSkeleton width={260} height={32} />
          <LoadingSkeleton width="50%" height={16} />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="space-y-4 rounded-3xl border border-default bg-surface p-6"
            >
              <LoadingSkeleton width="60%" height={20} />
              <LoadingSkeleton width="100%" height={14} />
              <LoadingSkeleton width="100%" height={14} />
              <LoadingSkeleton width="65%" height={14} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const newCollectionButton = (
    <button
      type="button"
      onClick={() => setIsCreateModalOpen(true)}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
    >
      <Plus className="h-4 w-4" />
      New Collection
    </button>
  );

  return (
    <div className="space-y-6 p-6">
      <DataTable<Collection>
        title="Collections"
        description="Organize and group related documents together"
        headerActions={newCollectionButton}
        data={userCollections}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No collections found."
        searchable={true}
        searchPlaceholder="Search collections..."
        searchFields={["name", "description"]}
        filters={filters}
        paginated={true}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        onRowClick={(collection) =>
          router.push(`/dashboard/collections/${collection.slug}`)
        }
      />

      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <EditCollectionModal
        isOpen={Boolean(editingCollection)}
        onClose={() => setEditingCollection(null)}
        collection={editingCollection}
      />
      <ShareModal
        isOpen={Boolean(shareCollection)}
        onClose={() => setShareCollection(null)}
        collectionId={shareCollection?.id}
        documentName={shareCollection?.name}
      />
      <DeleteConfirmationModal
        isOpen={Boolean(deletingCollection)}
        onClose={() => setDeletingCollection(null)}
        onConfirm={handleDeleteConfirm}
        title="Move to trash?"
        description="This collection will be moved to trash for 30 days. You can restore it from Trash before it is permanently deleted."
        itemNameToConfirm={deletingCollection?.name ?? ""}
        isLoading={deleteCollection.isLoading}
      />
    </div>
  );
}
