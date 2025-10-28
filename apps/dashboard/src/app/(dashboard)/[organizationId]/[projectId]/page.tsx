import { Suspense } from "react";
import { BounceRateCard } from "@/components/analytics-cards/bounce-rate-card";
import { BrowserStatsCard } from "@/components/analytics-cards/browser-stats-card";
import { MobileDesktopCard } from "@/components/analytics-cards/mobile-desktop-card";
import { AnalyticsCardSkeleton } from "@/components/analytics-cards/no-data-card";
import { RecentPageViewsCard } from "@/components/analytics-cards/recent-page-views-card";
import { SessionAnalyticsCard } from "@/components/analytics-cards/session-analytics-card";
import { TopCountriesCard } from "@/components/analytics-cards/top-countries-card";
import { ViewsCard } from "@/components/analytics-cards/views-card";
import { WorldMapCard } from "@/components/analytics-cards/world-map-card";
import { authenticated } from "@/lib/auth";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;
  const session = await authenticated();

  return (
    <div className="container mx-auto py-6 px-4 flex flex-col gap-4">
      <div
        className="grid gap-4 
      md:grid-cols-2 lg:grid-cols-3"
      >
        <Suspense fallback={<AnalyticsCardSkeleton />}>
          <ViewsCard projectId={projectId} userId={session.user.id} />
        </Suspense>
        <Suspense fallback={<AnalyticsCardSkeleton />}>
          <TopCountriesCard projectId={projectId} userId={session.user.id} />
        </Suspense>
        <Suspense fallback={<AnalyticsCardSkeleton />}>
          <RecentPageViewsCard projectId={projectId} userId={session.user.id} />
        </Suspense>
      </div>
      {/* <Suspense fallback={<WorldMapCardSkeleton />}> */}
      <WorldMapCard />
      {/* </Suspense> */}
      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<AnalyticsCardSkeleton />}>
          <MobileDesktopCard projectId={projectId} userId={session.user.id} />
        </Suspense>
        <Suspense fallback={<AnalyticsCardSkeleton />}>
          <BounceRateCard projectId={projectId} userId={session.user.id} />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<AnalyticsCardSkeleton />}>
          <BrowserStatsCard projectId={projectId} userId={session.user.id} />
        </Suspense>
        <Suspense fallback={<AnalyticsCardSkeleton />}>
          <SessionAnalyticsCard
            projectId={projectId}
            organizationId={organizationId}
          />
        </Suspense>
      </div>
    </div>
  );
}
