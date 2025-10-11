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
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@bklit/ui/components/chart";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart } from "recharts";
import { useWorkspace } from "@/contexts/workspace-provider";
import type { BounceRateData, PieChartData } from "@/types/analytics-cards";

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

function useBounceRate(projectId: string | undefined, days = 30) {
  return useQuery<BounceRateData | null>({
    queryKey: ["bounce-rate", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await fetch(
        `/api/session-analytics?projectId=${projectId}&days=${days}`,
      );
      if (!res.ok) throw new Error("Failed to fetch bounce rate");
      return res.json();
    },
    enabled: !!projectId,
  });
}

export function BounceRateCard() {
  const { activeProject } = useWorkspace();
  const { data, isLoading } = useBounceRate(activeProject?.id || undefined);

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bounce Rate</CardTitle>
          <CardDescription>Sessions that bounced</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nonBouncedSessions = data.totalSessions - data.bouncedSessions;

  const chartData: PieChartData[] = [
    { name: "bounced", value: data.bouncedSessions },
    { name: "engaged", value: nonBouncedSessions },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.bounceRate}% Bounce Rate</CardTitle>
        <CardDescription>
          {data.bouncedSessions} of {data.totalSessions} sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-4 h-[200px]">
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
        </div>
      </CardContent>
    </Card>
  );
}
