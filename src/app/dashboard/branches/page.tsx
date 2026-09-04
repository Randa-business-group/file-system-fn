"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  useCreateBranch,
  useDeleteBranch,
  useGetBranches,
  useInviteBranchManager,
  useUpdateBranch,
} from "@/lib/hooks/useBranches";
import { BranchRow } from "@/components/branches/BranchRow";
import { CreateBranchModal } from "@/components/branches/CreateBranchModal";
import { EditBranchModal } from "@/components/branches/EditBranchModal";
import { InviteBranchManagerModal } from "@/components/branches/InviteBranchManagerModal";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import {
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableLoading,
  TableEmpty,
} from "@/components/ui/Table";
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

  if (isLoading || !user || !isOwner) {
    return (
      <div className="space-y-6 p-6">
        <LoadingSkeleton width={280} height={32} />
        <LoadingSkeleton height={280} rounded="1rem" />
      </div>
    );
  }

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

  if (!isBranchesLoading && branches.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <OrgPageHeader
          title="Branches"
          description="Organize your organization into branches and assign branch managers."
          action={newBranchButton}
        />
        <EmptyState
          title="No branches yet"
          description="Create your first branch to structure departments and members."
          actionLabel="New Branch"
          onAction={() => setIsCreateOpen(true)}
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

      <TableContainer>
        <Table className="min-w-[720px]">
          <TableHeader>
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Created</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {isBranchesLoading ? (
              <TableLoading colSpan={6} rows={4} />
            ) : branches.length === 0 ? (
              <TableEmpty colSpan={6} message="No branches found." />
            ) : (
              branches.map((branch) => (
                <BranchRow
                  key={branch.id}
                  branch={branch}
                  onEdit={() => {
                    setSelectedBranch(branch);
                    setIsEditOpen(true);
                  }}
                  onInviteManager={() => {
                    setSelectedBranch(branch);
                    setIsInviteOpen(true);
                  }}
                  onDelete={() => {
                    setSelectedBranch(branch);
                    setIsDeleteOpen(true);
                  }}
                  isBusy={isBusy}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
