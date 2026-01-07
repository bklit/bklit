"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import type { ChartConfig } from "@bklit/ui/components/chart";
import { useQuery } from "@tanstack/react-query";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { useTRPC } from "@/trpc/react";

interface FunnelsChartProps {
  organizationId: string;
  projectId: string;
}

export function FunnelsChart({ organizationId, projectId }: FunnelsChartProps) {
  const trpc = useTRPC();

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

  const { data: timeSeriesData, isLoading } = useQuery({
    ...trpc.funnel.getTimeSeries.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  });

  const chartConfig: ChartConfig = useMemo(() => {
    return {
      sessions: {
        label: "Funnel Sessions",
        color: "var(--chart-1)",
      },
      conversions: {
        label: "Conversions",
        color: "var(--chart-2)",
      },
    } satisfies ChartConfig;
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel Activity Over Time</CardTitle>
          <CardDescription>
            Sessions and conversions for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeSeriesData || timeSeriesData.timeSeriesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel Activity Over Time</CardTitle>
          <CardDescription>
            Sessions and conversions for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel Activity Over Time</CardTitle>
        <CardDescription>
          Sessions and conversions for the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TimeSeriesChart
          projectId={projectId}
          data={timeSeriesData.timeSeriesData}
          chartConfig={chartConfig}
          startDate={startDate}
          endDate={endDate}
          isLoading={isLoading}
          showDeployments={true}
          height={400}
        />
      </CardContent>
    </Card>
  );
}
