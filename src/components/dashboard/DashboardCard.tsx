"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export function DashboardCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  noPadding = false,
}: DashboardCardProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-default bg-surface shadow-sm",
        className,
      )}
    >
      {hasHeader ? (
        <header className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-sm text-secondary">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn(!noPadding && "p-5", bodyClassName)}>{children}</div>
    </article>
  );
}
