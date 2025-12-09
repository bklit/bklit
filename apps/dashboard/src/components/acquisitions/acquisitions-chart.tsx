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

interface AcquisitionsChartProps {
  organizationId: string;
  projectId: string;
}

export function AcquisitionsChart({
  organizationId,
  projectId,
}: AcquisitionsChartProps) {
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

  const { data: chartData, isLoading } = useQuery(
    trpc.acquisition.getTimeSeries.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
      limit: 5,
    }),
  );

  // Get stats data for mobile/desktop breakdown
  const { data: statsData } = useQuery({
    ...trpc.acquisition.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  });

  // Calculate mobile/desktop breakdown
  const mobileDesktopData = useMemo(() => {
    if (statsData) {
      return {
        mobile: statsData.mobileViews || 0,
        desktop: statsData.desktopViews || 0,
      };
    }
    return { mobile: 0, desktop: 0 };
  }, [statsData]);

  // Generate chart config for dynamic sources
  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {
      total: {
        label: "Total Views",
        color: "var(--bklit-500)",
      },
    };

    // Add individual source configs
    chartData?.topSources.forEach((source, index) => {
      const colors = [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
        "var(--chart-4)",
        "var(--chart-5)",
      ];
      config[source.dataKey] = {
        label: source.source,
        color: colors[index] || "var(--chart-1)",
      };
    });

    return config;
  }, [chartData?.topSources]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acquisitions Over Time</CardTitle>
          <CardDescription>
            Top 5 traffic sources over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading chart data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.timeSeriesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acquisitions Over Time</CardTitle>
          <CardDescription>
            Top 5 traffic sources over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No data available for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0">
      <CardHeader>
        <div className="grid flex-1 gap-1">
          <CardTitle>Acquisitions Over Time</CardTitle>
          <CardDescription>
            Top {chartData.topSources.length} traffic sources over the last 30
            days
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="grid grid-cols-4">
          <div className="col-span-1 flex items-center justify-center">
            <MobileDesktopChart
              mobile={mobileDesktopData.mobile}
              desktop={mobileDesktopData.desktop}
            />
          </div>
          <div className="col-span-3">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={chartData.timeSeriesData}>
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
                  {chartData.topSources.map((source) => (
                    <linearGradient
                      key={`fill${source.dataKey}`}
                      id={`fill${source.dataKey}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={`var(--color-${source.dataKey})`}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--color-${source.dataKey})`}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  ))}
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
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />

                {/* Total views area - dashed line */}
                <Area
                  dataKey="total"
                  type="linear"
                  fill="url(#fillTotal)"
                  stroke="var(--color-total)"
                  strokeDasharray="5 5"
                  fillOpacity={0.3}
                />

                {/* Individual source areas - overlapping */}
                {chartData.topSources.map((source) => (
                  <Area
                    key={source.dataKey}
                    dataKey={source.dataKey}
                    type="linear"
                    fill={`url(#fill${source.dataKey})`}
                    stroke={`var(--color-${source.dataKey})`}
                    fillOpacity={0.6}
                  />
                ))}

                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
