"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useGetMemberActivity } from "@/lib/hooks/useAnalytics";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardChartFrame } from "@/components/dashboard/DashboardChartFrame";
import {
  CHART_PRIMARY,
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
} from "@/components/dashboard/chart-theme";

export function MemberActivityChart() {
  const { data, isLoading, isError } = useGetMemberActivity();
  const chartData = (data ?? []).map((item) => ({
    name: item.name,
    count: item.count,
  }));
  const isEmpty = !isLoading && !isError && chartData.length === 0;

  return (
    <DashboardCard
      title="Member activity"
      description="Documents uploaded per member"
    >
      <DashboardChartFrame
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        height={220}
      >
        <div className="h-[220px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fill: CHART_AXIS_TICK, fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={88}
                tick={{ fill: CHART_AXIS_TICK, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              />
              <Bar dataKey="count" fill={CHART_PRIMARY} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardChartFrame>
    </DashboardCard>
  );
}
