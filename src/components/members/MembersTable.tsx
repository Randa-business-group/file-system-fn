"use client";

import { useCallback, useMemo, useState } from "react";
import { UserX } from "lucide-react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/ui/Badge";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { DataTable, type ColumnDef, type TableFilter } from "@/components/table/page";
import { useCancelInvitation } from "@/lib/hooks/useInvitations";
import { useAuth } from "@/lib/auth-context";
import type { Invitation } from "@/types/invitation";
import type { Member } from "@/types/member";
import { Role } from "@/types/enum";

interface MembersTableProps {
  members: Member[];
  invitations: Invitation[];
  currentUserRole: Role;
  isLoading: boolean;
  isInvitationsLoading?: boolean;
  onChangeRole: (memberId: string) => void;
  onRemove: (memberId: string) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

function canManageMembers(role: Role) {
  return (
    role === Role.OWNER ||
    role === Role.BRANCH_MANAGER ||
    role === Role.DEPT_MANAGER
  );
}

export function MembersTable({
  members,
  invitations,
  currentUserRole,
  isLoading,
  isInvitationsLoading = false,
  onRemove,
}: MembersTableProps) {
  const { isOwner, user } = useAuth();
  const cancelInvitation = useCancelInvitation();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    memberId: string;
    memberName: string;
  }>({
    isOpen: false,
    memberId: "",
    memberName: "",
  });

  const filteredMembers = useMemo(() => {
    if (isOwner) {
      return members;
    }
    if (currentUserRole === Role.BRANCH_MANAGER && user?.branchId) {
      return members.filter((member) => member.branch?.id === user.branchId);
    }
    if (currentUserRole === Role.DEPT_MANAGER && user?.departmentId) {
      return members.filter((member) => member.department?.id === user.departmentId);
    }
    return members;
  }, [currentUserRole, isOwner, members, user]);

  const showBranchColumn = isOwner;

  const handleDeleteClick = useCallback((memberId: string, memberName: string) => {
    setDeleteConfirm({ isOpen: true, memberId, memberName });
  }, []);

  const handleConfirmDelete = () => {
    onRemove(deleteConfirm.memberId);
    setDeleteConfirm({ isOpen: false, memberId: "", memberName: "" });
  };

  const handleCancelInvitation = useCallback(
    async (invitationId: string) => {
      try {
        await cancelInvitation.mutateAsync(invitationId);
        toast.success("Invitation cancelled successfully");
      } catch {
        toast.error("Unable to cancel invitation.");
      }
    },
    [cancelInvitation],
  );

  const memberFilters: TableFilter<Member>[] = useMemo(
    () => [
      {
        id: "role",
        label: "Role",
        placeholder: "All Roles",
        options: [
          { value: "", label: "All Roles" },
          { value: Role.OWNER, label: "Owner" },
          { value: Role.BRANCH_MANAGER, label: "Branch Manager" },
          { value: Role.DEPT_MANAGER, label: "Dept Manager" },
          { value: Role.MEMBER, label: "Member" },
        ],
        filterFn: (row, val) => !val || row.role === val,
      },
    ],
    [],
  );

  const memberColumns: ColumnDef<Member>[] = useMemo(
    () => [
      {
        id: "avatar",
        header: "Avatar",
        width: "70px",
        cell: ({ row }) => (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-subtle text-sm font-semibold text-primary">
            {getInitials(row.name)}
          </div>
        ),
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        sortable: true,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.name}</span>
        ),
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-secondary">{row.email}</span>
        ),
      },
      ...(showBranchColumn
        ? [
            {
              id: "branch",
              accessorKey: "branch.name",
              header: "Branch",
              sortable: true,
              cell: ({ row }: { row: Member }) => (
                <span className="text-secondary">{row.branch?.name ?? "—"}</span>
              ),
            },
          ]
        : []),
      {
        id: "department",
        accessorKey: "department.name",
        header: "Department",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-secondary">{row.department?.name ?? "—"}</span>
        ),
      },
      {
        id: "role",
        accessorKey: "role",
        header: "Role",
        sortable: true,
        cell: ({ row }) => <RoleBadge role={row.role} />,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Date Joined",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-secondary">{row.createdAt}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            {canManageMembers(currentUserRole) ? (
              <button
                type="button"
                onClick={() => handleDeleteClick(row.id, row.name)}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                <UserX className="h-4 w-4" />
                Remove
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [currentUserRole, handleDeleteClick, showBranchColumn],
  );

  const invitationColumns: ColumnDef<Invitation>[] = useMemo(
    () => [
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        sortable: true,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.email}</span>
        ),
      },
      {
        id: "role",
        accessorKey: "role",
        header: "Role",
        sortable: true,
        cell: ({ row }) => <RoleBadge role={row.role} />,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Date Sent",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-secondary">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        align: "right",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => void handleCancelInvitation(row.id)}
            disabled={cancelInvitation.isLoading}
            className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelInvitation.isLoading ? "Cancelling..." : "Cancel"}
          </button>
        ),
      },
    ],
    [cancelInvitation.isLoading, handleCancelInvitation],
  );

  return (
    <div className="space-y-8">
      <DataTable<Member>
        data={filteredMembers}
        columns={memberColumns}
        isLoading={isLoading}
        title="Workspace Members"
        description="Active team members with access to your workspace."
        emptyMessage="No members have accepted an invitation yet."
        searchable={true}
        searchPlaceholder="Search members..."
        searchFields={["name", "email", "department.name", "branch.name", "role"]}
        filters={memberFilters}
        paginated={true}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        keyExtractor={(member) => member.id}
      />

      <DataTable<Invitation>
        data={invitations}
        columns={invitationColumns}
        isLoading={isInvitationsLoading}
        title="Pending Invitations"
        description="Track invitations that are waiting for acceptance."
        emptyMessage="No pending invitations."
        searchable={invitations.length > 5}
        searchPlaceholder="Search invitations..."
        paginated={invitations.length > 5}
        pageSize={5}
        pageSizeOptions={[5, 10, 20]}
        keyExtractor={(invitation) => invitation.id}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, memberId: "", memberName: "" })}
        onConfirm={handleConfirmDelete}
        title="Remove Member"
        description={`Are you sure you want to remove "${deleteConfirm.memberName}" from the workspace? They will lose access to all folders and documents.`}
        itemNameToConfirm={deleteConfirm.memberName}
      />
    </div>
  );
}
