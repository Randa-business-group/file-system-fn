"use client";

import Link from "next/link";
import { ChevronDown, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useDashboard } from "@/lib/dashboard-context";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHero() {
  const { user } = useAuth();
  const { openUpload } = useDashboard();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-secondary">
          {user?.organizationName
            ? `Here's what's happening in ${user.organizationName} today.`
            : "Here's your workspace at a glance."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 rounded-xl border border-default bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[var(--color-bg-secondary)]"
        >
          Browse files
          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
        </Link>
      </div>
    </div>
  );
}
