"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { ChangeIndicator } from "@bklit/ui/components/change-indicator";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { parseAsBoolean, parseAsIsoDateTime, useQueryStates } from "nuqs";
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
      compare: parseAsBoolean.withDefault(true),
    },
    {
      history: "push",
    }
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) {
      return startOfDay(dateParams.startDate);
    }
    const date = startOfDay(new Date());
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate]);

  const endDate = useMemo(() => {
    return dateParams.endDate
      ? endOfDay(dateParams.endDate)
      : endOfDay(new Date());
  }, [dateParams.endDate]);

  const { previousStartDate, previousEndDate } = useMemo(() => {
    const diffMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diffMs);
    return {
      previousStartDate: startOfDay(prevStart),
      previousEndDate: endOfDay(prevEnd),
    };
  }, [startDate, endDate]);

  const trpc = useTRPC();

  const { data: stats } = useQuery({
    ...trpc.pageview.getAnalyticsStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
    placeholderData: initialStats,
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
    placeholderData: initialSessionData,
  });

  const { data: conversionsData } = useQuery({
    ...trpc.event.getConversions.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
    placeholderData: { conversions: initialConversions },
  });

  // Previous period data for comparison
  const { data: previousStats } = useQuery({
    ...trpc.pageview.getAnalyticsStats.queryOptions({
      projectId,
      organizationId,
      startDate: previousStartDate,
      endDate: previousEndDate,
    }),
    enabled: dateParams.compare,
  });

  const { data: previousSessionData } = useQuery({
    queryKey: [
      "session-analytics",
      projectId,
      previousStartDate,
      previousEndDate,
    ],
    queryFn: () =>
      getSessionAnalytics({
        projectId,
        userId,
        startDate: previousStartDate,
        endDate: previousEndDate,
      }),
    enabled: dateParams.compare,
  });

  const { data: previousConversionsData } = useQuery({
    ...trpc.event.getConversions.queryOptions({
      projectId,
      organizationId,
      startDate: previousStartDate,
      endDate: previousEndDate,
    }),
    enabled: dateParams.compare,
  });

  const sessionStats: SessionAnalyticsSummary = {
    totalSessions:
      sessionData?.totalSessions ?? initialSessionData.totalSessions,
    bounceRate: sessionData?.bounceRate ?? initialSessionData.bounceRate,
  };

  const displayStats = stats ?? initialStats;

  // Calculate changes
  const calculateChange = (current: number, previous: number | undefined) => {
    if (previous === undefined) {
      return null;
    }
    if (previous === 0) {
      // If previous was 0 and current is positive, show as increase
      // If previous was 0 and current is 0, no change (null)
      return current > 0 ? 100 : null;
    }
    return ((current - previous) / previous) * 100;
  };

  const sessionsChange = dateParams.compare
    ? calculateChange(
        sessionStats.totalSessions,
        previousSessionData?.totalSessions
      )
    : null;
  const bounceRateChange = dateParams.compare
    ? calculateChange(sessionStats.bounceRate, previousSessionData?.bounceRate)
    : null;
  const uniqueVisitsChange = dateParams.compare
    ? calculateChange(displayStats.uniqueVisits, previousStats?.uniqueVisits)
    : null;
  const currentConversions = conversionsData?.conversions ?? initialConversions;
  const conversionsChange = dateParams.compare
    ? calculateChange(currentConversions, previousConversionsData?.conversions)
    : null;

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
              <div className="flex items-center gap-2 font-bold text-2xl">
                <NumberFlow value={sessionStats.totalSessions} />
                <ChangeIndicator change={sessionsChange} uniqueKey="sessions" />
              </div>
              <div className="text-muted-foreground text-sm">
                Total Sessions
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-2xl">
                <NumberFlow
                  suffix="%"
                  value={Math.round(sessionStats.bounceRate)}
                />
                <ChangeIndicator
                  change={bounceRateChange}
                  uniqueKey="bounce-rate"
                />
              </div>
              <div className="text-muted-foreground text-sm">Bounce Rate</div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <div>
              <div className="flex items-center gap-2 font-bold text-2xl">
                <NumberFlow value={displayStats.uniqueVisits} />
                <ChangeIndicator
                  change={uniqueVisitsChange}
                  uniqueKey="unique-visits"
                />
              </div>
              <div className="text-muted-foreground text-sm">
                Unique Visitors
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-2xl">
                <NumberFlow value={currentConversions} />
                <ChangeIndicator
                  change={conversionsChange}
                  uniqueKey="conversions"
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
