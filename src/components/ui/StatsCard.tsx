import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleTone?: "default" | "success" | "warning" | "muted";
  icon: ReactNode;
  color: string;
  footer?: ReactNode;
  className?: string;
}

const SUBTITLE_TONE: Record<NonNullable<StatsCardProps["subtitleTone"]>, string> = {
  default: "text-secondary",
  success: "text-emerald-600",
  warning: "text-amber-600",
  muted: "text-muted",
};

export function StatsCard({
  title,
  value,
  subtitle,
  subtitleTone = "default",
  icon,
  color,
  footer,
  className,
}: StatsCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-default bg-surface p-5 shadow-sm transition hover:border-primary/15 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-secondary">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle ? (
            <p className={cn("mt-1.5 text-xs font-medium", SUBTITLE_TONE[subtitleTone])}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{
            color,
            backgroundColor: `color-mix(in srgb, ${color} 12%, white)`,
          }}
        >
          {icon}
        </div>
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  );
}
