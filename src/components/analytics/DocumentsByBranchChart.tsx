"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useGetDocumentsByDepartment } from "@/lib/hooks/useAnalytics";
import { useGetBranches } from "@/lib/hooks/useBranches";
import { AppSelect } from "@/components/ui/AppSelect";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { DashboardChartFrame } from "@/components/dashboard/DashboardChartFrame";
import {
  CHART_ACCENT,
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
} from "@/components/dashboard/chart-theme";

export function DocumentsByBranchChart() {
  const { branches, isLoading: branchesLoading } = useGetBranches();
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const { data, isLoading, isError } = useGetDocumentsByDepartment();

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  const chartData = useMemo(() => {
    if (!data || !selectedBranch) {
      return [];
    }

    const departmentNames = new Set(
      (selectedBranch.departments ?? []).map((dept) => dept.name),
    );

    return data.filter((item) => departmentNames.has(item.department));
  }, [data, selectedBranch]);

  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const loading = branchesLoading || isLoading;
  const isEmpty =
    !loading && !isError && chartData.length === 0;

  return (
    <DashboardCard
      title="By department"
      description="Documents per department in the selected branch"
      action={
        branches.length > 0 ? (
          <AppSelect
            value={selectedBranchId}
            onValueChange={setSelectedBranchId}
            placeholder="Select branch"
            triggerClassName="min-w-[11rem] rounded-xl"
            options={branches.map((branch) => ({
              value: branch.id,
              label: branch.name,
            }))}
          />
        ) : null
      }
    >
      <DashboardChartFrame
        isLoading={loading}
        isError={isError}
        isEmpty={isEmpty}
        emptyMessage="No department data for this branch"
        height={220}
      >
        <div className="h-[220px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
              <XAxis
                dataKey="department"
                tick={{ fill: CHART_AXIS_TICK, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={56}
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
              <Bar dataKey="count" fill={CHART_ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardChartFrame>
    </DashboardCard>
  );
}
