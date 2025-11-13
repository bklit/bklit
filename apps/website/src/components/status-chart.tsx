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
    isHealthy: boolean;
  }>;
}

const chartConfig = {
  healthy: {
    label: "Healthy",
    color: "#10b981", // emerald-500
  },
  unhealthy: {
    label: "Unhealthy",
    color: "#ef4444", // red-500
  },
} satisfies ChartConfig;

export function StatusChart({ data }: StatusChartProps) {
  const chartData = data.map((day) => ({
    date: new Date(day.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    healthy: day.isHealthy ? 1 : 0,
    unhealthy: day.isHealthy ? 0 : 1,
  }));

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
          fill="#10b981"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="unhealthy"
          stackId="a"
          fill="#ef4444"
          radius={[0, 0, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
