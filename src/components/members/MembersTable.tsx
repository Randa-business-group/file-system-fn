"use client";

import { useMemo, useState } from "react";
import { UserX } from "lucide-react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/ui/Badge";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
} from "@/components/ui/Table";
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
  onChangeRole,
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
  }, [currentUserRole, isOwner, members, user?.branchId, user?.departmentId]);

  const showBranchColumn = isOwner;

  const handleDeleteClick = (memberId: string, memberName: string) => {
    setDeleteConfirm({ isOpen: true, memberId, memberName });
  };

  const handleConfirmDelete = () => {
    onRemove(deleteConfirm.memberId);
    setDeleteConfirm({ isOpen: false, memberId: "", memberName: "" });
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation.mutateAsync(invitationId);
      toast.success("Invitation cancelled successfully");
    } catch {
      toast.error("Unable to cancel invitation.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-default bg-surface p-5 shadow-sm">
            <div className="grid gap-4 text-sm sm:grid-cols-[160px_1fr_120px_120px_180px]">
              <LoadingSkeleton height={24} width={120} rounded="1rem" />
              <LoadingSkeleton height={24} width="100%" rounded="1rem" />
              <LoadingSkeleton height={24} width={100} rounded="1rem" />
              <LoadingSkeleton height={24} width={100} rounded="1rem" />
              <LoadingSkeleton height={24} width={140} rounded="1rem" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const colSpan = showBranchColumn ? 8 : 7;

  return (
    <>
      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              {showBranchColumn ? (
                <TableHead>Branch</TableHead>
              ) : null}
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Date Joined</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableEmpty colSpan={colSpan} message="No members have accepted an invitation yet." />
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-subtle text-sm font-semibold text-primary">
                      {getInitials(member.name)}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{member.name}</TableCell>
                  <TableCell className="text-secondary">{member.email}</TableCell>
                  {showBranchColumn ? (
                    <TableCell className="text-secondary">
                      {member.branch?.name ?? "—"}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-secondary">
                    {member.department?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={member.role} />
                  </TableCell>
                  <TableCell className="text-secondary">{member.createdAt}</TableCell>
                  <TableCell align="right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {canManageMembers(currentUserRole) ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(member.id, member.name)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          <UserX className="h-4 w-4" />
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="overflow-hidden rounded-3xl border border-default bg-surface shadow-sm">
        <div className="border-b border-default px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Pending Invitations</h2>
          <p className="mt-1 text-sm text-secondary">
            Track invitations that are waiting for acceptance.
          </p>
        </div>

        {isInvitationsLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-4 rounded-2xl border border-default p-4 sm:grid-cols-[1.5fr_120px_140px_120px]"
              >
                <LoadingSkeleton height={20} width="100%" rounded="1rem" />
                <LoadingSkeleton height={20} width={100} rounded="1rem" />
                <LoadingSkeleton height={20} width={110} rounded="1rem" />
                <LoadingSkeleton height={20} width={90} rounded="1rem" />
              </div>
            ))}
          </div>
        ) : invitations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Date Sent</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="text-foreground">{invitation.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={invitation.role} />
                  </TableCell>
                  <TableCell className="text-secondary">
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <button
                      type="button"
                      onClick={() => void handleCancelInvitation(invitation.id)}
                      disabled={cancelInvitation.isLoading}
                      className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelInvitation.isLoading ? "Cancelling..." : "Cancel"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-5 py-8 text-sm text-secondary">No pending invitations.</div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, memberId: "", memberName: "" })}
        onConfirm={handleConfirmDelete}
        title="Remove Member"
        description={`Are you sure you want to remove "${deleteConfirm.memberName}" from the workspace? They will lose access to all folders and documents.`}
        itemNameToConfirm={deleteConfirm.memberName}
      />
    </>
  );
}
