import { Suspense } from "react";
import {
  getAnalyticsStats,
  getLiveUsers,
  getSessionAnalytics,
} from "@/actions/analytics-actions";
import { BounceRateCard } from "@/components/analytics-cards/bounce-rate-card";
import { BrowserStatsCard } from "@/components/analytics-cards/browser-stats-card";
import { MobileDesktopCard } from "@/components/analytics-cards/mobile-desktop-card";
import { AnalyticsCardSkeleton } from "@/components/analytics-cards/no-data-card";
import { RecentPageViewsCard } from "@/components/analytics-cards/recent-page-views-card";
import { SessionAnalyticsCard } from "@/components/analytics-cards/session-analytics-card";
import { TopCountriesCard } from "@/components/analytics-cards/top-countries-card";
import { ViewsCard } from "@/components/analytics-cards/views-card";
import { PageHeader } from "@/components/header/page-header";
import { VisitorsMap } from "@/components/maps/visitors-map";
import { authenticated } from "@/lib/auth";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;
  const session = await authenticated();

  const [initialStats, initialSessionData, initialLiveUsers] =
    await Promise.all([
      getAnalyticsStats({ projectId, userId: session.user.id }),
      getSessionAnalytics({ projectId, userId: session.user.id }),
      getLiveUsers({ projectId, userId: session.user.id }),
    ]);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${session.user.name}!`}
        description="Quick insights..."
      />
      <div className="container mx-auto flex flex-col gap-4">
        <div
          className="grid gap-4 
      md:grid-cols-2 lg:grid-cols-3"
        >
          <Suspense fallback={<AnalyticsCardSkeleton />}>
            <ViewsCard
              projectId={projectId}
              organizationId={organizationId}
              initialStats={initialStats}
              initialSessionData={initialSessionData}
              initialLiveUsers={initialLiveUsers}
            />
          </Suspense>
          <Suspense fallback={<AnalyticsCardSkeleton />}>
            <TopCountriesCard projectId={projectId} userId={session.user.id} />
          </Suspense>
          <Suspense fallback={<AnalyticsCardSkeleton />}>
            <RecentPageViewsCard
              projectId={projectId}
              userId={session.user.id}
            />
          </Suspense>
        </div>

        <div className="grid gap-4 md:grid-cols-12">
          <div className="col-span-8">
            <VisitorsMap projectId={projectId} userId={session.user.id} />
          </div>
          <div className="col-span-4">
            <Suspense fallback={<AnalyticsCardSkeleton />}>
              <SessionAnalyticsCard
                projectId={projectId}
                organizationId={organizationId}
              />
            </Suspense>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Suspense fallback={<AnalyticsCardSkeleton />}>
            <BrowserStatsCard projectId={projectId} userId={session.user.id} />
          </Suspense>
          <Suspense fallback={<AnalyticsCardSkeleton />}>
            <MobileDesktopCard projectId={projectId} userId={session.user.id} />
          </Suspense>
          <Suspense fallback={<AnalyticsCardSkeleton />}>
            <BounceRateCard projectId={projectId} userId={session.user.id} />
          </Suspense>
        </div>

        <div className="grid gap-4 md:grid-cols-2"></div>
      </div>
    </>
  );
}
