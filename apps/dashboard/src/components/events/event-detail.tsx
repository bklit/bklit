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
import { parseAsBoolean, parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { Stats } from "@/components/stats";
import { getPreviousPeriod } from "@/lib/date-utils";
import { calculateChange } from "@/lib/stats-utils";
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
      compare: parseAsBoolean.withDefault(true),
    },
    {
      history: "push",
    }
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) {
      return dateParams.startDate;
    }
    if (!dateParams.endDate) {
      return undefined;
    }
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;
  const compare = dateParams.compare;

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

  // Calculate previous period dates for comparison
  const { startDate: prevStartDate, endDate: prevEndDate } = useMemo(() => {
    if (!(compare && startDate && endDate)) {
      return { startDate: undefined, endDate: undefined };
    }
    return getPreviousPeriod(startDate, endDate);
  }, [compare, startDate, endDate]);

  // Fetch previous period event data for comparison
  const { data: prevEvent, isLoading: prevEventLoading } = useQuery({
    ...trpc.event.getByTrackingId.queryOptions({
      trackingId,
      projectId,
      organizationId,
      startDate: prevStartDate,
      endDate: prevEndDate,
    }),
    enabled: compare && !!prevStartDate && !!prevEndDate,
  });

  const prevAvgTriggersPerSession =
    prevEvent && prevEvent.sessionsWithEvent > 0
      ? (prevEvent.totalCount / prevEvent.sessionsWithEvent).toFixed(2)
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
          <Card>
            <Empty>
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
          </Card>
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

      <div className="container mx-auto flex flex-col gap-4">
        {/* Key Metrics */}
        <Stats
          items={[
            {
              icon: MousePointerClick,
              name: "Total Triggers",
              stat: isLoading || !event ? "..." : event.totalCount,
              ...(compare &&
                prevEvent &&
                event && {
                  ...calculateChange(event.totalCount, prevEvent.totalCount),
                }),
              ...(compare &&
                !prevEvent && {
                  changeLoading: prevEventLoading,
                }),
            },
            {
              icon: TrendingUp,
              name: "Conversion Rate",
              stat:
                isLoading || !event
                  ? "..."
                  : Number.isNaN(event.conversionRate) ||
                      event.conversionRate === undefined
                    ? 0
                    : event.conversionRate,
              suffix: "%",
              ...(compare &&
                prevEvent &&
                event &&
                typeof event.conversionRate === "number" &&
                typeof prevEvent.conversionRate === "number" &&
                !Number.isNaN(event.conversionRate) &&
                !Number.isNaN(prevEvent.conversionRate) && {
                  ...calculateChange(
                    event.conversionRate,
                    prevEvent.conversionRate
                  ),
                }),
              ...(compare &&
                !prevEvent && {
                  changeLoading: prevEventLoading,
                }),
            },
            {
              icon: Users,
              name: "Sessions with Event",
              stat: isLoading || !event ? "..." : event.sessionsWithEvent,
              ...(compare &&
                prevEvent &&
                event && {
                  ...calculateChange(
                    event.sessionsWithEvent,
                    prevEvent.sessionsWithEvent
                  ),
                }),
              ...(compare &&
                !prevEvent && {
                  changeLoading: prevEventLoading,
                }),
            },
            {
              icon: BarChart3,
              name: "Avg per Session",
              stat: isLoading || !event ? "..." : avgTriggersPerSession,
              ...(compare &&
                prevEvent &&
                event && {
                  ...calculateChange(
                    Number.parseFloat(avgTriggersPerSession),
                    Number.parseFloat(prevAvgTriggersPerSession)
                  ),
                }),
              ...(compare &&
                !prevEvent && {
                  changeLoading: prevEventLoading,
                }),
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          {/* Conversion Pie Chart */}
          <Card className="col-span-1 sm:col-span-3">
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

          {/* Timeline Chart */}
          <Card className="col-span-1 sm:col-span-9">
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
              <TimeSeriesChart
                chartConfig={timelineChartConfig}
                data={event?.timeSeriesData || []}
                endDate={endDate}
                height={300}
                isLoading={isLoading}
                projectId={projectId}
                showDeployments={true}
                startDate={startDate}
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
