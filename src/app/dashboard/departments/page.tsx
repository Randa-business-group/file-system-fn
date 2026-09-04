"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  useCreateDepartment,
  useDeleteDepartment,
  useGetDepartments,
  useInviteDeptManager,
  useUpdateDepartment,
} from "@/lib/hooks/useDepartments";
import { AddDepartmentModal } from "@/components/departments/AddDepartmentModal";
import { EditDepartmentModal } from "@/components/departments/EditDepartmentModal";
import { InviteAdminModal } from "@/components/departments/InviteAdminModal";
import { DepartmentRow } from "@/components/departments/DepartmentRow";
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
import { Role } from "@/types/enum";
import type { Department } from "@/types/department";

export default function DashboardDepartmentsPage() {
  const router = useRouter();
  const { user, isLoading, isOwner, isBranchManager } = useAuth();
  const { departments, isLoading: isDepartmentsLoading, isError } = useGetDepartments();
  const { mutate: createDepartment, isLoading: isCreatingDepartment } =
    useCreateDepartment();
  const { mutate: updateDepartment, isLoading: isUpdatingDepartment } =
    useUpdateDepartment();
  const { mutate: deleteDepartment, isLoading: isDeletingDepartment } =
    useDeleteDepartment();
  const { mutate: inviteDeptManager, isLoading: isInvitingAdmin } =
    useInviteDeptManager();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(
    null,
  );

  const isBusy =
    isCreatingDepartment ||
    isUpdatingDepartment ||
    isDeletingDepartment ||
    isInvitingAdmin;

  const canManage =
    user?.role === Role.OWNER || user?.role === Role.BRANCH_MANAGER;

  useEffect(() => {
    if (!isLoading && user && !isOwner && !isBranchManager) {
      router.replace("/dashboard");
    }
  }, [isBranchManager, isLoading, isOwner, router, user]);

  if (isLoading || !user) {
    return (
      <div className="space-y-6 p-6">
        <LoadingSkeleton width={280} height={32} />
        <LoadingSkeleton height={280} rounded="1rem" />
      </div>
    );
  }

  const newDepartmentButton = canManage ? (
    <button
      type="button"
      onClick={() => setIsAddModalOpen(true)}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
    >
      <Plus className="h-4 w-4" />
      New Department
    </button>
  ) : undefined;

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <OrgPageHeader
          title="Departments"
          description="Manage departments, assign administrators, and keep teams organized."
        />
        <EmptyState
          title="Unable to load departments"
          description="There was a problem fetching the department list. Refresh to try again."
          actionLabel="Retry"
          onAction={() => router.refresh()}
        />
      </div>
    );
  }

  if (!departments.length && !isDepartmentsLoading) {
    return (
      <div className="space-y-6 p-6">
        <OrgPageHeader
          title="Departments"
          description="Create and manage departments for the organization."
          action={newDepartmentButton}
        />
        <EmptyState
          title="No departments yet"
          description="Create your first department and manage users by department."
          actionLabel="Create a Department"
          onAction={() => setIsAddModalOpen(true)}
        />
        <AddDepartmentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onConfirm={(name) => {
            createDepartment(
              { name },
              {
                onSuccess: () => toast.success("Department created successfully"),
                onError: (error) => {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Unable to create department.",
                  );
                },
              },
            );
          }}
          isSubmitting={isCreatingDepartment}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <OrgPageHeader
        title="Departments"
        description="Manage departments, assign administrators, and keep teams organized."
        action={newDepartmentButton}
      />

      <TableContainer>
        <Table className="min-w-[640px]">
          <TableHeader>
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Folders</TableHead>
              <TableHead>Created</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {isDepartmentsLoading ? (
              <TableLoading colSpan={5} rows={4} />
            ) : departments.length === 0 ? (
              <TableEmpty colSpan={5} message="No departments found." />
            ) : (
              departments.map((department) => (
                <DepartmentRow
                  key={department.id}
                  department={department}
                  onEdit={() => {
                    setSelectedDepartment(department);
                    setIsEditModalOpen(true);
                  }}
                  onInviteAdmin={() => {
                    setSelectedDepartment(department);
                    setIsInviteModalOpen(true);
                  }}
                  onDelete={() => {
                    setSelectedDepartment(department);
                    setIsDeleteModalOpen(true);
                  }}
                  isBusy={isBusy}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <AddDepartmentModal
        key="add-department-modal"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={(name) => {
          createDepartment(
            { name },
            {
              onSuccess: () => toast.success("Department created successfully"),
              onError: (error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Unable to create department.",
                );
              },
            },
          );
        }}
        isSubmitting={isCreatingDepartment}
      />
      <EditDepartmentModal
        key={`edit-${selectedDepartment?.id ?? "none"}-${isEditModalOpen}`}
        isOpen={isEditModalOpen}
        departmentName={selectedDepartment?.name ?? ""}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={(name) => {
          if (!selectedDepartment) return;
          updateDepartment(
            { slug: selectedDepartment.slug, data: { name } },
            {
              onSuccess: () => toast.success("Department updated successfully"),
              onError: (error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Unable to update department.",
                );
              },
            },
          );
        }}
        isSubmitting={isUpdatingDepartment}
      />
      <InviteAdminModal
        key={`invite-${selectedDepartment?.id ?? "none"}-${isInviteModalOpen}`}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onConfirm={(data) => {
          if (!selectedDepartment) return;
          inviteDeptManager(
            { slug: selectedDepartment.slug, data },
            {
              onSuccess: () => {
                toast.success("Department manager invitation sent successfully");
              },
              onError: (error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Unable to send department manager invite.",
                );
              },
            },
          );
        }}
        isSubmitting={isInvitingAdmin}
      />
      <DeleteConfirmationModal
        key={`delete-${selectedDepartment?.id ?? "none"}-${isDeleteModalOpen}`}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!selectedDepartment) return;
          deleteDepartment(selectedDepartment.slug, {
            onSuccess: () => {
              toast.success("Department deleted successfully");
              setIsDeleteModalOpen(false);
            },
            onError: (error) => {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Unable to delete department.",
              );
            },
          });
        }}
        title="Delete Department"
        description="Deleting a department will remove it from the organization and revoke related admin assignments."
        itemNameToConfirm={selectedDepartment?.name ?? ""}
        isLoading={isDeletingDepartment}
      />
    </div>
  );
}
