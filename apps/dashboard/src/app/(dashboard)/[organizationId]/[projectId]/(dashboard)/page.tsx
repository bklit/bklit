import { Suspense } from "react";
import {
  getAnalyticsStats,
  getConversions,
  getSessionAnalytics,
} from "@/actions/analytics-actions";
import { BounceRateCard } from "@/components/analytics-cards/bounce-rate-card";
import { BrowserStatsCard } from "@/components/analytics-cards/browser-stats-card";
import { MobileDesktopCard } from "@/components/analytics-cards/mobile-desktop-card";
import { AnalyticsCardSkeleton } from "@/components/analytics-cards/no-data-card";
import { QuickStatsCard } from "@/components/analytics-cards/quick-stats-card";
import { RecentPageViewsCard } from "@/components/analytics-cards/recent-page-views-card";
import { SessionAnalyticsCard } from "@/components/analytics-cards/session-analytics-card";
import { TopCountriesCard } from "@/components/analytics-cards/top-countries-card";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { VisitorsMap } from "@/components/maps/visitors-map";
import { authenticated } from "@/lib/auth";
import { endOfDay, startOfDay } from "@/lib/date-utils";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const { organizationId, projectId } = await params;
  const { startDate: startDateParam, endDate: endDateParam } =
    await searchParams;
  const session = await authenticated();

  const startDate = startDateParam
    ? startOfDay(new Date(startDateParam))
    : (() => {
        const date = startOfDay(new Date());
        date.setDate(date.getDate() - 30);
        return date;
      })();
  const endDate = endDateParam
    ? endOfDay(new Date(endDateParam))
    : endOfDay(new Date());

  const [initialStats, initialSessionData, initialConversions] =
    await Promise.all([
      getAnalyticsStats({
        projectId,
        userId: session.user.id,
        startDate,
        endDate,
      }),
      getSessionAnalytics({
        projectId,
        userId: session.user.id,
        startDate,
        endDate,
      }),
      getConversions({
        projectId,
        userId: session.user.id,
        startDate,
        endDate,
      }),
    ]);

  return (
    <>
      <PageHeader
        description="Quick insights..."
        title={`Welcome back, ${session.user.name}!`}
      >
        <DateRangePicker />
      </PageHeader>
      <div className="container mx-auto flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={<AnalyticsCardSkeleton />}>
            <QuickStatsCard
              initialConversions={initialConversions}
              initialSessionData={initialSessionData}
              initialStats={initialStats}
              organizationId={organizationId}
              projectId={projectId}
              userId={session.user.id}
            />
          </Suspense>
          <Suspense fallback={<AnalyticsCardSkeleton />}>
            <TopCountriesCard projectId={projectId} userId={session.user.id} />
          </Suspense>
          <Suspense fallback={<AnalyticsCardSkeleton />}>
            <RecentPageViewsCard
              organizationId={organizationId}
              projectId={projectId}
              userId={session.user.id}
            />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="col-span-1 md:col-span-8">
            <VisitorsMap key={projectId} projectId={projectId} />
          </div>
          <div className="col-span-1 md:col-span-4">
            <Suspense fallback={<AnalyticsCardSkeleton />}>
              <SessionAnalyticsCard
                organizationId={organizationId}
                projectId={projectId}
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

        <div className="grid gap-4 md:grid-cols-2" />
      </div>
    </>
  );
}
