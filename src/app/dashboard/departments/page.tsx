"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
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
import { DepartmentAdminAction } from "@/components/departments/DepartmentRow";
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

  const columns: ColumnDef<Department>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        sortable: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
              <Building className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground group-hover:text-primary">
                {row.name}
              </p>
              {row.branch ? (
                <p className="mt-0.5 truncate text-xs text-muted">
                  {row.branch.name}
                </p>
              ) : (
                <p className="mt-0.5 truncate text-xs text-muted">/{row.slug}</p>
              )}
            </div>
          </div>
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
        id: "folderCount",
        accessorKey: "folderCount",
        header: "Folders",
        sortable: true,
        cell: ({ row }) => (
          <span className="tabular-nums text-secondary">
            {row.folderCount ?? 0}
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
            className="flex items-center justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <DepartmentAdminAction
              departmentSlug={row.slug}
              onInvite={() => {
                setSelectedDepartment(row);
                setIsInviteModalOpen(true);
              }}
              isBusy={isBusy}
            />
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex rounded-lg p-2 text-muted transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
                ariaLabel={`Actions for ${row.name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedDepartment(row);
                    setIsEditModalOpen(true);
                  }}
                  disabled={isBusy}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedDepartment(row);
                    setIsDeleteModalOpen(true);
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

  const filters: TableFilter<Department>[] = useMemo(() => {
    const branchMap = new Map<string, string>();
    departments.forEach((dept) => {
      if (dept.branch?.id && dept.branch?.name) {
        branchMap.set(dept.branch.id, dept.branch.name);
      }
    });

    if (branchMap.size === 0) return [];

    return [
      {
        id: "branch",
        label: "Branch",
        placeholder: "All Branches",
        options: [
          { value: "", label: "All Branches" },
          ...Array.from(branchMap.entries()).map(([id, name]) => ({
            value: id,
            label: name,
          })),
        ],
        filterFn: (dept, val) => !val || dept.branch?.id === val,
      },
    ];
  }, [departments]);

  if (isLoading || !user) {
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

  return (
    <div className="space-y-6 p-6">
      <OrgPageHeader
        title="Departments"
        description="Manage departments, assign administrators, and keep teams organized."
        action={newDepartmentButton}
      />

      <DataTable<Department>
        data={departments}
        columns={columns}
        isLoading={isDepartmentsLoading}
        emptyMessage="No departments found."
        searchable={true}
        searchPlaceholder="Search departments..."
        filters={filters}
        paginated={true}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        onRowClick={(dept) => router.push(`/dashboard/departments/${dept.slug}`)}
      />

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
