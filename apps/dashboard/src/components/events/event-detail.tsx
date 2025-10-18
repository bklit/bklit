"use client";

import { Badge } from "@bklit/ui/components/badge";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bklit/ui/components/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@bklit/ui/components/popover";
import { Skeleton } from "@bklit/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bklit/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bklit/ui/components/tooltip";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Info,
  MousePointerClick,
  SquareCode,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  Sector,
  XAxis,
} from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { CopyInput } from "@/components/copy-input";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/page-header";
import { Stats } from "@/components/stats";
import { getBrowserIcon } from "@/lib/utils/get-browser-icon";
import { useTRPC } from "@/trpc/react";

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
    },
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
    }),
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

  const conversionChartConfig = {
    converted: {
      label: "Converted",
      color: "var(--chart-1)",
    },
    notConverted: {
      label: "Not Converted",
      color: "var(--bklit-600)",
    },
  } satisfies ChartConfig;

  const conversionData = event
    ? [
        {
          status: "converted",
          value: event.sessionsWithEvent,
          fill: "var(--color-converted)",
        },
        {
          status: "notConverted",
          value: event.totalSessions - event.sessionsWithEvent,
          fill: "var(--color-notConverted)",
        },
      ]
    : [];

  const avgTriggersPerSession =
    event && event.sessionsWithEvent > 0
      ? (event.totalCount / event.sessionsWithEvent).toFixed(2)
      : "0";

  // Show empty state if no event found and not loading
  if (!event && !isLoading) {
    return (
      <>
        <PageHeader title="Event Not Found" description="">
          <div className="flex items-center gap-2">
            <Link href={`/${organizationId}/${projectId}/events`}>
              <Button variant="ghost" size="lg">
                <ArrowLeft />
                Back to Events
              </Button>
            </Link>
          </div>
        </PageHeader>
        <div className="container mx-auto py-6 px-4">
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
        title={event?.name || "Loading..."}
        description={event?.description || "Event analytics and details"}
      >
        <div className="flex items-center gap-2">
          <Link href={`/${organizationId}/${projectId}/events`}>
            <Button variant="ghost" size="lg">
              <ArrowLeft />
              Back to Events
            </Button>
          </Link>

          <DateRangePicker />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="lg">
                <SquareCode className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-fit max-w-[300px]"
              align="end"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mt-2">
                  All interaction types (click, impression, hover) are tracked
                  automatically!
                </p>
                <div>
                  <p className="text-sm font-medium mb-2">Data attribute:</p>
                  <CopyInput
                    value={`<button data-bklit-event="${trackingId}">Click Me</button>`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">ID attribute:</p>
                  <CopyInput
                    value={`<button id="bklit-event-${trackingId}">Click Me</button>`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">
                    Manual (JavaScript):
                  </p>
                  <CopyInput
                    value={`window.trackEvent("${trackingId}", "custom_event");`}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Manual events don't count toward conversion rates since they
                    may not be user-perceived.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </PageHeader>

      <div className="container mx-auto py-6 px-4 space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
                  <p className="text-sm text-muted-foreground">
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
                    <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
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
                    <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    interval="preserveStartEnd"
                  />
                  <Area
                    dataKey="views"
                    type="natural"
                    fill="url(#fillViews)"
                    fillOpacity={0.4}
                    stroke="var(--color-views)"
                    stackId="a"
                  />
                  <Area
                    dataKey="clicks"
                    type="natural"
                    fill="url(#fillClicks)"
                    fillOpacity={0.4}
                    stroke="var(--color-clicks)"
                    stackId="a"
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
            <CardContent className="flex justify-center relative">
              {event && event.totalSessions === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    No session data available
                  </p>
                </div>
              )}
              <ChartContainer
                config={conversionChartConfig}
                className="h-[250px] w-full"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel nameKey="status" />}
                  />
                  <Pie
                    data={conversionData}
                    dataKey="value"
                    nameKey="status"
                    innerRadius={46}
                    strokeWidth={10}
                    activeShape={({
                      outerRadius = 0,
                      ...props
                    }: PieSectorDataItem) => (
                      <Sector {...props} outerRadius={outerRadius + 10} />
                    )}
                  />
                  <ChartLegend
                    content={<ChartLegendContent nameKey="status" />}
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              {isLoading || !event
                ? "Loading event triggers..."
                : `Latest ${event.recentEvents.length} event triggers with session context`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !event ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : event.recentEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events tracked yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Method
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-1">Automatic</p>
                            <p className="text-xs mb-2">
                              DOM-triggered events (data-attr, ID). User sees
                              and interacts with the element. Counts toward
                              conversion.
                            </p>
                            <p className="font-semibold mb-1">Manual</p>
                            <p className="text-xs">
                              JavaScript-invoked events. May be programmatic,
                              not user-perceived. Doesn't count toward
                              conversion.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>Conversion</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead className="text-right">Time Ago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.recentEvents.map((trackedEvent) => {
                    const metadata = trackedEvent.metadata as {
                      eventType?: string;
                      triggerMethod?: string;
                    } | null;
                    // Legacy events without triggerMethod are treated as automatic
                    const triggerMethod =
                      metadata?.triggerMethod || "automatic";

                    // Session data (typed as optional since the relation might not be present)
                    const session = (
                      trackedEvent as typeof trackedEvent & {
                        session?: {
                          userAgent?: string | null;
                          country?: string | null;
                          city?: string | null;
                        } | null;
                      }
                    ).session;

                    // Parse user agent for browser info
                    const userAgent = session?.userAgent || "";
                    const browserMatch = userAgent.match(
                      /(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/,
                    );
                    const browser = browserMatch
                      ? browserMatch[1] || "Other"
                      : userAgent
                        ? "Other"
                        : "-";

                    const browserIcon = getBrowserIcon(browser);

                    return (
                      <TableRow key={trackedEvent.id}>
                        <TableCell className="font-mono text-sm">
                          {format(
                            new Date(trackedEvent.timestamp),
                            "MMM d, yyyy HH:mm:ss",
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            size="lg"
                            variant={
                              triggerMethod === "automatic"
                                ? "default"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {triggerMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {triggerMethod === "automatic" ? (
                            <Badge variant="success" size="lg">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" size="lg">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {session?.city && session?.country
                            ? `${session.city}, ${session.country}`
                            : session?.country || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="flex items-center gap-2">
                            {browserIcon} {browser}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          {formatDistanceToNow(
                            new Date(trackedEvent.timestamp),
                            {
                              addSuffix: true,
                            },
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
