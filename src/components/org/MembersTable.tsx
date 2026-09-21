"use client";

import { RoleBadge } from "@/components/ui/Badge";
import {
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableLoading,
  TableEmpty,
} from "@/components/ui/Table";
import { Role } from "@/types/enum";
import type { Member } from "@/types/member";

interface MembersTableProps {
  members: Member[];
  isLoading?: boolean;
  emptyMessage?: string;
  compact?: boolean;
  /** When true, omits outer card border (use inside a parent panel with pagination). */
  embedded?: boolean;
}

function normalizeRole(role: string): Role {
  if (Object.values(Role).includes(role as Role)) {
    return role as Role;
  }
  return Role.MEMBER;
}

export function MembersTable({
  members,
  isLoading = false,
  emptyMessage = "No members in this group yet.",
  compact = false,
  embedded = false,
}: MembersTableProps) {
  const cellPad = compact ? "px-4 py-2" : "px-5 py-3";
  const headPad = compact ? "px-4 py-2.5" : "px-5 py-3";

  const tableContent = (
    <Table className="w-full text-left text-sm">
      <TableHeader>
        <TableRow hoverable={false}>
          <TableHead className={headPad}>Name</TableHead>
          <TableHead className={headPad}>Email</TableHead>
          <TableHead className={headPad} align="right">
            Role
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableLoading colSpan={3} rows={3} />
        ) : members.length === 0 ? (
          <TableEmpty colSpan={3} message={emptyMessage} />
        ) : (
          members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className={cellPad}>
                <p className="font-medium text-foreground">{member.name}</p>
              </TableCell>
              <TableCell className={`${cellPad} text-secondary`}>{member.email}</TableCell>
              <TableCell className={`${cellPad} text-right`} align="right">
                <RoleBadge role={normalizeRole(member.role)} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (embedded) {
    return <div className="overflow-x-auto">{tableContent}</div>;
  }

  return (
    <TableContainer className="rounded-xl">
      {tableContent}
    </TableContainer>
  );
}
