export const LANDING_NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/contact" },
] as const;

/** Hero demo video — paste a YouTube link or any direct .mp4 / .webm URL */
export const HERO_VIDEO = {
  url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
  title: "Product walkthrough",
  /** Optional custom poster; YouTube links auto-use the video thumbnail */
  posterUrl: undefined as string | undefined,
} as const;

/* ── Social proof stats shown in the hero ──────────────────── */
export const HERO_STATS = [
  { value: "500+", label: "Organizations" },
  { value: "50k+", label: "Documents managed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "4.8/5", label: "User satisfaction" },
] as const;

/* ── Problem section ───────────────────────────────────────── */
export const PROBLEM_POINTS = [
  {
    icon: "folder-x" as const,
    title: "Scattered files everywhere",
    description:
      "Important documents are buried in email threads, USB drives, WhatsApp groups, and random desktop folders. When you need a file urgently, nobody knows where it is.",
    cost: "Teams lose 2+ hours per day searching for documents",
  },
  {
    icon: "shield-off" as const,
    title: "Zero security or access control",
    description:
      "Anyone can copy, forward, or delete sensitive files. There's no audit trail, no permission system, and no way to know who accessed what.",
    cost: "One data leak can cost your organization millions in damages",
  },
  {
    icon: "users-x" as const,
    title: "Collaboration is a nightmare",
    description:
      "Sharing files means sending attachments back and forth. Version conflicts, duplicate files, and missed updates slow your entire team down.",
    cost: "30% of team productivity lost to file management chaos",
  },
] as const;

/* ── Solution / Features ───────────────────────────────────── */
export type FeatureShowcaseIcon =
  | "cloud"
  | "share"
  | "shield"
  | "link"
  | "users"
  | "sparkles"
  | "search"
  | "settings";

export interface FeatureShowcase {
  id: string;
  title: string;
  benefit: string;
  subtitle?: string;
  bullets: string[];
  imageSide: "left" | "right";
  icon: FeatureShowcaseIcon;
  image: string;
  imageLabel: string;
}

/** Features shown on the landing page — 6 core features with benefits */
export const LANDING_FEATURES: FeatureShowcase[] = [
  {
    id: "secure-vault",
    title: "One secure vault for all your documents",
    benefit: "Never lose a file again",
    subtitle:
      "Replace scattered drives, email attachments, and USB sticks with a single, organized digital workspace.",
    bullets: [
      "Upload PDFs, Word docs, spreadsheets, images — any file type",
      "Organize with folders, collections, and smart categories",
      "Every file is encrypted, backed up, and always accessible",
    ],
    imageSide: "right",
    icon: "cloud",
    image: "/file-vault-2.png",
    imageLabel: "Secure document vault",
  },
  {
    id: "ai-organization",
    title: "AI classifies and organizes your files automatically",
    benefit: "Save hours of manual sorting",
    subtitle:
      "Just upload — our AI reads, classifies, and routes documents to the right folders and categories.",
    bullets: [
      "Bulk upload with automatic OCR text extraction",
      "AI classification assigns categories and metadata instantly",
      "Processing tray shows real-time status for every document",
    ],
    imageSide: "left",
    icon: "sparkles",
    image: "/organize.png",
    imageLabel: "AI-powered organization",
  },
  {
    id: "team-collaboration",
    title: "Share and collaborate without the chaos",
    benefit: "Your whole team, one workspace",
    subtitle:
      "Create shared spaces for departments, branches, and external partners — with full control over who sees what.",
    bullets: [
      "Shared folders and collections for seamless teamwork",
      "Role-based access: owners, managers, and members",
      "Inbox-style file sharing — no more email attachments",
    ],
    imageSide: "right",
    icon: "users",
    image: "/share.png",
    imageLabel: "Team collaboration",
  },
  {
    id: "enterprise-security",
    title: "Enterprise-grade security built in",
    benefit: "Sleep easy knowing your data is protected",
    subtitle:
      "Two-factor authentication, encrypted sessions, and granular permissions protect every document.",
    bullets: [
      "Email verification and 2FA for every account",
      "Encrypted sessions with secure token management",
      "Activity logs so you always know who accessed what",
    ],
    imageSide: "left",
    icon: "shield",
    image: "/2fa.png",
    imageLabel: "Enterprise security",
  },
  {
    id: "instant-search",
    title: "Find any document in seconds",
    benefit: "Stop wasting time searching",
    subtitle:
      "Powerful search across all folders, collections, shared spaces, and even document content.",
    bullets: [
      "Global search from anywhere in the dashboard",
      "Filter by folder, collection, category, and file type",
      "Preview documents instantly — PDFs, images, and more",
    ],
    imageSide: "right",
    icon: "search",
    image: "/search.png",
    imageLabel: "Instant search",
  },
  {
    id: "access-anywhere",
    title: "Access your files from anywhere, any device",
    benefit: "Work from office, home, or on the go",
    subtitle:
      "Your vault stays in sync across every device. No software to install — just open your browser.",
    bullets: [
      "Access from desktop, tablet, and mobile browsers",
      "Enable remote work with a single secure workspace",
      "Always open the latest version — no sync conflicts",
    ],
    imageSide: "left",
    icon: "cloud",
    image: "/access.png",
    imageLabel: "Access from anywhere",
  },
];

/** Full feature list for /features page — includes the landing features plus extras */
export const FEATURE_SHOWCASES: FeatureShowcase[] = [
  ...LANDING_FEATURES,
  {
    id: "file-sharing",
    title: "Send and receive files securely",
    benefit: "Replace messy email attachments",
    subtitle:
      "Share documents with clients and teammates without email attachments or scattered links.",
    bullets: [
      "Share files and folders with inbox-style delivery to the right people",
      "Control access with organization roles and shared-space membership",
      "Recipients get instant access inside Bika-File — no messy file transfers",
    ],
    imageSide: "right",
    icon: "link",
    image: "/sent.png",
    imageLabel: "Secure file sharing",
  },
  {
    id: "admin-tools",
    title: "Admin tools to manage your entire organization",
    benefit: "Full control from one dashboard",
    subtitle:
      "Owners and managers get the controls they need to onboard teams and stay compliant.",
    bullets: [
      "Provision members with invitations, branches, and departments",
      "Organization settings, logo, and profile management in one place",
      "Trash, recovery, and audit-friendly document lifecycle controls",
    ],
    imageSide: "left",
    icon: "settings",
    image: "/manage.png",
    imageLabel: "Admin controls",
  },
];

/* ── How it works ────────────────────────────────────────────── */
export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Create your workspace",
    description:
      "Sign up, name your organization, and invite your team. Takes less than 2 minutes.",
    icon: "building" as const,
  },
  {
    step: "02",
    title: "Upload your documents",
    description:
      "Drag and drop files or upload in bulk. AI automatically classifies and organizes everything.",
    icon: "upload" as const,
  },
  {
    step: "03",
    title: "Share and collaborate",
    description:
      "Set permissions, create shared spaces, and start working together securely — all from one dashboard.",
    icon: "shield" as const,
  },
];

/* ── Pricing plans (from Bikafile Final Pricing — locked 12 months) ── */
export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 8_000,
    currency: "RWF",
    period: "per month",
    description: "For small teams and startups getting organized.",
    highlighted: false,
    cta: "Get started",
    features: [
      "Up to 5 users",
      "30 GB secure storage",
      "25 GB preview/download per month",
      "AI metadata tagging",
      "Smart search",
      "Basic collections",
      "Email support (48h response)",
      "Self-serve onboarding",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 13_000,
    currency: "RWF",
    period: "per month",
    description: "For growing teams that need collaboration and compliance.",
    highlighted: true,
    cta: "Start free trial",
    features: [
      "Up to 20 users",
      "75 GB secure storage",
      "35 GB preview/download per month",
      "AI metadata tagging",
      "Smart search",
      "Unlimited collections",
      "NCSA-compliant cross-border storage",
      "Priority email/chat support (24h)",
      "Guided setup & onboarding",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 18_000,
    currency: "RWF",
    period: "per month",
    description: "For organizations that need full control and compliance.",
    highlighted: false,
    cta: "Contact sales",
    features: [
      "Unlimited users",
      "120 GB secure storage",
      "45 GB preview/download per month",
      "AI tagging + custom taxonomy",
      "Unlimited collections + cross-department sharing",
      "Internal file sharing between users",
      "Full compliance package + audit logs",
      "Dedicated support + custom SLA",
      "Full onboarding + staff training",
    ],
  },
];

/* ── FAQ ──────────────────────────────────────────────────────── */
export const FAQ_ITEMS = [
  {
    question: "How long does it take to set up?",
    answer:
      "Less than 5 minutes. Sign up, create your organization, invite your team, and start uploading. No installation required — it all runs in your browser.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use encrypted sessions, two-factor authentication, and role-based access controls. Every file is stored securely with automatic backups. You always know who accessed which document.",
  },
  {
    question: "Can I try it before paying?",
    answer:
      "Yes! Our Professional plan comes with a free trial so you can explore all features risk-free. No credit card required to start.",
  },
  {
    question: "What file types are supported?",
    answer:
      "Bika-File supports all common file types: PDFs, Word documents (.docx), Excel spreadsheets (.xlsx), CSV files, images (PNG, JPG), and more. You can preview most document types directly in your browser.",
  },
  {
    question: "How does AI classification work?",
    answer:
      "When you upload documents, our AI uses OCR to extract text and then automatically classifies each file into categories. It assigns metadata and routes files to the right folders — saving you hours of manual sorting.",
  },
  {
    question: "Can I control who sees which documents?",
    answer:
      "Yes. Bika-File has granular role-based permissions. Organization owners, managers, and members all have different access levels. You can create shared spaces with specific people and control read/edit access per folder.",
  },
  {
    question: "Do you offer support for larger organizations?",
    answer:
      "Yes. Our Enterprise plan includes a dedicated account manager, custom onboarding, SLAs, and API access. Contact us to discuss your organization's specific needs.",
  },
  {
    question: "Can I access my files from my phone?",
    answer:
      "Yes. Bika-File works on any device with a modern browser — desktop, tablet, or mobile. No app download needed. Your files are always in sync.",
  },
];

/* ── Footer ──────────────────────────────────────────────────── */
export const FOOTER_CONTACT = {
  email: "hello@bikafile.app",
  phone: "+250 788 000 000",
  location: "Kigali, Rwanda · Remote-first team",
} as const;

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "FAQ", href: "/#faq" },
  ],
  account: [
    { label: "Sign in", href: "/login" },
    { label: "Create account", href: "/register" },
    { label: "Forgot password", href: "/forgot-password" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  support: [
    { label: "Contact us", href: "/contact" },
    { label: "Home", href: "/" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/contact" },
    { label: "Terms of Service", href: "/contact" },
    { label: "Security", href: "/contact" },
  ],
} as const;
