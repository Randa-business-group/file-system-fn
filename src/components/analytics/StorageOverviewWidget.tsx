"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import { HardDrive } from "lucide-react";
import { useGetStorage } from "@/lib/hooks/useAnalytics";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardChartFrame } from "@/components/dashboard/DashboardChartFrame";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { CHART_PRIMARY } from "@/components/dashboard/chart-theme";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function StorageOverviewWidget() {
  const { data, isLoading, isError } = useGetStorage();

  if (isLoading) {
    return (
      <DashboardCard title="Storage overview">
        <LoadingSkeleton height={220} rounded="1rem" />
      </DashboardCard>
    );
  }

  if (isError || !data) {
    return (
      <DashboardCard title="Storage overview">
        <p className="text-sm text-error">Failed to load storage.</p>
      </DashboardCard>
    );
  }

  const percent = Math.min(100, Math.round(data.percentage));
  const freePercent = Math.max(0, 100 - percent);
  const chartData = [
    { name: "Used", value: percent },
    { name: "Free", value: freePercent },
  ];

  return (
    <DashboardCard title="Storage overview" description="Organization file usage">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <DashboardChartFrame isLoading={false} isError={false} isEmpty={false} height={180}>
          <div className="relative mx-auto h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={78}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill={CHART_PRIMARY} />
                  <Cell fill="var(--color-bg-tertiary)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-foreground">{percent}%</span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                used
              </span>
            </div>
          </div>
        </DashboardChartFrame>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-subtle)] text-primary">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {formatBytes(data.used)}
              </p>
              <p className="mt-0.5 text-sm text-secondary">
                of {formatBytes(data.total)} allocated
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Used space
              </span>
              <span className="font-medium text-foreground">{formatBytes(data.used)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-bg-tertiary)]" />
                Available
              </span>
              <span className="font-medium text-foreground">
                {formatBytes(Math.max(0, data.total - data.used))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
