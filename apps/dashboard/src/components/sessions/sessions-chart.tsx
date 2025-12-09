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

interface SessionsChartProps {
  organizationId: string;
  projectId: string;
}

export function SessionsChart({
  organizationId,
  projectId,
}: SessionsChartProps) {
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
    ...trpc.session.getTimeSeries.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  });

  const { data: statsData } = useQuery({
    ...trpc.session.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  });

  const chartConfig: ChartConfig = useMemo(() => {
    return {
      total: {
        label: "Total Sessions",
        color: "var(--bklit-500)",
      },
      engaged: {
        label: "Engaged",
        color: "var(--chart-1)",
      },
      bounced: {
        label: "Bounced",
        color: "var(--bklit-300)",
      },
    } satisfies ChartConfig;
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sessions Over Time</CardTitle>
          <CardDescription>
            Daily sessions for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
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
          <CardTitle>Sessions Over Time</CardTitle>
          <CardDescription>
            Daily sessions for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="grid flex-1 gap-1">
          <CardTitle>Sessions Over Time</CardTitle>
          <CardDescription>
            Daily sessions for the selected period
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4">
          <div className="col-span-1 flex items-center justify-center">
            <MobileDesktopChart
              mobile={statsData?.mobileSessions || 0}
              desktop={statsData?.desktopSessions || 0}
            />
          </div>
          <div className="col-span-3">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={timeSeriesData.timeSeriesData}>
                <defs>
                  <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
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
                  <linearGradient id="fillEngaged" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-engaged)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-engaged)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillBounced" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-bounced)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-bounced)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--chart-cartesian)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      indicator="dot"
                    />
                  }
                />
                {/* Total sessions area - dashed line */}
                <Area
                  dataKey="total"
                  type="linear"
                  fill="url(#fillTotal)"
                  stroke="var(--color-total)"
                  strokeDasharray="5 5"
                  fillOpacity={0.3}
                />

                {/* Engaged sessions area */}
                <Area
                  dataKey="engaged"
                  type="linear"
                  fill="url(#fillEngaged)"
                  stroke="var(--color-engaged)"
                  fillOpacity={0.6}
                />

                {/* Bounced sessions area */}
                <Area
                  dataKey="bounced"
                  type="linear"
                  fill="url(#fillBounced)"
                  stroke="var(--color-bounced)"
                  fillOpacity={0.6}
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
