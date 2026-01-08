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
import { parseAsBoolean, parseAsIsoDateTime, useQueryStates } from "nuqs";
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

  const { previousStartDate, previousEndDate } = useMemo(() => {
    const diffMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diffMs);
    return {
      previousStartDate: startOfDay(prevStart),
      previousEndDate: endOfDay(prevEnd),
    };
  }, [startDate, endDate]);

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

  const { data: previousTopPages } = useQuery({
    queryKey: ["top-pages", projectId, previousStartDate, previousEndDate],
    queryFn: () =>
      getTopPages({
        projectId,
        userId,
        limit: 5,
        startDate: previousStartDate,
        endDate: previousEndDate,
      }),
    enabled: dateParams.compare,
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

  // Calculate changes
  const calculateChange = (
    currentCount: number,
    pagePath: string
  ): number | null => {
    if (!(dateParams.compare && previousTopPages)) {
      return null;
    }
    const previousPage = previousTopPages.find((p) => p.path === pagePath);
    const previousCount = previousPage ? previousPage.count : 0;
    if (previousCount === 0) {
      return currentCount > 0 ? 100 : null;
    }
    return ((currentCount - previousCount) / previousCount) * 100;
  };

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
          {topPages.map((page) => {
            const change = calculateChange(page.count, page.path);
            return (
              <ProgressRow
                change={change}
                changeUniqueKey={`page-${page.path}`}
                key={page.path}
                label={page.path}
                percentage={(page.count / totalViews) * 100}
                value={page.count}
                variant="secondary"
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
