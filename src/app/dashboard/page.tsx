"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { OverviewStatsRow } from "@/components/analytics/OverviewStatsRow";
import { DocumentsOverTimeChart } from "@/components/analytics/DocumentsOverTimeChart";
import { StorageOverviewWidget } from "@/components/analytics/StorageOverviewWidget";
import { RecentDocumentsWidget } from "@/components/analytics/RecentDocumentsWidget";
import { NeedsAttentionWidget } from "@/components/analytics/NeedsAttentionWidget";
import { RecentActivityFeed } from "@/components/analytics/RecentActivityFeed";
import { MemberActivityChart } from "@/components/analytics/MemberActivityChart";

export default function DashboardOverviewPage() {
  const { isOwner, isBranchManager, isDeptManager } = useAuth();
  const showMemberActivity = isOwner || isBranchManager || isDeptManager;

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-6">
      <DashboardHero />

      <OverviewStatsRow />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DocumentsOverTimeChart />
        </div>
        <div className="xl:col-span-4">
          <StorageOverviewWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NeedsAttentionWidget />
        <RecentActivityFeed />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={showMemberActivity ? "xl:col-span-7" : "xl:col-span-12"}>
          <RecentDocumentsWidget />
        </div>
        {showMemberActivity ? (
          <div className="xl:col-span-5">
            <MemberActivityChart />
          </div>
        ) : null}
      </div>
    </div>
  );
}
