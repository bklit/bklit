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
import { MobileDesktopChart } from "@/components/analytics-cards/mobile-desktop-chart";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
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
    }
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) {
      return dateParams.startDate;
    }
    if (!dateParams.endDate) {
      return undefined;
    }
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
    })
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
        <CardContent className="flex h-[250px] items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading chart data...</p>
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
        <CardContent className="flex h-[250px] items-center justify-center">
          <p className="text-muted-foreground text-sm">
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
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-4">
          <div className="col-span-1 flex items-center justify-center">
            <MobileDesktopChart
              desktop={mobileDesktopData.desktop}
              mobile={mobileDesktopData.mobile}
            />
          </div>
          <div className="col-span-3">
            <TimeSeriesChart
              chartConfig={chartConfig}
              data={chartData.timeSeriesData}
              endDate={endDate}
              isLoading={isLoading}
              projectId={projectId}
              showDeployments={true}
              startDate={startDate}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
