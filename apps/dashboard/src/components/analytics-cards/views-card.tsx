"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import type {
  getAnalyticsStats,
  getSessionAnalytics,
} from "@/actions/analytics-actions";
import { useTRPC } from "@/trpc/react";
import type { SessionAnalyticsSummary } from "@/types/analytics-cards";

interface ViewsCardProps {
  projectId: string;
  organizationId: string;
  initialStats: Awaited<ReturnType<typeof getAnalyticsStats>>;
  initialSessionData: Awaited<ReturnType<typeof getSessionAnalytics>>;
  initialLiveUsers: number;
}

export function ViewsCard({
  projectId,
  organizationId,
  initialStats,
  initialSessionData,
  initialLiveUsers,
}: ViewsCardProps) {
  // Use tRPC for real-time live users updates
  const trpc = useTRPC();

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
        refetchInterval: 15000, // Poll every 15 seconds (less aggressive)
        staleTime: 10000, // Consider data stale after 10 seconds
        initialData: initialLiveUsers, // Use server-side data as initial
        refetchOnWindowFocus: false, // Don't refetch when window gains focus
        refetchOnMount: true, // Refetch when component mounts
        retry: (failureCount, error) => {
          // Don't retry on abort errors (normal behavior)
          if (error instanceof Error && error.name === "AbortError") {
            return false;
          }
          return failureCount < 3;
        },
      },
    ),
  );

  console.log("📊 VIEWS CARD: Rendering with live users", {
    projectId,
    organizationId,
    liveUsers: liveUsers ?? initialLiveUsers,
    totalViews: initialStats.totalViews,
    uniqueVisits: initialStats.uniqueVisits,
    isLoading,
    error,
  });

  const sessionStats: SessionAnalyticsSummary = {
    totalSessions: initialSessionData.totalSessions,
    bounceRate: initialSessionData.bounceRate,
  };

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
                {initialStats.totalViews.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {sessionStats.totalSessions.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Sessions
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {sessionStats.bounceRate}%
              </div>
              <div className="text-sm text-muted-foreground">Bounce Rate</div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <div>
              <div className="text-2xl font-bold">
                {initialStats.uniqueVisits.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Unique Visitors
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : (liveUsers ?? initialLiveUsers)}
              </div>
              <div className="text-sm text-muted-foreground">Live Users</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
