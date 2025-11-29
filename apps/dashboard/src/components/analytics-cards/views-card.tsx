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
import {
  getAnalyticsStats,
  getSessionAnalytics,
} from "@/actions/analytics-actions";
import { endOfDay, startOfDay } from "@/lib/date-utils";
import { useTRPC } from "@/trpc/react";
import type { SessionAnalyticsSummary } from "@/types/analytics-cards";

interface ViewsCardProps {
  projectId: string;
  organizationId: string;
  userId: string;
  initialStats: Awaited<ReturnType<typeof getAnalyticsStats>>;
  initialSessionData: Awaited<ReturnType<typeof getSessionAnalytics>>;
  initialLiveUsers: number;
}

export function ViewsCard({
  projectId,
  organizationId,
  userId,
  initialStats,
  initialSessionData,
  initialLiveUsers,
}: ViewsCardProps) {
  const [dateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    {
      history: "push",
    },
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) return startOfDay(dateParams.startDate);
    if (!dateParams.endDate) return undefined;
    const date = startOfDay(new Date());
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = useMemo(() => {
    return dateParams.endDate ? endOfDay(dateParams.endDate) : undefined;
  }, [dateParams.endDate]);

  const trpc = useTRPC();

  const { data: stats } = useQuery({
    queryKey: ["analytics-stats", projectId, startDate, endDate],
    queryFn: () =>
      getAnalyticsStats({
        projectId,
        userId,
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

  const {
    data: liveUsers,
    isLoading,
    error,
  } = useQuery(
    trpc.session.liveUsers.queryOptions(
      {
        projectId,
        organizationId,
      },
      {
        refetchInterval: 15000,
        staleTime: 10000,
        initialData: initialLiveUsers,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: (failureCount, error) => {
          if (error instanceof Error && error.name === "AbortError") {
            return false;
          }
          return failureCount < 3;
        },
      },
    ),
  );

  const sessionStats: SessionAnalyticsSummary = {
    totalSessions: sessionData?.totalSessions ?? initialSessionData.totalSessions,
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
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">
                <NumberFlow value={sessionStats.totalSessions} />
              </div>
              <div className="text-sm text-muted-foreground">
                Total Sessions
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                <NumberFlow
                  value={Math.round(sessionStats.bounceRate)}
                  suffix="%"
                />
              </div>
              <div className="text-sm text-muted-foreground">Bounce Rate</div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <div>
              <div className="text-2xl font-bold">
                <NumberFlow value={displayStats.uniqueVisits} />
              </div>
              <div className="text-sm text-muted-foreground">
                Unique Visitors
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                <NumberFlow value={liveUsers ?? initialLiveUsers} />
              </div>
              <div className="text-sm text-muted-foreground">Live Users</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
