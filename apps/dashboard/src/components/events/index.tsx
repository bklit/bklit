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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bklit/ui/components/empty";
import { Spinner } from "@bklit/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCaption,
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
import {
  Activity,
  CalendarIcon,
  Clock,
  Info,
  Monitor,
  User,
} from "lucide-react";
import Link from "next/link";
import { parseAsBoolean, parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/header/page-header";
import { Stats } from "@/components/stats";
import { getPreviousPeriod } from "@/lib/date-utils";
import { calculateChange } from "@/lib/stats-utils";
import { useTRPC } from "@/trpc/react";
import { EventSheet } from "./event-sheet";
import { EventsChart } from "./events-chart";
import type { EventListItem } from "./types";

interface EventsProps {
  organizationId: string;
  projectId: string;
}

export function Events({ organizationId, projectId }: EventsProps) {
  const [editingEvent, setEditingEvent] = useState<EventListItem | null>(null);
  const [openEventsSheet, setOpenEventsSheet] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");

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

  const trpc = useTRPC();

  // Total sessions in range for conversion rate baseline
  const { data: sessionsStats } = useQuery(
    trpc.session.getStats.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    })
  );

  const {
    data: events,
    isLoading,
    refetch,
  } = useQuery(
    trpc.event.list.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    })
  );

  // Calculate previous period dates for comparison
  const { startDate: prevStartDate, endDate: prevEndDate } = useMemo(() => {
    if (!(compare && startDate && endDate)) {
      return { startDate: undefined, endDate: undefined };
    }
    return getPreviousPeriod(startDate, endDate);
  }, [compare, startDate, endDate]);

  // Fetch previous period events for comparison
  const { data: prevEvents, isLoading: prevEventsLoading } = useQuery({
    ...trpc.event.list.queryOptions({
      projectId,
      organizationId,
      startDate: prevStartDate,
      endDate: prevEndDate,
    }),
    enabled: compare && !!prevStartDate && !!prevEndDate,
  });

  const openCreateSheet = () => {
    setSheetMode("create");
    setEditingEvent(null);
    setOpenEventsSheet(true);
  };

  const openEditSheet = (event: EventListItem) => {
    setSheetMode("edit");
    setEditingEvent(event);
    setOpenEventsSheet(true);
  };

  return (
    <>
      <PageHeader description="Manage your events" title="Events">
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <Button onClick={openCreateSheet}>Create Event</Button>
        </div>
      </PageHeader>

      <EventSheet
        editingEvent={editingEvent}
        existingEvents={events}
        mode={sheetMode}
        onOpenChange={setOpenEventsSheet}
        onSuccess={() => refetch()}
        open={openEventsSheet}
        organizationId={organizationId}
        projectId={projectId}
      />

      <div className="container mx-auto flex flex-col gap-4">
        <Stats
          items={[
            {
              icon: Clock,
              name: "Total Events",
              stat: events?.length || 0,
              // Note: Total Events is count of event definitions, not date-filtered, so no comparison
            },
            {
              icon: Monitor,
              name: "Total Interactions",
              stat: events?.reduce((sum, e) => sum + e.totalCount, 0) || 0,
              ...(compare &&
                prevEvents && {
                  ...calculateChange(
                    events?.reduce((sum, e) => sum + e.totalCount, 0) || 0,
                    prevEvents?.reduce((sum, e) => sum + e.totalCount, 0) || 0
                  ),
                }),
              ...(compare &&
                !prevEvents && {
                  changeLoading: prevEventsLoading,
                }),
            },
            {
              icon: User,
              name: "Avg Interactions",
              stat: events?.length
                ? Math.round(
                    events.reduce((sum, e) => sum + e.totalCount, 0) /
                      events.length
                  )
                : 0,
              ...(compare &&
                prevEvents && {
                  ...calculateChange(
                    events?.length
                      ? Math.round(
                          events.reduce((sum, e) => sum + e.totalCount, 0) /
                            events.length
                        )
                      : 0,
                    prevEvents?.length
                      ? Math.round(
                          prevEvents.reduce((sum, e) => sum + e.totalCount, 0) /
                            prevEvents.length
                        )
                      : 0
                  ),
                }),
              ...(compare &&
                !prevEvents && {
                  changeLoading: prevEventsLoading,
                }),
            },
            {
              icon: CalendarIcon,
              name: "Interactions today",
              stat:
                events?.reduce((sum, e) => {
                  const today = e.recentEvents.filter(
                    (re) =>
                      new Date(re.timestamp) >
                      new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length;
                  return sum + today;
                }, 0) || 0,
            },
          ]}
        />

        <EventsChart organizationId={organizationId} projectId={projectId} />

        {isLoading && (
          <Card>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Spinner />
                </EmptyMedia>
                <EmptyTitle>Loading events...</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <EmptyDescription>Fetching your events</EmptyDescription>
              </EmptyContent>
            </Empty>
          </Card>
        )}
        {events && events.length === 0 && (
          <Card>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Activity size={16} />
                </EmptyMedia>
                <EmptyTitle>No events found</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <EmptyDescription>
                  No events found for the selected date range.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          </Card>
        )}
        {events && Array.isArray(events) && events.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <CardDescription>A list of your events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption className="sr-only">
                  A list of your events
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Total Sessions</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Sessions with Event
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Number of unique sessions that triggered this
                            specific event.
                            <br />
                            Multiple triggers within the same session count as
                            one.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Conversion Rate
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Conversion rate = sessions with event / total
                            sessions in range.
                            <br />
                            One conversion per session maximum.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const uniqueSessionsCount = event.uniqueSessionsCount ?? 0;
                    // Conversion rate: sessions with event / total sessions in range
                    // This shows what percentage of all sessions triggered this event
                    const totalSessionsInRange =
                      sessionsStats?.totalSessions ?? 0;
                    const conversionRate =
                      totalSessionsInRange > 0
                        ? (uniqueSessionsCount / totalSessionsInRange) * 100
                        : 0;
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          {event.name}
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-2 py-1 text-sm">
                            {event.trackingId}
                          </code>
                        </TableCell>
                        <TableCell>{totalSessionsInRange}</TableCell>
                        <TableCell>{uniqueSessionsCount}</TableCell>
                        <TableCell className="font-mono">
                          <Badge
                            size="lg"
                            variant={
                              conversionRate > 75
                                ? "success"
                                : conversionRate > 35
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {conversionRate.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/${organizationId}/${projectId}/events/${event.trackingId}`}
                            >
                              <Button size="lg" variant="secondary">
                                View
                              </Button>
                            </Link>
                            <Button
                              onClick={() => openEditSheet(event)}
                              size="lg"
                              variant="outline"
                            >
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
