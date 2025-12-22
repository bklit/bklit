"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { getSessionAnalytics } from "@/actions/analytics-actions";
import { BounceRateChart } from "@/components/analytics-cards/bounce-rate-chart";
import { NoDataCard } from "./no-data-card";

interface BounceRateCardProps {
  projectId: string;
  userId: string;
}

export function BounceRateCard({ projectId, userId }: BounceRateCardProps) {
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
    if (dateParams.startDate) return dateParams.startDate;
    if (!dateParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["session-analytics", projectId, startDate, endDate],
    queryFn: () =>
      getSessionAnalytics({
        projectId,
        userId,
        startDate,
        endDate,
      }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bounce Rate</CardTitle>
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

  if (!data || data.totalSessions === 0) {
    return (
      <NoDataCard description="Sessions that bounced" title="Bounce Rate" />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{Math.round(data.bounceRate)}% Bounce Rate</CardTitle>
        <CardDescription>
          {data.bouncedSessions} of {data.totalSessions} sessions bounced
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BounceRateChart
          bouncedSessions={data.bouncedSessions}
          totalSessions={data.totalSessions}
        />
      </CardContent>
    </Card>
  );
}
