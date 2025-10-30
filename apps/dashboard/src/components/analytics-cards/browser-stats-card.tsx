"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@bklit/ui/components/chart";
import { Compass } from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { getBrowserStats } from "@/actions/analytics-actions";
import { NoDataCard } from "./no-data-card";

interface BrowserStatsCardProps {
  projectId: string;
  userId: string;
}

export function BrowserStatsCard({ projectId, userId }: BrowserStatsCardProps) {
  const [browserStats, setBrowserStats] = useState<
    { browser: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [hoverName, setHoverName] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchBrowserStats = async () => {
      try {
        const stats = await getBrowserStats({
          projectId,
          userId,
        });
        setBrowserStats(stats);
      } catch (error) {
        console.error("Failed to fetch browser stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrowserStats();
  }, [projectId, userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Browser Usage</CardTitle>
          <CardDescription>Loading browser statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalVisits = browserStats.reduce((sum, stat) => sum + stat.count, 0);

  if (totalVisits === 0) {
    return (
      <NoDataCard
        title="Browser Usage"
        description="Page visits by browser"
        icon={<Compass size={16} />}
      />
    );
  }

  // Create chart config for browsers
  const chartConfig: ChartConfig = browserStats.reduce(
    (config, stat, index) => {
      const colorVar = `--color-chart-${(index % 5) + 1}`;
      config[stat.browser.toLowerCase().replace(/\s+/g, "_")] = {
        label: stat.browser,
        color: `var(${colorVar})`,
      };
      return config;
    },
    {} as ChartConfig,
  );

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
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <PieChart accessibilityLayer data={chartData}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="var(--color-chart-1)"
            >
              {chartData.map((entry) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={`var(--color-${entry.name})`}
                  fillOpacity={
                    hoverName ? (entry.name === hoverName ? 1 : 0.4) : 1
                  }
                  className="transition"
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend
              content={(legendProps) => {
                // biome-ignore lint/suspicious/noExplicitAny: Legend payload typing from recharts
                const payload = (legendProps as any)?.payload as
                  | ReadonlyArray<{
                      value?: string;
                      dataKey?: string;
                      color?: string;
                    }>
                  | undefined;
                return (
                  <div className="flex items-center justify-center gap-4 pt-3">
                    {payload?.map((item) => (
                      <button
                        key={item.dataKey || item.value}
                        type="button"
                        className="flex items-center gap-1.5"
                        onMouseEnter={() =>
                          setHoverName(
                            (item.dataKey || item.value) ?? undefined,
                          )
                        }
                        onMouseLeave={() => setHoverName(undefined)}
                      >
                        <div
                          className="h-2 w-2 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="capitalize">{item.value}</span>
                      </button>
                    ))}
                  </div>
                );
              }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
