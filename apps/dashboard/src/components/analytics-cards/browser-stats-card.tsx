"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { PieDonut } from "@bklit/ui/components/charts/pie-donut";
import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { getBrowserStats } from "@/actions/analytics-actions";
import { NoDataCard } from "./no-data-card";

interface BrowserStatsCardProps {
  projectId: string;
  userId: string;
}

export function BrowserStatsCard({ projectId, userId }: BrowserStatsCardProps) {
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

  const { data: browserStats, isLoading: loading } = useQuery({
    queryKey: ["browser-stats", projectId, startDate, endDate],
    queryFn: () =>
      getBrowserStats({
        projectId,
        userId,
        startDate,
        endDate,
      }),
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Browser Usage</CardTitle>
          <CardDescription>Loading browser statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <div className="text-muted-foreground text-sm">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!browserStats) {
    return (
      <NoDataCard
        description="Page visits by browser"
        icon={<Compass size={16} />}
        title="Browser Usage"
      />
    );
  }

  const totalVisits = browserStats.reduce((sum, stat) => sum + stat.count, 0);

  if (totalVisits === 0) {
    return (
      <NoDataCard
        description="Page visits by browser"
        icon={<Compass size={16} />}
        title="Browser Usage"
      />
    );
  }

  // Create chart config for browsers

  // Prepare chart data
  const chartData = browserStats.map((stat) => ({
    name: stat.browser.toLowerCase().replace(/\s+/g, "_"),
    value: stat.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Browser Usage</CardTitle>
        <CardDescription>
          Page visits by browser ({totalVisits} total visits).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PieDonut
          centerLabel={{ showTotal: true, suffix: "page views" }}
          className="w-full"
          data={chartData}
        />
      </CardContent>
    </Card>
  );
}
