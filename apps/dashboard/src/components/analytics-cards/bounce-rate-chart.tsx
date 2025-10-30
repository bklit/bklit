"use client";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@bklit/ui/components/chart";
import { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

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
  const [hoverName, setHoverName] = useState<string | undefined>(undefined);
  const nonBouncedSessions = totalSessions - bouncedSessions;

  const chartData = [
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
              fillOpacity={hoverName ? (entry.name === hoverName ? 1 : 0.4) : 1}
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
                      setHoverName((item.dataKey || item.value) ?? undefined)
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
  );
}
