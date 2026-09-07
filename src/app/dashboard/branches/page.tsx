"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, MoreVertical, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  useCreateBranch,
  useDeleteBranch,
  useGetBranches,
  useInviteBranchManager,
  useUpdateBranch,
} from "@/lib/hooks/useBranches";
import { CreateBranchModal } from "@/components/branches/CreateBranchModal";
import { EditBranchModal } from "@/components/branches/EditBranchModal";
import { InviteBranchManagerModal } from "@/components/branches/InviteBranchManagerModal";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { DataTable, type ColumnDef, type TableFilter } from "@/components/table/page";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Branch } from "@/types/branch";

export default function DashboardBranchesPage() {
  const router = useRouter();
  const { user, isLoading, isOwner } = useAuth();
  const { branches, isLoading: isBranchesLoading, isError } = useGetBranches();
  const { mutate: createBranch, isLoading: isCreating } = useCreateBranch();
  const { mutate: updateBranch, isLoading: isUpdating } = useUpdateBranch();
  const { mutate: deleteBranch, isLoading: isDeleting } = useDeleteBranch();
  const { mutate: inviteManager, isLoading: isInviting } = useInviteBranchManager();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const isBusy = isCreating || isUpdating || isDeleting || isInviting;

  useEffect(() => {
    if (!isLoading && user && !isOwner) {
      router.replace("/dashboard");
    }
  }, [isLoading, isOwner, router, user]);

  const newBranchButton = (
    <button
      type="button"
      onClick={() => setIsCreateOpen(true)}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
    >
      <Plus className="h-4 w-4" />
      New Branch
    </button>
  );

  const columns: ColumnDef<Branch>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        sortable: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
              <GitBranch className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground group-hover:text-primary">
                {row.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">/{row.slug}</p>
            </div>
          </div>
        ),
      },
      {
        id: "departmentCount",
        accessorKey: "departmentCount",
        header: "Departments",
        sortable: true,
        cell: ({ row }) => (
          <span className="tabular-nums text-secondary">
            {row.departmentCount ?? 0}
          </span>
        ),
      },
      {
        id: "memberCount",
        accessorKey: "memberCount",
        header: "Members",
        sortable: true,
        cell: ({ row }) => (
          <span className="tabular-nums text-secondary">
            {row.memberCount ?? 0}
          </span>
        ),
      },
      {
        id: "manager",
        accessorKey: "manager.name",
        header: "Manager",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.manager?.name ?? (
              <span className="text-muted">Not assigned</span>
            )}
          </span>
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
        id: "actions",
        header: "Actions",
        align: "right",
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex rounded-lg p-2 text-muted transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
                ariaLabel={`Actions for ${row.name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedBranch(row);
                    setIsEditOpen(true);
                  }}
                  disabled={isBusy}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedBranch(row);
                    setIsInviteOpen(true);
                  }}
                  disabled={isBusy}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite manager
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedBranch(row);
                    setIsDeleteOpen(true);
                  }}
                  disabled={isBusy}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [isBusy],
  );

  const filters: TableFilter<Branch>[] = useMemo(
    () => [
      {
        id: "managerStatus",
        label: "Manager",
        placeholder: "All Branches",
        options: [
          { value: "", label: "All Branches" },
          { value: "assigned", label: "Has Manager" },
          { value: "unassigned", label: "No Manager" },
        ],
        filterFn: (branch, val) => {
          if (val === "assigned") return Boolean(branch.manager);
          if (val === "unassigned") return !branch.manager;
          return true;
        },
      },
    ],
    [],
  );

  if (isLoading || !user || !isOwner) {
    return (
      <div className="space-y-6 p-6">
        <LoadingSkeleton width={280} height={32} />
        <LoadingSkeleton height={280} rounded="1rem" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <OrgPageHeader
          title="Branches"
          description="Organize your organization into branches and assign branch managers."
        />
        <EmptyState
          title="Unable to load branches"
          description="There was a problem fetching branches. Refresh to try again."
          actionLabel="Retry"
          onAction={() => router.refresh()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <OrgPageHeader
        title="Branches"
        description="Organize your organization into branches and assign branch managers."
        action={newBranchButton}
      />

      <DataTable<Branch>
        data={branches}
        columns={columns}
        isLoading={isBranchesLoading}
        emptyMessage="No branches found."
        searchable={true}
        searchPlaceholder="Search branches..."
        filters={filters}
        paginated={true}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        onRowClick={(branch) => router.push(`/dashboard/branches/${branch.slug}`)}
      />

      <CreateBranchModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onConfirm={(name) => {
          createBranch(
            { name },
            {
              onSuccess: () => toast.success("Branch created successfully"),
              onError: (error) => {
                toast.error(
                  error instanceof Error ? error.message : "Unable to create branch.",
                );
              },
            },
          );
        }}
        isSubmitting={isCreating}
      />
      <EditBranchModal
        isOpen={isEditOpen}
        branchName={selectedBranch?.name ?? ""}
        onClose={() => setIsEditOpen(false)}
        onConfirm={(name) => {
          if (!selectedBranch) return;
          updateBranch(
            { slug: selectedBranch.slug, data: { name } },
            {
              onSuccess: () => toast.success("Branch updated successfully"),
              onError: (error) => {
                toast.error(
                  error instanceof Error ? error.message : "Unable to update branch.",
                );
              },
            },
          );
        }}
        isSubmitting={isUpdating}
      />
      <InviteBranchManagerModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onConfirm={(data) => {
          if (!selectedBranch) return;
          inviteManager(
            { slug: selectedBranch.slug, data },
            {
              onSuccess: () => toast.success(`Invitation sent to ${data.email}`),
              onError: (error) => {
                toast.error(
                  error instanceof Error ? error.message : "Unable to send invitation.",
                );
              },
            },
          );
        }}
        isSubmitting={isInviting}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          if (!selectedBranch) return;
          deleteBranch(selectedBranch.slug, {
            onSuccess: () => {
              toast.success("Branch deleted successfully");
              setIsDeleteOpen(false);
            },
            onError: (error) => {
              toast.error(
                error instanceof Error ? error.message : "Unable to delete branch.",
              );
            },
          });
        }}
        title="Delete Branch"
        description="Deleting a branch removes it from your organization. Departments must be removed first."
        itemNameToConfirm={selectedBranch?.name ?? ""}
        isLoading={isDeleting}
      />
    </div>
  );
}
