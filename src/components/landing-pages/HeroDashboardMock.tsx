import {
  ChevronRight,
  Clock,
  File,
  FileText,
  Folder,
  FolderOpen,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Star,
  Table,
  Trash2,
  Upload,
  Users,
} from "lucide-react";

/* ── Tiny helper ─────────────────────────────────────────────── */
function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "green" | "blue" | "amber" }) {
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

/* ── Sidebar ─────────────────────────────────────────────────── */
function Sidebar() {
  const nav = [
    { icon: Home, label: "Dashboard", active: false },
    { icon: FolderOpen, label: "My Files", active: true },
    { icon: Share2, label: "Shared", active: false },
    { icon: LayoutGrid, label: "Collections", active: false },
    { icon: Users, label: "Members", active: false },
    { icon: Sparkles, label: "AI Classify", active: false },
  ];
  const bottom = [
    { icon: Settings, label: "Settings" },
    { icon: Trash2, label: "Trash" },
  ];

  return (
    <div className="flex w-[160px] shrink-0 flex-col border-r border-default bg-[var(--color-bg-secondary)]">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-default px-3 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-3 w-3 text-primary-foreground" />
        </div>
        <span className="text-xs font-semibold text-foreground">Bika-File</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 pt-2">
        {nav.map((item) => (
          <div
            key={item.label}
            className={[
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium",
              item.active
                ? "bg-primary-subtle text-primary"
                : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-default px-2 py-2">
        {bottom.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted"
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </div>
        ))}
      </div>

      {/* Storage */}
      <div className="border-t border-default px-3 py-2.5">
        <div className="flex items-center justify-between text-[10px] text-muted">
          <span>Storage</span>
          <span>42 / 75 GB</span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-[var(--color-bg-tertiary)]">
          <div className="h-full w-[56%] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}

/* ── File rows ───────────────────────────────────────────────── */
const FILES = [
  { name: "Q3 Financial Report.pdf", icon: FileText, size: "2.4 MB", date: "Today, 10:23", badge: "Classified", badgeVariant: "green" as const, starred: true },
  { name: "Employee Contracts", icon: Folder, size: "14 files", date: "Yesterday", badge: null, badgeVariant: "default" as const, starred: false },
  { name: "Board Meeting Notes.docx", icon: File, size: "840 KB", date: "Aug 28", badge: "Shared", badgeVariant: "blue" as const, starred: false },
  { name: "Company Logo Assets", icon: Folder, size: "8 files", date: "Aug 25", badge: null, badgeVariant: "default" as const, starred: true },
  { name: "Invoice-2024-0891.pdf", icon: FileText, size: "156 KB", date: "Aug 22", badge: "Processing", badgeVariant: "amber" as const, starred: false },
  { name: "Product Screenshots", icon: ImageIcon, size: "24 files", date: "Aug 20", badge: null, badgeVariant: "default" as const, starred: false },
  { name: "Client Data Export.xlsx", icon: Table, size: "3.1 MB", date: "Aug 18", badge: "Classified", badgeVariant: "green" as const, starred: false },
];

function FileRow({ file }: { file: typeof FILES[number] }) {
  const Icon = file.icon;
  const isFolder = file.icon === Folder;
  return (
    <div className="group flex items-center gap-3 border-b border-default px-4 py-2 transition hover:bg-[var(--color-bg-secondary)]">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isFolder ? "bg-amber-50 text-amber-500" : "bg-primary-subtle text-primary"}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-foreground">
          {file.name}
        </p>
      </div>
      {file.badge && <Badge variant={file.badgeVariant}>{file.badge}</Badge>}
      {file.starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
      <span className="hidden w-16 text-right text-[10px] text-muted sm:block">
        {file.size}
      </span>
      <span className="hidden w-20 text-right text-[10px] text-muted lg:block">
        {file.date}
      </span>
      <MoreHorizontal className="h-3.5 w-3.5 text-muted opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}

/* ── Main dashboard mock ─────────────────────────────────────── */
export function HeroDashboardMock() {
  return (
    <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
      {/* Glow effect behind */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-40 blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary-subtle) 0%, transparent 60%)",
        }}
      />

      {/* Dashboard frame */}
      <div className="relative overflow-hidden rounded-xl border border-default bg-surface shadow-xl">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-default bg-[var(--color-bg-secondary)] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 flex-1 rounded-md bg-[var(--color-bg-tertiary)] px-3 py-0.5 text-center text-[10px] text-muted">
            app.bikafile.com
          </span>
        </div>

        {/* App body */}
        <div className="flex" style={{ height: 340 }}>
          <Sidebar />

          {/* Content area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-default px-4 py-2">
              <div className="flex items-center gap-1 text-[11px] text-muted">
                <Home className="h-3 w-3" />
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-foreground">My Files</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-md border border-default bg-background px-2.5 py-1">
                  <Search className="h-3 w-3 text-muted" />
                  <span className="text-[10px] text-muted">Search files…</span>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground"
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 border-b border-default px-4 py-2">
              {[
                { icon: File, label: "Total files", value: "1,247" },
                { icon: Clock, label: "Recent", value: "23 today" },
                { icon: Share2, label: "Shared", value: "156" },
                { icon: Sparkles, label: "AI classified", value: "89%" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <stat.icon className="h-3 w-3 text-primary" />
                  <span className="text-[10px] text-muted">{stat.label}</span>
                  <span className="text-[10px] font-semibold text-foreground">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Column header */}
            <div className="flex items-center gap-3 border-b border-default bg-[var(--color-bg-secondary)] px-4 py-1.5">
              <div className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Name
              </div>
              <div className="w-16 text-right text-[10px] font-semibold uppercase tracking-wider text-muted hidden sm:block">
                Size
              </div>
              <div className="w-20 text-right text-[10px] font-semibold uppercase tracking-wider text-muted hidden lg:block">
                Modified
              </div>
              <div className="w-4" />
            </div>

            {/* File list */}
            <div className="flex-1 overflow-hidden">
              {FILES.map((file) => (
                <FileRow key={file.name} file={file} />
              ))}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between border-t border-default bg-[var(--color-bg-secondary)] px-4 py-1.5">
              <span className="text-[10px] text-muted">7 items · 3 folders, 4 files</span>
              <div className="flex items-center gap-1">
                <Plus className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium text-primary">New folder</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
