"use client";

import {
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";

const staffRows = [
  { name: "Alice Uwimana", role: "Manager", status: "Active" },
  { name: "Eric Niyonzima", role: "Supervisor", status: "Active" },
  { name: "Grace Irakoze", role: "Operator", status: "On Leave" },
];

export default function DashboardStaffPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Staff</h1>
        <p className="text-sm text-secondary">Manage your team members and roles.</p>
      </header>

      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {staffRows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                <TableCell className="text-secondary">{row.role}</TableCell>
                <TableCell className="text-secondary">{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
