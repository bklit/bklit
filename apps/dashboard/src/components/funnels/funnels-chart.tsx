"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import type { ChartConfig } from "@bklit/ui/components/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@bklit/ui/components/chart";
import { useQuery } from "@tanstack/react-query";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
          <div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">
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
          <div className="flex h-[400px] items-center justify-center text-muted-foreground text-sm">
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
        <ChartContainer
          className="aspect-auto h-[400px] w-full"
          config={chartConfig}
        >
          <AreaChart data={timeSeriesData.timeSeriesData}>
            <defs>
              <linearGradient id="fillSessions" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sessions)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sessions)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillConversions" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-conversions)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-conversions)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--chart-cartesian)"
              strokeDasharray="3 3"
            />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
              }
              cursor={false}
            />
            <Area
              dataKey="sessions"
              fill="url(#fillSessions)"
              fillOpacity={0.6}
              stroke="var(--color-sessions)"
              type="linear"
            />
            <Area
              dataKey="conversions"
              fill="url(#fillConversions)"
              fillOpacity={0.6}
              stroke="var(--color-conversions)"
              type="linear"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
