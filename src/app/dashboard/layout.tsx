"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SetupCategoriesModal } from "@/components/categories/SetupCategoriesModal";
import { DashboardProvider } from "@/lib/dashboard-context";
import { useAuth } from "@/lib/auth-context";
import { useOrganizationSetup } from "@/lib/hooks/useOrganizationSetup";
import { Role } from "@/types/enum";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/search": "Search",
  "/dashboard/my-folders": "My Folders",
  "/dashboard/folders": "Folders",
  "/dashboard/inbox": "Received",
  "/dashboard/inbox/sent": "Sent",
  "/dashboard/trash": "Trash",
  "/dashboard/notifications": "Notifications",
  "/dashboard/unsorted": "Unsorted",
  "/dashboard/documents": "My Documents",
  "/dashboard/categories": "Categories",
  "/dashboard/collections": "Collections",
  "/dashboard/shared": "Shared Spaces",
  "/dashboard/branches": "Branches",
  "/dashboard/departments": "Departments",
  "/dashboard/members": "Members",
  "/dashboard/profile": "Settings",
  "/dashboard/company": "Company Settings",
  "/dashboard/staff": "Staff",
};

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Dashboard";
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isSetupComplete, isLoading: isOrganizationSetupLoading } = useOrganizationSetup();
  const [isModalCompleted, setIsModalCompleted] = useState(false);

  const showSetupModal =
    !isAuthLoading &&
    !isOrganizationSetupLoading &&
    user?.role === Role.BRANCH_MANAGER &&
    !isSetupComplete &&
    !isModalCompleted;

  return (
    <DashboardProvider>
      <SetupCategoriesModal
        isOpen={showSetupModal}
        onClose={() => {
          /* intentionally disabled while setup is required */
        }}
        onSuccess={() => setIsModalCompleted(true)}
        disableClose={true}
      />
      <DashboardLayout pageTitle={pageTitle}>
        {children}
      </DashboardLayout>
    </DashboardProvider>
  );
}
