"use client";

import type { ChartConfig } from "@bklit/ui/components/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@bklit/ui/components/chart";
import { Bar, BarChart, XAxis } from "recharts";

interface StatusChartProps {
  data: Array<{
    date: string;
    isHealthy: boolean | null; // null means no data
  }>;
}

const chartConfig = {
  healthy: {
    label: "Healthy",
    color: "var(--color-teal-700)",
  },
  unhealthy: {
    label: "Unhealthy",
    color: "var(--color-destructive)",
  },
  unknown: {
    label: "No data",
    color: "var(--color-muted)",
  },
} satisfies ChartConfig;

export function StatusChart({ data }: StatusChartProps) {
  const chartData = data.map((day) => {
    const hasData = day.isHealthy !== null;
    return {
      date: new Date(day.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      healthy: day.isHealthy === true ? 1 : 0,
      unhealthy: day.isHealthy === false ? 1 : 0,
      unknown: !hasData ? 1 : 0,
    };
  });

  return (
    <ChartContainer config={chartConfig} className="h-[120px] w-full">
      <BarChart data={chartData}>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="healthy"
          stackId="a"
          fill="var(--color-teal-700)"
          radius={[5, 5, 5, 5]}
        />
        <Bar
          dataKey="unhealthy"
          stackId="a"
          fill="var(--color-destructive)"
          radius={[5, 5, 5, 5]}
        />
        <Bar
          dataKey="unknown"
          stackId="a"
          fill="var(--color-muted)"
          radius={[5, 5, 5, 5]}
        />
      </BarChart>
    </ChartContainer>
  );
}
