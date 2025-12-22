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
import { ProgressRow } from "@bklit/ui/components/progress-row";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { getTopPages } from "@/actions/analytics-actions";
import { endOfDay, startOfDay } from "@/lib/date-utils";
import type { AnalyticsCardProps } from "@/types/analytics-cards";
import { NoDataCard } from "./no-data-card";

type RecentPageViewsCardProps = AnalyticsCardProps;

export function RecentPageViewsCard({
  organizationId,
  projectId,
  userId,
}: RecentPageViewsCardProps) {
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
    // Default to 30 days ago if no start date is provided
    const date = startOfDay(new Date());
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate]);

  const endDate = useMemo(() => {
    return dateParams.endDate
      ? endOfDay(dateParams.endDate)
      : endOfDay(new Date());
  }, [dateParams.endDate]);

  const { data: topPages, isLoading } = useQuery({
    queryKey: ["top-pages", projectId, startDate, endDate],
    queryFn: () =>
      getTopPages({
        projectId,
        userId,
        limit: 5,
        startDate,
        endDate,
      }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Pages</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-muted-foreground text-sm">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topPages || topPages.length === 0) {
    return (
      <NoDataCard
        description="The most popular pages by views."
        title="Popular Pages"
      />
    );
  }

  const totalViews = topPages.reduce((sum, page) => sum + page.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Pages</CardTitle>
        <CardDescription>The most popular pages by views.</CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/${organizationId}/${projectId}/pageviews`}>
              View All
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {topPages.map((page) => (
            <ProgressRow
              key={page.path}
              label={page.path}
              percentage={(page.count / totalViews) * 100}
              value={page.count}
              variant="secondary"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
