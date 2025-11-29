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
    },
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) return dateParams.startDate;
    if (!dateParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;

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
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topPages || topPages.length === 0) {
    return (
      <NoDataCard
        title="Popular Pages"
        description="The most popular pages by views."
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
              variant="secondary"
              label={page.path}
              value={page.count}
              percentage={(page.count / totalViews) * 100}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
