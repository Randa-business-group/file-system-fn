 File System FN — Frontend

A multi-tenant Document Management System frontend built with Next.js and Tailwind CSS. Enables organizations to digitize, organize, search and manage physical documents through a clean and intuitive interface.


🚀 Tech Stack
LayerTechnologyFrameworkNext.js 14 (App Router)LanguageTypeScriptStylingTailwind CSSState ManagementReact Query (TanStack Query)Form HandlingReact Hook FormValidationZodIconsLucide ReactHTTP ClientAxiosNotificationsToast (custom)

📋 Prerequisites

Node.js v18+
Backend API running (file-system-bn)


⚙️ Installation
bash# Clone the repository
git clone https://github.com/your-org/file-system-fn.git
cd file-system-fn

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

🔐 Environment Variables
Create a .env.local file in the root:
envNEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=FileSystem

▶️ Running the App
bash# Development
npm run dev

# Production build
npm run build
npm run start

🐳 Docker

Run the production container with Docker Compose:

```bash
docker compose up --build
```

Open `http://localhost:3000`. Compose defaults the backend API URL to `http://localhost:4000/api`. Override it by setting `NEXT_PUBLIC_API_URL` in the shell or in a root `.env` file before building:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
```

The API URL is embedded in the frontend during the image build, so rebuild the image after changing it. The backend is not included in this repository's Compose configuration.

🗂️ Project Structure
src/
├── api/                        # API layer
│   ├── api-client.ts           # Axios instance with interceptors
│   ├── auth.api.ts             # Auth API functions
│   ├── category.api.ts         # Categories API functions
│   ├── invitation.api.ts       # Invitations API functions
│   ├── query-client.ts         # React Query client config
│   └── index.ts                # Exports all API functions
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Auth pages (no sidebar)
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/              # Protected dashboard pages
│   │   ├── categories/         # Categories management (ADMIN)
│   │   ├── documents/          # Documents list
│   │   ├── folders/            # Folder explorer
│   │   ├── members/            # Members management (ADMIN)
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   └── page.tsx            # Dashboard home
│   ├── setup/
│   │   └── categories/         # Forced onboarding for new ADMIN
│   └── accept-invitation/      # Public page for accepting invites
├── components/
│   ├── auth/                   # Login and register components
│   ├── categories/             # Category card and modal
│   ├── dashboard/              # Stats, recent docs, recent folders
│   ├── folders/                # Folder explorer components
│   ├── forms/                  # Reusable form fields
│   ├── layout/                 # Sidebar, TopBar, DashboardLayout
│   ├── members/                # Members table and invite modal
│   └── ui/                     # Reusable UI (Modal, Badge, Toast...)
├── lib/
│   ├── auth-context.tsx        # Auth state and current user
│   ├── providers.tsx           # React Query and context providers
│   ├── mockData.ts             # Mock data (used during development)
│   └── hooks/                  # Custom React Query hooks
│       ├── useCategories.ts
│       ├── useInvitations.ts
│       └── useOrganizationSetup.ts
├── middleware.ts               # Route protection
└── types/                      # TypeScript types and Zod schemas
    ├── auth.ts
    ├── category.ts
    ├── enum.ts
    ├── folder.ts
    ├── invitation.ts
    ├── member.ts
    └── schema/                 # Zod validation schemas
        ├── login.schema.ts
        ├── register.schema.ts
        ├── category.schema.ts
        └── invitation.schema.ts

🔐 Authentication Flow
User visits protected route
        ↓
middleware.ts checks for token
        ↓
No token → redirect to /login
Token exists → allow access
        ↓
api-client.ts attaches token to every request
        ↓
On 401 response → refresh token automatically
On refresh fail → redirect to /login

🏗️ Onboarding Flow (New Organization)
Admin registers
        ↓
Redirected to /setup/categories
(cannot skip — middleware enforces this)
        ↓
Admin selects preset categories +
adds custom ones → sent in one bulk request
        ↓
Redirected to /dashboard
        ↓
Admin invites members via email
        ↓
Members accept invitation →
fill name, phone, password →
account created → login → isActive true