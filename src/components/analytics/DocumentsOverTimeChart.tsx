"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useGetDocumentsOverTime } from "@/lib/hooks/useAnalytics";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardChartFrame } from "@/components/dashboard/DashboardChartFrame";
import {
  CHART_ACCENT,
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_PRIMARY,
} from "@/components/dashboard/chart-theme";

export function DocumentsOverTimeChart({
  period = "6months",
}: {
  period?: "6months" | "12months";
}) {
  const { data, isLoading, isError } = useGetDocumentsOverTime(period);
  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  return (
    <DashboardCard
      title="Documents over time"
      description="Upload volume for the last 6 months"
    >
      <DashboardChartFrame
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        height={240}
      >
        <div className="h-[240px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <AreaChart data={data ?? []}>
              <defs>
                <linearGradient id="docsOverTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_ACCENT} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CHART_ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fill: CHART_AXIS_TICK, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_AXIS_TICK, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={CHART_PRIMARY}
                strokeWidth={2}
                fill="url(#docsOverTime)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashboardChartFrame>
    </DashboardCard>
  );
}
