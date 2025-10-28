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
  bounced: {
    label: "Bounced",
    color: "var(--color-chart-5)",
  },
  engaged: {
    label: "Engaged",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

interface BounceRateChartProps {
  bouncedSessions: number;
  totalSessions: number;
}

export function BounceRateChart({
  bouncedSessions,
  totalSessions,
}: BounceRateChartProps) {
  const nonBouncedSessions = totalSessions - bouncedSessions;

  const chartData: PieChartData[] = [
    { name: "bounced", value: bouncedSessions },
    { name: "engaged", value: nonBouncedSessions },
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
          fill="var(--color-bounced)"
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
