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
          <CardTitle>Sessions Over Time</CardTitle>
          <CardDescription>
            Daily sessions for the selected period
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
        <div className="flex flex-col sm:grid sm:grid-cols-4">
          <div className="col-span-1 flex items-center justify-center">
            <MobileDesktopChart
              desktop={statsData?.desktopSessions || 0}
              mobile={statsData?.mobileSessions || 0}
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
                  <linearGradient id="fillEngaged" x1="0" x2="0" y1="0" y2="1">
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
                  <linearGradient id="fillBounced" x1="0" x2="0" y1="0" y2="1">
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
                {/* Total sessions area - dashed line */}
                <Area
                  dataKey="total"
                  fill="url(#fillTotal)"
                  fillOpacity={0.3}
                  stroke="var(--color-total)"
                  strokeDasharray="5 5"
                  type="linear"
                />

                {/* Engaged sessions area */}
                <Area
                  dataKey="engaged"
                  fill="url(#fillEngaged)"
                  fillOpacity={0.6}
                  stroke="var(--color-engaged)"
                  type="linear"
                />

                {/* Bounced sessions area */}
                <Area
                  dataKey="bounced"
                  fill="url(#fillBounced)"
                  fillOpacity={0.6}
                  stroke="var(--color-bounced)"
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
