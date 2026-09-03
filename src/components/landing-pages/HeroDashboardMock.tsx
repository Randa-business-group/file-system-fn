"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  File,
  FileText,
  Folder,
  FolderOpen,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Star,
  Table,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { LandingBrandLogo } from "./LandingBrandLogo";

/* ── Tiny helper — exact original backgrounds ────────────────── */
function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "green" | "blue" | "amber";
}) {
  const cls = {
    default: "bg-[var(--color-bg-tertiary)] text-muted",
    green: "bg-primary-subtle text-primary",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  }[variant];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

/* ── Initial Mock Datasets ───────────────────────────────────── */
interface MockFile {
  id: number;
  name: string;
  icon: typeof FileText;
  size: string;
  date: string;
  badge: string | null;
  badgeVariant: "default" | "green" | "blue" | "amber";
  starred: boolean;
  summary?: string;
}

const DEFAULT_FILES: MockFile[] = [
  {
    id: 1,
    name: "Q3 Financial Report.pdf",
    icon: FileText,
    size: "2.4 MB",
    date: "Today, 10:23",
    badge: "Classified",
    badgeVariant: "green",
    starred: true,
    summary: "Revenue surged by 34% in Q3. Operating expenses reduced by 12% following automated document processing.",
  },
  {
    id: 2,
    name: "Employee Contracts",
    icon: Folder,
    size: "14 files",
    date: "Yesterday",
    badge: null,
    badgeVariant: "default",
    starred: false,
    summary: "14 onboarding contracts signed and verified with biometric audit trail compliance.",
  },
  {
    id: 3,
    name: "Board Meeting Notes.docx",
    icon: File,
    size: "840 KB",
    date: "Aug 28",
    badge: "Shared",
    badgeVariant: "blue",
    starred: false,
    summary: "Key decisions on international expansion and Q4 roadmap approvals by the executive board.",
  },
  {
    id: 4,
    name: "Company Logo Assets",
    icon: Folder,
    size: "8 files",
    date: "Aug 25",
    badge: null,
    badgeVariant: "default",
    starred: true,
    summary: "SVG vectors, brand color guides, and icon sets for dark and light modes.",
  },
  {
    id: 5,
    name: "Invoice-2024-0891.pdf",
    icon: FileText,
    size: "156 KB",
    date: "Aug 22",
    badge: "Processing",
    badgeVariant: "amber",
    starred: false,
    summary: "Supplier invoice pending tax verification and department approval.",
  },
  {
    id: 6,
    name: "Product Screenshots",
    icon: ImageIcon,
    size: "24 files",
    date: "Aug 20",
    badge: null,
    badgeVariant: "default",
    starred: false,
    summary: "High-resolution product walkthrough UI captures for marketing releases.",
  },
  {
    id: 7,
    name: "Client Data Export.xlsx",
    icon: Table,
    size: "3.1 MB",
    date: "Aug 18",
    badge: "Classified",
    badgeVariant: "green",
    starred: false,
    summary: "Aggregated customer metrics and renewal rates across 4 active regions.",
  },
];

const SHARED_FILES: MockFile[] = [
  {
    id: 101,
    name: "Brand Campaign Q4.pdf",
    icon: FileText,
    size: "4.8 MB",
    date: "Today, 09:12",
    badge: "Shared",
    badgeVariant: "blue",
    starred: true,
    summary: "Collaborative marketing plan shared with the external PR agency.",
  },
  {
    id: 102,
    name: "Partnership Agreement.docx",
    icon: File,
    size: "1.2 MB",
    date: "2 days ago",
    badge: "Classified",
    badgeVariant: "green",
    starred: false,
    summary: "Mutual NDA and service-level agreement between enterprise stakeholders.",
  },
  {
    id: 103,
    name: "Engineering Architecture.pdf",
    icon: FileText,
    size: "6.5 MB",
    date: "Aug 15",
    badge: "Shared",
    badgeVariant: "blue",
    starred: false,
    summary: "Zero-knowledge encryption spec and vault clustering architecture.",
  },
];

const COLLECTIONS: MockFile[] = [
  {
    id: 201,
    name: "Tax & Compliance 2024",
    icon: Folder,
    size: "32 files",
    date: "Updated today",
    badge: "Classified",
    badgeVariant: "green",
    starred: true,
    summary: "Verified annual financial audit filings, certificates, and compliance reports.",
  },
  {
    id: 202,
    name: "Executive Strategy & OKRs",
    icon: Folder,
    size: "19 files",
    date: "Aug 29",
    badge: "Shared",
    badgeVariant: "blue",
    starred: false,
    summary: "Confidential company objectives, KPI benchmarks, and board presentations.",
  },
  {
    id: 203,
    name: "Client Pitch Decks",
    icon: Folder,
    size: "12 files",
    date: "Aug 24",
    badge: null,
    badgeVariant: "default",
    starred: false,
    summary: "High-converting enterprise pitch materials and proposal templates.",
  },
];

const TRASH_FILES: MockFile[] = [
  {
    id: 301,
    name: "Draft_Notes_old.txt",
    icon: FileText,
    size: "12 KB",
    date: "Deleted Aug 21",
    badge: null,
    badgeVariant: "default",
    starred: false,
    summary: "Temporary scratch notes marked for deletion.",
  },
];

const RANDOM_NEW_FILES: Array<Omit<MockFile, "id">> = [
  {
    name: "Q4 Marketing Plan.pdf",
    icon: FileText,
    size: "1.8 MB",
    date: "Just now",
    badge: "Classified",
    badgeVariant: "green",
    starred: false,
    summary: "AI Auto-tagged: Marketing, Q4, Strategy. Verified and indexed in 0.2s.",
  },
  {
    name: "Vendor Contract Signed.docx",
    icon: File,
    size: "920 KB",
    date: "Just now",
    badge: "Classified",
    badgeVariant: "green",
    starred: true,
    summary: "AI Auto-tagged: Legal, Contract, Vendor. Fully searchable text extracted.",
  },
  {
    name: "Annual Budget 2025.xlsx",
    icon: Table,
    size: "2.1 MB",
    date: "Just now",
    badge: "Classified",
    badgeVariant: "green",
    starred: false,
    summary: "AI Auto-tagged: Finance, Budget. 24 sheet tables categorized automatically.",
  },
];

/* ── Sidebar ─────────────────────────────────────────────────── */
function Sidebar({
  activeTab,
  onSelectTab,
  storageWidth,
}: {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  storageWidth: number;
}) {
  const nav = [
    { icon: Home, label: "Dashboard" },
    { icon: FolderOpen, label: "My Files" },
    { icon: Share2, label: "Shared" },
    { icon: LayoutGrid, label: "Collections" },
    { icon: Users, label: "Members" },
    { icon: Sparkles, label: "AI Classify" },
  ];
  const bottom = [
    { icon: Settings, label: "Settings" },
    { icon: Trash2, label: "Trash" },
  ];

  return (
    <div className="flex w-[160px] shrink-0 flex-col border-r border-default bg-[var(--color-bg-secondary)]">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-default px-3 py-2.5">
        <LandingBrandLogo />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 pt-2">
        {nav.map((item) => {
          const isActive = activeTab === item.label;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectTab(item.label)}
              className={[
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[11px] font-medium transition-all duration-150 active:scale-98",
                isActive
                  ? "bg-primary-subtle text-primary"
                  : "text-muted hover:text-foreground",
              ].join(" ")}
            >
              <item.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-default px-2 py-2">
        {bottom.map((item) => {
          const isActive = activeTab === item.label;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectTab(item.label)}
              className={[
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[11px] font-medium transition-colors",
                isActive
                  ? "bg-primary-subtle text-primary"
                  : "text-muted hover:text-foreground",
              ].join(" ")}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Storage */}
      <div className="border-t border-default px-3 py-2.5">
        <div className="flex items-center justify-between text-[10px] text-muted">
          <span>Storage</span>
          <span>42 / 75 GB</span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-[var(--color-bg-tertiary)]">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${storageWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── File Row with interactive Star, Click Preview, and Context Menu ── */
function FileRow({
  file,
  onToggleStar,
  onSelectFile,
  onDeleteFile,
  isSelected,
}: {
  file: MockFile;
  onToggleStar: (id: number) => void;
  onSelectFile: (file: MockFile) => void;
  onDeleteFile: (id: number) => void;
  isSelected: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = file.icon;
  const isFolder = file.icon === Folder;

  return (
    <div
      onClick={() => onSelectFile(file)}
      className={`group relative flex cursor-pointer items-center gap-3 border-b border-default px-4 py-2 transition-colors ${
        isSelected
          ? "bg-primary-subtle/40"
          : "hover:bg-[var(--color-bg-secondary)]"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm transition-transform group-hover:scale-105 ${
          isFolder ? "bg-amber-50 text-amber-500" : "bg-primary-subtle text-primary"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-foreground transition-colors group-hover:text-primary">
          {file.name}
        </p>
      </div>

      {file.badge && <Badge variant={file.badgeVariant}>{file.badge}</Badge>}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(file.id);
        }}
        title={file.starred ? "Unstar" : "Star"}
        className="rounded p-0.5 transition-transform hover:scale-125 focus:outline-hidden"
      >
        <Star
          className={`h-3 w-3 transition-colors ${
            file.starred
              ? "fill-amber-400 text-amber-400"
              : "text-muted hover:text-amber-400"
          }`}
        />
      </button>

      <span className="hidden w-16 text-right text-[10px] text-muted sm:block font-mono">
        {file.size}
      </span>

      <span className="hidden w-20 text-right text-[10px] text-muted lg:block">
        {file.date}
      </span>

      {/* Action menu trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="rounded p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
          title="More actions"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>

        {showMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-6 z-30 w-28 rounded-md border border-default bg-surface py-1 shadow-lg text-[10px]"
          >
            <button
              type="button"
              onClick={() => {
                onSelectFile(file);
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-1.5 px-2.5 py-1 text-left text-foreground hover:bg-[var(--color-bg-secondary)]"
            >
              <Eye className="h-3 w-3 text-muted" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleStar(file.id);
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-1.5 px-2.5 py-1 text-left text-foreground hover:bg-[var(--color-bg-secondary)]"
            >
              <Star className="h-3 w-3 text-amber-400" />
              {file.starred ? "Unstar" : "Star"}
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteFile(file.id);
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-1.5 px-2.5 py-1 text-left text-error hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Interactive Inline File Preview Drawer ──────────────────── */
function FilePreviewModal({
  file,
  onClose,
}: {
  file: MockFile;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const Icon = file.icon;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 top-[84px] z-20 flex flex-col border-t border-default bg-surface p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-default pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary-subtle text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div>
            <h4 className="text-[12px] font-semibold text-foreground truncate max-w-[240px] sm:max-w-md">
              {file.name}
            </h4>
            <p className="text-[10px] text-muted">
              {file.size} · Modified {file.date}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-muted hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
          title="Close preview"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {/* AI Insight Box */}
        <div className="rounded-md border border-default bg-[var(--color-bg-secondary)] p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" />
            <span>AI Document Intelligence</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-secondary">
            {file.summary || "Document indexed with full-text optical character recognition and metadata tagging."}
          </p>
        </div>

        {/* Security & Access */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-md border border-default p-2">
            <span className="text-muted">Encryption</span>
            <p className="font-medium text-foreground">AES-256 at rest</p>
          </div>
          <div className="rounded-md border border-default p-2">
            <span className="text-muted">Access Level</span>
            <p className="font-medium text-foreground">Workspace Members</p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between border-t border-default pt-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-sm border border-default bg-surface px-2.5 py-1 text-[10px] font-medium text-foreground hover:bg-[var(--color-bg-secondary)] active:scale-95"
        >
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-muted" />}
          <span>{copied ? "Link Copied!" : "Copy Link"}</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 rounded-sm bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground hover:bg-primary-hover active:scale-95"
        >
          <Download className="h-3 w-3" />
          <span>Download File</span>
        </button>
      </div>
    </div>
  );
}

/* ── Main Dashboard Mock ─────────────────────────────────────── */
export function HeroDashboardMock() {
  const [activeTab, setActiveTab] = useState("My Files");
  const [files, setFiles] = useState<MockFile[]>(DEFAULT_FILES);
  const [searchQuery, setSearchQuery] = useState("");
  const [storageWidth, setStorageWidth] = useState(0);
  const [selectedFile, setSelectedFile] = useState<MockFile | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Smooth storage progress bar animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setStorageWidth(56);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Show a temporary fun notice banner
  const triggerBanner = (msg: string) => {
    setBannerNotice(msg);
    const timer = setTimeout(() => {
      setBannerNotice(null);
    }, 2800);
    return () => clearTimeout(timer);
  };

  // Switch tabs & change dataset
  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setSelectedFile(null);
    setSearchQuery("");

    if (tab === "My Files") {
      setFiles(DEFAULT_FILES);
    } else if (tab === "Shared") {
      setFiles(SHARED_FILES);
      triggerBanner("👥 Showing 3 files shared across your organization");
    } else if (tab === "Collections") {
      setFiles(COLLECTIONS);
      triggerBanner("📁 Browsing department collection vaults");
    } else if (tab === "Trash") {
      setFiles(TRASH_FILES);
      triggerBanner("🗑️ Trash vault: items permanently purged after 30 days");
    } else if (tab === "AI Classify") {
      setFiles(DEFAULT_FILES);
      runAiScan();
    } else {
      triggerBanner(`Navigated to ${tab}`);
    }
  };

  // Fun interactive AI Scan
  const runAiScan = () => {
    setIsScanning(true);
    triggerBanner("✨ AI is analyzing document text and auto-tagging metadata...");
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          badge: "Classified",
          badgeVariant: "green",
        }))
      );
      setIsScanning(false);
      triggerBanner("✅ All 7 documents classified and verified!");
    }, 1200);
  };

  // Fun traffic light interactions
  const handleRedClick = () => {
    setIsShaking(true);
    triggerBanner("😊 Nice try! Bika-File stays open and secure 24/7");
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleYellowClick = () => {
    triggerBanner("⚡ Pro tip: Use keyboard shortcut ⌘K to search anywhere");
  };

  const handleGreenClick = () => {
    setIsMaximized(!isMaximized);
    triggerBanner(isMaximized ? "Returned to standard view" : "Expanded file workspace");
  };

  // Toggle favorite star
  const handleToggleStar = (id: number) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f))
    );
  };

  // Delete file
  const handleDeleteFile = (id: number) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFile?.id === id) setSelectedFile(null);
    triggerBanner("File moved to trash. Click 'Trash' in sidebar to view.");
  };

  // Interactive Upload simulation
  const handleUploadClick = () => {
    const randomPick =
      RANDOM_NEW_FILES[Math.floor(Math.random() * RANDOM_NEW_FILES.length)];
    const newFile: MockFile = {
      ...randomPick,
      id: Date.now(),
    };
    setFiles((prev) => [newFile, ...prev]);
    triggerBanner(`🚀 Uploaded & AI-indexed: "${newFile.name}" in 0.3s!`);
  };

  // Interactive New Folder
  const handleNewFolder = () => {
    const folderName = `New Project (${files.filter((f) => f.icon === Folder).length + 1})`;
    const newFolder: MockFile = {
      id: Date.now(),
      name: folderName,
      icon: Folder,
      size: "0 files",
      date: "Just now",
      badge: null,
      badgeVariant: "default",
      starred: false,
      summary: "Empty project folder ready for documents and collaboration.",
    };
    setFiles((prev) => [newFolder, ...prev]);
    triggerBanner(`📁 Created folder: "${folderName}"`);
  };

  // Filter files by live search
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`relative mx-auto w-full max-w-2xl lg:max-w-none transition-transform duration-200 ${
        isShaking ? "animate-bounce" : ""
      }`}
    >
      {/* Glow effect behind — exact original */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-40 blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary-subtle) 0%, transparent 60%)",
        }}
      />

      {/* Dashboard frame — exact original rounded-md, border, shadow-xl */}
      <div className="relative overflow-hidden rounded-md border border-default bg-surface shadow-xl">
        {/* Window chrome — interactive traffic lights */}
        <div className="flex items-center gap-1.5 border-b border-default bg-[var(--color-bg-secondary)] px-3 py-2">
          <button
            type="button"
            onClick={handleRedClick}
            className="h-2.5 w-2.5 rounded-full bg-red-400 transition-transform hover:scale-125 focus:outline-hidden"
            title="Close window"
          />
          <button
            type="button"
            onClick={handleYellowClick}
            className="h-2.5 w-2.5 rounded-full bg-amber-400 transition-transform hover:scale-125 focus:outline-hidden"
            title="Minimize"
          />
          <button
            type="button"
            onClick={handleGreenClick}
            className="h-2.5 w-2.5 rounded-full bg-green-400 transition-transform hover:scale-125 focus:outline-hidden"
            title="Toggle expansion"
          />
          <span className="ml-3 flex-1 rounded-md bg-[var(--color-bg-tertiary)] px-3 py-0.5 text-center text-[10px] text-muted font-mono select-none">
            app.bikafile.com
          </span>
        </div>

        {/* App body */}
        <div
          className="relative flex transition-all duration-300"
          style={{ height: isMaximized ? 420 : 340 }}
        >
          <Sidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            storageWidth={storageWidth}
          />

          {/* Content area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar — with real working search and upload */}
            <div className="flex items-center gap-2 border-b border-default px-4 py-2">
              <div className="flex items-center gap-1 text-[11px] text-muted">
                <Home className="h-3 w-3" />
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-foreground">{activeTab}</span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* Real working live search */}
                <div className="flex items-center gap-1.5 rounded-sm border border-default bg-background px-2.5 py-1">
                  <Search className="h-3 w-3 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files…"
                    className="w-24 sm:w-32 bg-transparent text-[10px] text-foreground placeholder:text-muted focus:outline-hidden"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-muted hover:text-foreground"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>

                {/* Interactive upload button */}
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="flex items-center gap-1 rounded-sm bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-95"
                >
                  <Upload className="h-3 w-3" />
                  <span>Upload</span>
                </button>
              </div>
            </div>

            {/* Interactive Stats row with tab filters */}
            <div className="flex items-center gap-4 border-b border-default px-4 py-2">
              <button
                type="button"
                onClick={() => handleSelectTab("My Files")}
                className="flex items-center gap-1.5 text-left text-muted hover:text-foreground transition-colors"
              >
                <File className="h-3 w-3 text-primary" />
                <span className="text-[10px]">Total files</span>
                <span className="text-[10px] font-semibold text-foreground">
                  {1240 + files.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("Shared")}
                className="flex items-center gap-1.5 text-left text-muted hover:text-foreground transition-colors"
              >
                <Share2 className="h-3 w-3 text-primary" />
                <span className="text-[10px]">Shared</span>
                <span className="text-[10px] font-semibold text-foreground">156</span>
              </button>

              <button
                type="button"
                onClick={runAiScan}
                className="flex items-center gap-1.5 text-left text-muted hover:text-foreground transition-colors group/ai"
                title="Click to trigger AI auto-scan"
              >
                <Sparkles className={`h-3 w-3 text-primary ${isScanning ? "animate-spin" : "group-hover/ai:scale-125 transition-transform"}`} />
                <span className="text-[10px]">AI classified</span>
                <span className="text-[10px] font-semibold text-foreground">
                  {isScanning ? "Scanning…" : "100%"}
                </span>
              </button>
            </div>

            {/* Column header — exact original */}
            <div className="flex items-center gap-3 border-b border-default bg-[var(--color-bg-secondary)] px-4 py-1.5">
              <div className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Name
              </div>
              <div className="hidden w-16 text-right text-[10px] font-semibold uppercase tracking-wider text-muted sm:block">
                Size
              </div>
              <div className="hidden w-20 text-right text-[10px] font-semibold uppercase tracking-wider text-muted lg:block">
                Modified
              </div>
              <div className="w-4" />
            </div>

            {/* File list — with interactive preview, star, and delete */}
            <div className="relative flex-1 overflow-y-auto">
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onToggleStar={handleToggleStar}
                    onSelectFile={(f) => setSelectedFile(f)}
                    onDeleteFile={handleDeleteFile}
                    isSelected={selectedFile?.id === file.id}
                  />
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <Search className="h-6 w-6 text-muted" />
                  <p className="mt-2 text-[11px] font-medium text-foreground">
                    No files found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    Try searching &ldquo;pdf&rdquo;, &ldquo;folder&rdquo;, or &ldquo;report&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-2.5 text-[10px] font-semibold text-primary hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {/* Inline File Preview Drawer */}
              {selectedFile && (
                <FilePreviewModal
                  file={selectedFile}
                  onClose={() => setSelectedFile(null)}
                />
              )}
            </div>

            {/* Bottom bar — interactive + New Folder */}
            <div className="flex items-center justify-between border-t border-default bg-[var(--color-bg-secondary)] px-4 py-1.5">
              <span className="text-[10px] text-muted font-mono">
                {filteredFiles.length} items · Click any file to preview
              </span>
              <button
                type="button"
                onClick={handleNewFolder}
                className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-primary hover:text-primary-hover active:scale-95 transition-transform"
                title="Add new folder"
              >
                <Plus className="h-3 w-3" />
                <span className="text-[10px] font-medium">New folder</span>
              </button>
            </div>
          </div>
        </div>

        {/* Temporary Fun Toast Banner (slides in at bottom of window chrome) */}
        {bannerNotice && (
          <div className="absolute top-8 inset-x-0 z-30 flex justify-center pointer-events-none">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-default bg-surface px-3 py-1 shadow-md text-[10px] font-medium text-foreground animate-fade-in-up">
              <span>{bannerNotice}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
