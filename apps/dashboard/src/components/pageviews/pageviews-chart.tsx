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

interface PageviewsChartProps {
  organizationId: string;
  projectId: string;
  viewMode: "all" | "entry-points";
}

export function PageviewsChart({
  organizationId,
  projectId,
  viewMode,
}: PageviewsChartProps) {
  const trpc = useTRPC();

  // Date range state using nuqs
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

  // Get pageviews time series data for "all" mode
  const { data: pageviewsData, isLoading: pageviewsLoading } = useQuery({
    ...trpc.pageview.getTimeSeries.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
      limit: 5,
    }),
    enabled: viewMode === "all",
  });

  // Get entry points time series data for "entry-points" mode
  const {
    data: entryPointsTimeSeriesData,
    isLoading: entryPointsTimeSeriesLoading,
  } = useQuery({
    ...trpc.pageview.getEntryPointsTimeSeries.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
      limit: 5,
    }),
    enabled: viewMode === "entry-points",
  });

  // Get entry points data for mobile/desktop breakdown
  const { data: entryPointsData } = useQuery({
    ...trpc.pageview.getEntryPoints.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
      limit: 100, // Get more data for mobile/desktop calculation
    }),
    enabled: viewMode === "entry-points",
  });

  // Get stats data for mobile/desktop breakdown in "all" mode
  const { data: statsData } = useQuery({
    ...trpc.pageview.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
    enabled: viewMode === "all",
  });

  const isLoading = pageviewsLoading || entryPointsTimeSeriesLoading;
  const chartData =
    viewMode === "all" ? pageviewsData : entryPointsTimeSeriesData;

  // Calculate mobile/desktop breakdown based on view mode
  const mobileDesktopData = useMemo(() => {
    if (viewMode === "entry-points" && entryPointsData?.entryPages) {
      // For entry points, sum up mobile/desktop sessions from all entry points
      const totalMobile = entryPointsData.entryPages.reduce(
        (sum, page) => sum + (page.mobileSessions || 0),
        0,
      );
      const totalDesktop = entryPointsData.entryPages.reduce(
        (sum, page) => sum + (page.desktopSessions || 0),
        0,
      );
      return { mobile: totalMobile, desktop: totalDesktop };
    } else if (viewMode === "all" && statsData) {
      // For all pageviews, use the stats data
      return {
        mobile: statsData.mobileViews || 0,
        desktop: statsData.desktopViews || 0,
      };
    }
    return { mobile: 0, desktop: 0 };
  }, [viewMode, entryPointsData, statsData]);

  // Generate chart config for dynamic pages/entry points
  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {
      total: {
        label: viewMode === "entry-points" ? "Total Sessions" : "Total Views",
        color: "var(--bklit-500)",
      },
    };

    // Add individual page/entry point configs
    const items =
      viewMode === "entry-points"
        ? (chartData as any)?.topEntryPoints
        : (chartData as any)?.topPages;

    items?.forEach((item: any, index: number) => {
      const colors = [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
        "var(--chart-4)",
        "var(--chart-5)",
      ];
      config[item.dataKey] = {
        label: item.title,
        color: colors[index] || "var(--chart-1)",
      };
    });

    return config;
  }, [chartData, viewMode]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === "entry-points"
              ? "Entry Points Over Time"
              : "Pageviews Over Time"}
          </CardTitle>
          <CardDescription>
            Top 5 pages by view count over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              Loading chart...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.timeSeriesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === "entry-points"
              ? "Entry Points Over Time"
              : "Pageviews Over Time"}
          </CardTitle>
          <CardDescription>
            Top 5 pages by view count over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-sm text-muted-foreground">
              No data available
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0">
      <CardHeader>
        <div className="grid flex-1 gap-1">
          <CardTitle>
            {viewMode === "entry-points"
              ? "Entry Points Over Time"
              : "Pageviews Over Time"}
          </CardTitle>
          <CardDescription>
            Top{" "}
            {viewMode === "entry-points"
              ? (chartData as any)?.topEntryPoints?.length || 0
              : (chartData as any)?.topPages?.length || 0}{" "}
            {viewMode === "entry-points" ? "entry points" : "pages"} by{" "}
            {viewMode === "entry-points" ? "session count" : "view count"} over
            the last 30 days
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="flex flex-col sm:grid grid-cols-4 gap-4">
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
                  {(viewMode === "entry-points"
                    ? (chartData as any)?.topEntryPoints
                    : (chartData as any)?.topPages
                  )?.map((page: any) => (
                    <linearGradient
                      key={`fill${page.dataKey}`}
                      id={`fill${page.dataKey}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={`var(--color-${page.dataKey})`}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--color-${page.dataKey})`}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  stroke="var(--chart-cartesian)"
                  strokeDasharray="5 5"
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

                {/* Individual page areas - overlapping */}
                {(viewMode === "entry-points"
                  ? (chartData as any)?.topEntryPoints
                  : (chartData as any)?.topPages
                )?.map((page: any) => (
                  <Area
                    key={page.dataKey}
                    dataKey={page.dataKey}
                    type="linear"
                    fill={`url(#fill${page.dataKey})`}
                    stroke={`var(--color-${page.dataKey})`}
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
