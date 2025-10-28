"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@bklit/ui/components/chart";
import { Cell, Pie, PieChart } from "recharts";
import type { PieChartData } from "@/types/analytics-cards";

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--color-chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

interface MobileDesktopChartProps {
  desktop: number;
  mobile: number;
}

export function MobileDesktopChart({
  desktop,
  mobile,
}: MobileDesktopChartProps) {
  const chartData: PieChartData[] = [
    { name: "desktop", value: desktop },
    { name: "mobile", value: mobile },
  ];

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <PieChart accessibilityLayer data={chartData}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="var(--color-desktop)"
        >
          {chartData.map((entry) => (
            <Cell
              key={`cell-${entry.name}`}
              fill={`var(--color-${entry.name})`}
            />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend
          content={<ChartLegendContent verticalAlign="horizontal" />}
        />
      </PieChart>
    </ChartContainer>
  );
}
