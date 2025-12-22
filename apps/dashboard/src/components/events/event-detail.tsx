"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import type { ChartConfig } from "@bklit/ui/components/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@bklit/ui/components/chart";
import { PieDonut } from "@bklit/ui/components/charts/pie-donut";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bklit/ui/components/empty";
import { CopyInput } from "@bklit/ui/components/input-copy";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bklit/ui/components/popover";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  MousePointerClick,
  SquareCode,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { Stats } from "@/components/stats";
import { useTRPC } from "@/trpc/react";
import { SessionEventsTable } from "./session-events-table";

interface EventDetailProps {
  organizationId: string;
  projectId: string;
  trackingId: string;
}

export function EventDetail({
  organizationId,
  projectId,
  trackingId,
}: EventDetailProps) {
  const trpc = useTRPC();

  // Date range state using nuqs
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
    if (dateParams.startDate) return dateParams.startDate;
    if (!dateParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;

  const { data: event, isLoading } = useQuery(
    trpc.event.getByTrackingId.queryOptions({
      trackingId,
      projectId,
      organizationId,
      startDate,
      endDate,
    })
  );

  const timelineChartConfig = {
    views: {
      label: "Impressions",
      color: "var(--bklit-500)",
    },
    clicks: {
      label: "Clicks",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const conversionData = event
    ? [
        {
          name: "converted",
          value: event.sessionsWithEvent,
          label: "Converted",
        },
        {
          name: "notConverted",
          value: event.totalSessions - event.sessionsWithEvent,
          label: "Not Converted",
        },
      ]
    : [];

  const avgTriggersPerSession =
    event && event.sessionsWithEvent > 0
      ? (event.totalCount / event.sessionsWithEvent).toFixed(2)
      : "0";

  // Show empty state if no event found and not loading
  if (!(event || isLoading)) {
    return (
      <>
        <PageHeader description="" title="Event Not Found">
          <div className="flex items-center gap-2">
            <Link href={`/${organizationId}/${projectId}/events`}>
              <Button size="lg" variant="ghost">
                <ArrowLeft />
                Back to Events
              </Button>
            </Link>
          </div>
        </PageHeader>
        <div className="container mx-auto">
          <Empty className="border border-bklit-600 bg-bklit-900">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity size={16} />
              </EmptyMedia>
              <EmptyTitle>Event not found</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                The event you're looking for doesn't exist.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        description={event?.description || "Event analytics and details"}
        title={event?.name || "Loading..."}
      >
        <div className="flex items-center gap-2">
          <Link href={`/${organizationId}/${projectId}/events`}>
            <Button size="lg" variant="ghost">
              <ArrowLeft />
              Back to Events
            </Button>
          </Link>

          <DateRangePicker />

          <Popover>
            <PopoverTrigger asChild>
              <Button size="lg" variant="secondary">
                <SquareCode className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-fit max-w-[300px]"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="space-y-2">
                <p className="mt-2 text-muted-foreground text-xs">
                  All interaction types (click, impression, hover) are tracked
                  automatically!
                </p>
                <div>
                  <p className="mb-2 font-medium text-sm">Data attribute:</p>
                  <CopyInput
                    value={`<button data-bklit-event="${trackingId}">Click Me</button>`}
                  />
                </div>
                <div>
                  <p className="mb-2 font-medium text-sm">ID attribute:</p>
                  <CopyInput
                    value={`<button id="bklit-event-${trackingId}">Click Me</button>`}
                  />
                </div>
                <div>
                  <p className="mb-2 font-medium text-sm">Programmatic (JS):</p>
                  <CopyInput
                    value={`window.trackEvent("${trackingId}", "custom_event");`}
                  />
                  <p className="mt-2 text-muted-foreground text-xs">
                    Programmatic events are triggered via code (e.g. SDK calls).
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </PageHeader>

      <div className="container mx-auto gap-4">
        {/* Key Metrics */}
        <Stats
          items={[
            {
              icon: MousePointerClick,
              name: "Total Triggers",
              stat: isLoading || !event ? "..." : event.totalCount,
            },
            {
              icon: TrendingUp,
              name: "Conversion Rate",
              stat: isLoading || !event ? "..." : `${event.conversionRate}%`,
            },
            {
              icon: Users,
              name: "Sessions with Event",
              stat: isLoading || !event ? "..." : event.sessionsWithEvent,
            },
            {
              icon: BarChart3,
              name: "Avg per Session",
              stat: isLoading || !event ? "..." : avgTriggersPerSession,
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Event Timeline</CardTitle>
              <CardDescription>
                Impressions and clicks over time
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {event && event.timeSeriesData.length === 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
                  <p className="text-muted-foreground text-sm">
                    No data available
                  </p>
                </div>
              )}
              <ChartContainer config={timelineChartConfig}>
                <AreaChart
                  data={event?.timeSeriesData || []}
                  margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
                >
                  <defs>
                    <linearGradient id="fillViews" x1="0" x2="0" y1="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-views)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-views)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient id="fillClicks" x1="0" x2="0" y1="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-clicks)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-clicks)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--chart-cartesian)"
                    strokeDasharray="3 3"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <XAxis
                    axisLine={false}
                    dataKey="date"
                    interval="preserveStartEnd"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <Area
                    dataKey="views"
                    fill="url(#fillViews)"
                    fillOpacity={0.4}
                    stackId="a"
                    stroke="var(--color-views)"
                    type="natural"
                  />
                  <Area
                    dataKey="clicks"
                    fill="url(#fillClicks)"
                    fillOpacity={0.4}
                    stackId="a"
                    stroke="var(--color-clicks)"
                    type="natural"
                  />
                  <ChartLegend
                    content={<ChartLegendContent />}
                    verticalAlign="bottom"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Conversion Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Overview</CardTitle>
              <CardDescription>
                Sessions with vs without this event
              </CardDescription>
            </CardHeader>
            <CardContent className="relative flex justify-center">
              {event && event.totalSessions === 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
                  <p className="text-muted-foreground text-sm">
                    No session data available
                  </p>
                </div>
              )}
              <PieDonut
                centerLabel={{ showTotal: true, suffix: "sessions" }}
                className="min-h-[250px] w-full"
                data={conversionData}
                innerRadius={46}
                outerRadius={80}
                variant="positive-negative"
              />
            </CardContent>
          </Card>
        </div>

        {/* Session Events Table */}
        <SessionEventsTable
          organizationId={organizationId}
          projectId={projectId}
          trackingId={trackingId}
        />
      </div>
    </>
  );
}
