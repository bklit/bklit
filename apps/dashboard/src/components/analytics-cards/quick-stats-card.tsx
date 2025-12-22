"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { getSessionAnalytics } from "@/actions/analytics-actions";
import { endOfDay, startOfDay } from "@/lib/date-utils";
import { useTRPC } from "@/trpc/react";
import type { SessionAnalyticsSummary } from "@/types/analytics-cards";

interface AnalyticsStats {
  totalViews: number;
  recentViews: number;
  uniquePages: number;
  uniqueVisits: number;
}

interface QuickStatsCardProps {
  projectId: string;
  organizationId: string;
  userId: string;
  initialStats: AnalyticsStats;
  initialSessionData: Awaited<ReturnType<typeof getSessionAnalytics>>;
  initialConversions: number;
}

export function QuickStatsCard({
  projectId,
  organizationId,
  userId,
  initialStats,
  initialSessionData,
  initialConversions,
}: QuickStatsCardProps) {
  const [dateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    {
      history: "push",
    }
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) return startOfDay(dateParams.startDate);
    const date = startOfDay(new Date());
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate]);

  const endDate = useMemo(() => {
    return dateParams.endDate
      ? endOfDay(dateParams.endDate)
      : endOfDay(new Date());
  }, [dateParams.endDate]);

  const trpc = useTRPC();

  const { data: stats } = useQuery({
    ...trpc.pageview.getAnalyticsStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
    initialData: initialStats,
  });

  const { data: sessionData } = useQuery({
    queryKey: ["session-analytics", projectId, startDate, endDate],
    queryFn: () =>
      getSessionAnalytics({
        projectId,
        userId,
        startDate,
        endDate,
      }),
    initialData: initialSessionData,
  });

  const { data: conversionsData } = useQuery(
    trpc.event.getConversions.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    })
  );

  const sessionStats: SessionAnalyticsSummary = {
    totalSessions:
      sessionData?.totalSessions ?? initialSessionData.totalSessions,
    bounceRate: sessionData?.bounceRate ?? initialSessionData.bounceRate,
  };

  const displayStats = stats ?? initialStats;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
        <CardDescription>A quick overview of your app.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-2xl">
                <NumberFlow value={sessionStats.totalSessions} />
              </div>
              <div className="text-muted-foreground text-sm">
                Total Sessions
              </div>
            </div>
            <div>
              <div className="font-bold text-2xl">
                <NumberFlow
                  suffix="%"
                  value={Math.round(sessionStats.bounceRate)}
                />
              </div>
              <div className="text-muted-foreground text-sm">Bounce Rate</div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <div>
              <div className="font-bold text-2xl">
                <NumberFlow value={displayStats.uniqueVisits} />
              </div>
              <div className="text-muted-foreground text-sm">
                Unique Visitors
              </div>
            </div>
            <div>
              <div className="font-bold text-2xl">
                <NumberFlow
                  value={conversionsData?.conversions ?? initialConversions}
                />
              </div>
              <div className="text-muted-foreground text-sm">Conversions</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
