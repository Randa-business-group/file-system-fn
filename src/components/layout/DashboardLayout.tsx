"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { UploadDrawer } from "@/components/upload/UploadDrawer";
import { useDashboard } from "@/lib/dashboard-context";
import { useAuth } from "@/lib/auth-context";
import {
  clearFolderNavForPath,
  isFolderBrowserPath,
  stripFolderSearchParam,
} from "@/lib/folder-navigation";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export function DashboardLayout({
  children,
  pageTitle,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isUploadOpen, closeUpload, openUpload, setUploadFolderId, uploadFolderId } = useDashboard();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    setUploadFolderId(null);
  }, [pathname, setUploadFolderId]);

  useEffect(() => {
    const previousPath = prevPathnameRef.current;

    if (previousPath !== null && previousPath !== pathname) {
      if (isFolderBrowserPath(previousPath)) {
        clearFolderNavForPath(previousPath);
      }

      if (isFolderBrowserPath(pathname)) {
        const params = new URLSearchParams(window.location.search);
        if (params.has("folder")) {
          router.replace(stripFolderSearchParam(pathname), { scroll: false });
        }
      }
    }

    prevPathnameRef.current = pathname;
  }, [pathname, router]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        pathname={pathname}
        user={user}
        onClose={() => setIsSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300 ease-out",
          sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-52",
        )}
      >
        <TopBar
          pageTitle={pageTitle}
          onMenuClick={() => setIsSidebarOpen(true)}
          onUploadClick={openUpload}
        />
        <main
          key={pathname}
          className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg-secondary)] p-4 sm:p-6"
        >
          {children}
        </main>
      </div>

      <button
        type="button"
        onClick={() => openUpload()}
        aria-label="Upload files or folder"
        title="Upload"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-105 hover:bg-primary-hover hover:shadow-xl active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:bottom-8 sm:right-8"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <UploadDrawer
        isOpen={isUploadOpen}
        onClose={closeUpload}
        folderId={uploadFolderId}
      />
    </div>
  );
}
