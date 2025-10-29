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

interface PageviewsChartProps {
  organizationId: string;
  projectId: string;
}

export function PageviewsChart({
  organizationId,
  projectId,
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

  const { data: chartData, isLoading } = useQuery(
    trpc.pageview.getTimeSeries.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
      limit: 5,
    }),
  );

  // Generate chart config for dynamic pages
  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {
      total: {
        label: "Total Views",
        color: "var(--bklit-500)",
      },
    };

    // Add individual page configs
    chartData?.topPages.forEach((page, index) => {
      const colors = [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
        "var(--chart-4)",
        "var(--chart-5)",
      ];
      config[page.dataKey] = {
        label: page.title,
        color: colors[index] || "var(--chart-1)",
      };
    });

    return config;
  }, [chartData?.topPages]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pageviews Over Time</CardTitle>
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
          <CardTitle>Pageviews Over Time</CardTitle>
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
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Pageviews Over Time</CardTitle>
          <CardDescription>
            Top {chartData.topPages.length} pages by view count over the last 30
            days
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
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
              {chartData.topPages.map((page) => (
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
            <CartesianGrid vertical={false} />
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
            {chartData.topPages.map((page) => (
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
      </CardContent>
    </Card>
  );
}
