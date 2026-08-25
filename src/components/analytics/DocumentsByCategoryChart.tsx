"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useGetDocumentsByCategory } from "@/lib/hooks/useAnalytics";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardChartFrame } from "@/components/dashboard/DashboardChartFrame";
import { CHART_COLORS } from "@/components/dashboard/chart-theme";

export function DocumentsByCategoryChart() {
  const { data, isLoading, isError } = useGetDocumentsByCategory();
  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  return (
    <DashboardCard title="By category" description="Document distribution">
      <DashboardChartFrame
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        height={220}
      >
        <div className="h-[220px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <PieChart>
              <Pie
                data={data ?? []}
                dataKey="count"
                nameKey="category"
                innerRadius={48}
                outerRadius={76}
                paddingAngle={3}
              >
                {(data ?? []).map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </DashboardChartFrame>
    </DashboardCard>
  );
}
