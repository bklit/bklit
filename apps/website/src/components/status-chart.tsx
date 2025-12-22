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
      unknown: hasData ? 0 : 1,
    };
  });

  return (
    <ChartContainer className="h-[120px] w-full" config={chartConfig}>
      <BarChart data={chartData}>
        <XAxis
          axisLine={false}
          dataKey="date"
          tickLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="healthy"
          fill="var(--color-teal-700)"
          radius={[5, 5, 5, 5]}
          stackId="a"
        />
        <Bar
          dataKey="unhealthy"
          fill="var(--color-destructive)"
          radius={[5, 5, 5, 5]}
          stackId="a"
        />
        <Bar
          dataKey="unknown"
          fill="var(--color-muted)"
          radius={[5, 5, 5, 5]}
          stackId="a"
        />
      </BarChart>
    </ChartContainer>
  );
}
