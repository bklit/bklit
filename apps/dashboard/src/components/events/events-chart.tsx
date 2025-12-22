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
import { MobileDesktopChart } from "@/components/analytics-cards/mobile-desktop-chart";
import { useTRPC } from "@/trpc/react";

interface EventsChartProps {
  organizationId: string;
  projectId: string;
}

export function EventsChart({ organizationId, projectId }: EventsChartProps) {
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
    ...trpc.event.getTimeSeries.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  });

  const { data: statsData } = useQuery({
    ...trpc.event.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  });

  const chartConfig: ChartConfig = useMemo(() => {
    return {
      total: {
        label: "Total Events",
        color: "var(--bklit-400)",
      },
      views: {
        label: "Views",
        color: "var(--chart-1)",
      },
      clicks: {
        label: "Clicks",
        color: "var(--chart-2)",
      },
    } satisfies ChartConfig;
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Events Over Time</CardTitle>
          <CardDescription>
            Daily events for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
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
          <CardTitle>Events Over Time</CardTitle>
          <CardDescription>
            Daily events for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0">
      <CardHeader>
        <div className="grid flex-1 gap-1">
          <CardTitle>Events Over Time</CardTitle>
          <CardDescription>
            Daily events for the selected period
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-4">
          <div className="col-span-1 flex items-center justify-center">
            <MobileDesktopChart
              desktop={statsData?.desktopEvents || 0}
              mobile={statsData?.mobileEvents || 0}
            />
          </div>
          <div className="col-span-3">
            <ChartContainer
              className="aspect-auto h-[250px] w-full"
              config={chartConfig}
            >
              <AreaChart data={timeSeriesData.timeSeriesData}>
                <defs>
                  <linearGradient id="fillTotal" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-total)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-total)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillViews" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-views)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-views)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillClicks" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-clicks)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-clicks)"
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

                {/* Total events area - dashed line */}
                <Area
                  dataKey="total"
                  fill="url(#fillTotal)"
                  fillOpacity={0.3}
                  stroke="var(--color-total)"
                  strokeDasharray="5 5"
                  type="linear"
                />

                {/* Views area */}
                <Area
                  dataKey="views"
                  fill="url(#fillViews)"
                  fillOpacity={0.6}
                  stroke="var(--color-views)"
                  type="linear"
                />
                {/* Clicks area */}
                <Area
                  dataKey="clicks"
                  fill="url(#fillClicks)"
                  fillOpacity={0.6}
                  stroke="var(--color-clicks)"
                  type="linear"
                />

                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
