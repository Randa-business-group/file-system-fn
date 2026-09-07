"use client";

import { useRouter } from "next/navigation";
import { Building, MoreVertical, Pencil, Trash2, UserPlus } from "lucide-react";
import type { Department } from "@/types/department";
import { useGetDepartmentBySlug } from "@/lib/hooks/useDepartments";
import { Role } from "@/types/enum";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DepartmentRowProps {
  department: Department;
  onEdit: () => void;
  onInviteAdmin: () => void;
  onDelete: () => void;
  isBusy?: boolean;
}

export function DepartmentRow({
  department,
  onEdit,
  onInviteAdmin,
  onDelete,
  isBusy = false,
}: DepartmentRowProps) {
  const router = useRouter();
  const createdAt = new Date(department.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const detailHref = `/dashboard/departments/${department.slug}`;

  const openDetail = () => {
    router.push(detailHref);
  };

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      }}
      className="group cursor-pointer border-t border-default transition-colors hover:bg-[var(--color-bg-secondary)]/70"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
            <Building className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground group-hover:text-primary">
              {department.name}
            </p>
            {department.branch ? (
              <p className="mt-0.5 truncate text-xs text-muted">
                {department.branch.name}
              </p>
            ) : (
              <p className="mt-0.5 truncate text-xs text-muted">/{department.slug}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-4 tabular-nums text-secondary">
        {department.memberCount}
      </td>
      <td className="px-5 py-4 tabular-nums text-secondary">
        {department.folderCount}
      </td>
      <td className="px-5 py-4 text-secondary">{createdAt}</td>
      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <DepartmentAdminAction
            departmentSlug={department.slug}
            onInvite={onInviteAdmin}
            isBusy={isBusy}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex rounded-lg p-2 text-muted transition hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
              ariaLabel={`Actions for ${department.name}`}
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem
                onClick={onEdit}
                disabled={isBusy}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                disabled={isBusy}
                className="flex items-center gap-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

export function DepartmentAdminAction({
  departmentSlug,
  onInvite,
  isBusy,
}: {
  departmentSlug: string;
  onInvite: () => void;
  isBusy?: boolean;
}) {
  const { department: deptDetail, isLoading } = useGetDepartmentBySlug(departmentSlug);

  const manager = deptDetail?.members?.find((u) => u.role === Role.DEPT_MANAGER);

  if (isLoading) {
    return (
      <span className="rounded-lg px-2 py-1 text-xs text-muted">…</span>
    );
  }

  if (manager) {
    return (
      <span
        className="max-w-[140px] truncate rounded-lg bg-[var(--color-bg-secondary)] px-2.5 py-1 text-xs font-medium text-secondary"
        title={manager.email}
      >
        {manager.name}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onInvite();
      }}
      disabled={isBusy}
      className="inline-flex items-center gap-1 rounded-lg border border-default px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
    >
      <UserPlus className="h-3.5 w-3.5" />
      Invite
    </button>
  );
}
