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
import { Skeleton } from "@bklit/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart } from "recharts";
import { getMobileDesktopStats } from "@/actions/analytics-actions";
import { authClient } from "@/auth/client";
import { useWorkspace } from "@/contexts/workspace-provider";
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

export function MobileDesktopCard() {
  const { activeProject } = useWorkspace();
  const { data: session } = authClient.useSession();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["mobile-desktop-stats", activeProject?.id],
    queryFn: () =>
      getMobileDesktopStats({
        projectId: activeProject?.id || "",
        userId: session?.user?.id || "",
      }),
    enabled: !!activeProject?.id,
  });

  if (isLoading || !stats) {
    return <MobileDesktopCardSkeleton />;
  }

  const chartData: PieChartData[] = [
    { name: "desktop", value: stats.desktop },
    { name: "mobile", value: stats.mobile },
  ];

  const totalVisits = stats.desktop + stats.mobile;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile/Desktop</CardTitle>
        <CardDescription>
          Unique page visits by device type ({totalVisits} total unique
          visitors).
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
      </CardContent>
    </Card>
  );
}

export function MobileDesktopCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile/Desktop</CardTitle>
        <CardDescription>Unique page visits by device type.</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="min-h-[200px] w-full" />
      </CardContent>
    </Card>
  );
}
