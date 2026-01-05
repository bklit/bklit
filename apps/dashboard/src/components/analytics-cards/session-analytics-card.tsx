"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import {
  getBrowserFromUserAgent,
  getBrowserIcon,
} from "@/lib/utils/get-browser-icon";
import {
  getDeviceIcon,
  getDeviceTypeFromUserAgent,
} from "@/lib/utils/get-device-icon";
import { useTRPC } from "@/trpc/react";
import type { SessionAnalyticsCardProps } from "@/types/analytics-cards";
import { NoDataCard } from "./no-data-card";

export function SessionAnalyticsCard({
  projectId,
  organizationId,
}: SessionAnalyticsCardProps) {
  const trpc = useTRPC();

  // For "Recent Sessions" card, always show the most recent sessions regardless of date filters
  // Only show sessions from the last 7 days to keep it relevant
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }, []);

  const { data: sessionsData, isLoading } = useQuery(
    trpc.session.getRecent.queryOptions({
      projectId,
      organizationId,
      limit: 10,
      startDate,
      endDate: undefined, // No end date - show all recent sessions
    }),
  );

  const sessions = sessionsData?.sessions || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <NoDataCard
        title="Recent Sessions"
        description="The most recent sessions."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>The most recent sessions.</CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/${organizationId}/${projectId}/sessions`}>
              View All
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sessions found
            </p>
          ) : (
            sessions.map((session) => {
              const browser = getBrowserFromUserAgent(session.userAgent);
              const deviceType = getDeviceTypeFromUserAgent(session.userAgent);
              return (
                <Link
                  key={session.id}
                  href={`/${organizationId || ""}/${projectId}/sessions/${session.id}`}
                  className="flex items-center justify-between border-b py-1.5 px-2 last-of-type:border-b-0 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span>{getBrowserIcon(browser)}</span>
                      <span className="text-muted-foreground">
                        {getDeviceIcon(deviceType)}
                      </span>
                      <span className="text-sm">
                        {session.pageViewEvents.length} pages
                      </span>
                    </div>
                  </div>
                  <div className="gap-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(
                      session.updatedAt || session.startedAt,
                      {
                        addSuffix: true,
                      },
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
