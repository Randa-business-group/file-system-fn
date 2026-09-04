"use client";

import { createContext, useContext, ReactNode, useState } from "react";

export type UploadDrawerTab = "single" | "multiple" | "folder";

interface DashboardContextType {
  isUploadOpen: boolean;
  uploadFolderId: string | null;
  uploadInitialTab: UploadDrawerTab;
  openUpload: (folderId?: string | null, tab?: UploadDrawerTab) => void;
  closeUpload: () => void;
  setUploadFolderId: (folderId: string | null) => void;
  setUploadInitialTab: (tab: UploadDrawerTab) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [uploadInitialTab, setUploadInitialTab] = useState<UploadDrawerTab>("single");

  return (
    <DashboardContext.Provider
      value={{
        isUploadOpen,
        uploadFolderId,
        uploadInitialTab,
        openUpload: (folderId?: string | null, tab?: UploadDrawerTab) => {
          setUploadFolderId(folderId ?? null);
          setUploadInitialTab(tab ?? "single");
          setIsUploadOpen(true);
        },
        closeUpload: () => {
          setIsUploadOpen(false);
          setUploadFolderId(null);
          setUploadInitialTab("single");
        },
        setUploadFolderId,
        setUploadInitialTab,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
