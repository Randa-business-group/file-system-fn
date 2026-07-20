export const LANDING_NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact", href: "/contact" },
] as const;

/** Hero demo video — paste a YouTube link or any direct .mp4 / .webm URL */
export const HERO_VIDEO = {
  url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
  title: "Product walkthrough",
  /** Optional custom poster; YouTube links auto-use the video thumbnail */
  posterUrl: undefined as string | undefined,
} as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Create your workspace",
    description:
      "Register your organization, invite your team, and set up branches or departments in minutes.",
    icon: "building" as const,
  },
  {
    step: "02",
    title: "Upload and organize",
    description:
      "Drop files into folders, collections, or shared spaces. AI helps classify and tag documents automatically.",
    icon: "upload" as const,
  },
  {
    step: "03",
    title: "Collaborate securely",
    description:
      "Share documents with role-based access, track activity, and keep everything searchable in one vault.",
    icon: "shield" as const,
  },
  {
    step: "04",
    title: "Scale with confidence",
    description:
      "From solo operators to enterprise teams — FileVault grows with your document workflows.",
    icon: "chart" as const,
  },
];

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
  subtitle?: string;
  bullets: string[];
  imageSide: "left" | "right";
  icon: FeatureShowcaseIcon;
  image: string;
  imageLabel: string;
}

/** Full feature list for /features — Sync-style alternating blocks with image area */
export const FEATURE_SHOWCASES: FeatureShowcase[] = [
  {
    id: "access-anywhere",
    title: "Access your files anywhere, any time",
    subtitle:
      "Work from the office, from home, or on the go — your vault stays in sync across every device.",
    bullets: [
      "Access documents instantly from desktop, tablet, and mobile browsers",
      "Enable remote work for your entire team with a single secure workspace",
      "Never worry about version chaos — always open the latest file in FileVault",
    ],
    imageSide: "right",
    icon: "cloud",
    image: "/access.png",
    imageLabel: "Access from anywhere",
  },
  {
    id: "secure-collaboration",
    title: "Share and collaborate securely with anyone",
    subtitle:
      "Create shared spaces and collections your internal team and external partners can access safely.",
    bullets: [
      "Centralize folders for departments, branches, and client projects",
      "Manage permissions with role-based access for owners, managers, and members",
      "Keep sensitive work protected with granular sharing controls",
    ],
    imageSide: "left",
    icon: "users",
    image: "/share.png",
    imageLabel: "Secure collaboration",
  },
  {
    id: "enterprise-security",
    title: "Keep your work safe, secure, and private",
    subtitle:
      "Enterprise-grade authentication and organization controls built for teams that take security seriously.",
    bullets: [
      "Email verification and two-factor authentication (2FA) for every account",
      "Encrypted sessions with refresh-token protection and secure logout",
      "Activity-aware sharing so you always know who accessed what",
    ],
    imageSide: "right",
    icon: "shield",
    image: "/2fa.png",
    imageLabel: "Enterprise security",
  },
  {
    id: "file-sharing",
    title: "Send and receive files securely",
    subtitle:
      "Share documents with clients and teammates without email attachments or scattered links.",
    bullets: [
      "Share files and folders with inbox-style delivery to the right people",
      "Control access with organization roles and shared-space membership",
      "Recipients get instant access inside FileVault — no messy file transfers",
    ],
    imageSide: "left",
    icon: "link",
    image: "/sent.png",
    imageLabel: "Secure file sharing",
  },
  {
    id: "team-workspaces",
    title: "Collaborate and share privately",
    subtitle:
      "Replace scattered drives and email threads with one organized document hub.",
    bullets: [
      "Team shared folders, collections, and unsorted tray for incoming files",
      "Read-only and edit rules so recipients cannot change the owner's documents",
      "Notifications and activity awareness for shares, uploads, and updates",
    ],
    imageSide: "right",
    icon: "share",
    image: "/shared.png",
    imageLabel: "Team workspaces",
  },
  {
    id: "ai-organization",
    title: "Organize faster with AI-assisted workflows",
    subtitle:
      "Upload in bulk, classify automatically, and route documents to the right place.",
    bullets: [
      "Bulk upload with OCR and AI classification per file",
      "Smart categories and metadata to find documents in seconds",
      "Processing tray so your team always knows what's still being analyzed",
    ],
    imageSide: "left",
    icon: "sparkles",
    image: "/organize.png",
    imageLabel: "AI organization",
  },
  {
    id: "powerful-search",
    title: "Find anything in your vault instantly",
    subtitle:
      "Search across folders, collections, shared spaces, and document content.",
    bullets: [
      "Global search from anywhere in the dashboard",
      "Filter by folder, collection, category, and sharing context",
      "Preview documents without downloading — PDFs, images, and more",
    ],
    imageSide: "right",
    icon: "search",
    image: "/search.png",
    imageLabel: "Powerful search",
  },
  {
    id: "admin-tools",
    title: "Admin tools to manage your entire organization",
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

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 19,
    period: "per user / month",
    description: "For individuals and small teams getting started.",
    highlighted: false,
    cta: "Get started",
    features: [
      "Up to 5 team members",
      "50 GB secure storage",
      "Folder & collection organization",
      "Basic document search",
      "Email support",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 49,
    period: "per user / month",
    description: "For growing teams that need collaboration and control.",
    highlighted: true,
    cta: "Start free trial",
    features: [
      "Up to 50 team members",
      "500 GB secure storage",
      "Shared spaces & inbox sharing",
      "AI document classification",
      "Role-based permissions",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    period: "Custom pricing",
    description: "Advanced security, compliance, and dedicated support.",
    highlighted: false,
    cta: "Contact sales",
    features: [
      "Unlimited team members",
      "Custom storage limits",
      "SSO & advanced 2FA",
      "Audit logs & compliance",
      "Dedicated account manager",
      "SLA & onboarding",
    ],
  },
];

export const FOOTER_CONTACT = {
  email: "hello@filevault.app",
  phone: "+1 (555) 012-3456",
  location: "Kigali, Rwanda · Remote-first team",
} as const;

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "How it works", href: "/#how-it-works" },
  ],
  account: [
    { label: "Sign in", href: "/login" },
    { label: "Create account", href: "/register" },
    { label: "Forgot password", href: "/forgot-password" },
  ],
  support: [
    { label: "Contact us", href: "/contact" },
    { label: "Home", href: "/" },
  ],
} as const;
