"use client";

import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@bklit/ui/components/pagination";
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
import { formatDistanceToNow } from "date-fns";
import { parseAsInteger, parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { getBrowserIcon } from "@/lib/utils/get-browser-icon";
import { useTRPC } from "@/trpc/react";

interface SessionEventsTableProps {
  organizationId: string;
  projectId: string;
  trackingId: string;
}

export function SessionEventsTable({
  organizationId,
  projectId,
  trackingId,
}: SessionEventsTableProps) {
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

  // Pagination state
  const [paginationParams, setPaginationParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
    },
    {
      history: "push",
    },
  );

  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.event.listBySession.queryOptions({
      projectId,
      organizationId,
      trackingId,
      startDate,
      endDate,
      page: paginationParams.page,
      limit: 10,
    }),
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Events</CardTitle>
          <CardDescription>
            Events grouped by session for tracking ID: {trackingId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={`skeleton-${i}`} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Events</CardTitle>
          <CardDescription>
            Events grouped by session for tracking ID: {trackingId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No events found for this tracking ID.
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePageChange = (page: number) => {
    setPaginationParams({ page });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Events</CardTitle>
        <CardDescription>
          Events grouped by session for tracking ID: {trackingId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Conversion</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.sessions.map((session) => {
              const sessionData = session.session;
              const browser = sessionData?.userAgent
                ? (() => {
                    const ua = sessionData.userAgent;
                    if (ua.includes("Chrome")) return "Chrome";
                    if (ua.includes("Firefox")) return "Firefox";
                    if (ua.includes("Safari")) return "Safari";
                    if (ua.includes("Edge")) return "Edge";
                    return "Unknown";
                  })()
                : "Unknown";

              const browserIcon = getBrowserIcon(browser);

              return (
                <TableRow key={session.sessionId}>
                  <TableCell className="font-mono text-sm">
                    {session.sessionId === "no-session"
                      ? "No Session"
                      : `${session.sessionId.substring(0, 8)}...`}
                  </TableCell>
                  <TableCell>
                    {session.hasClick ? (
                      <Badge variant="success" size="lg">
                        Clicked
                      </Badge>
                    ) : session.hasView ? (
                      <Badge variant="secondary" size="lg">
                        Viewed
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="lg">
                        -
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {session.hasClick ? (
                          <Badge variant="success" size="lg">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" size="lg">
                            No
                          </Badge>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {session.hasClick
                          ? "Event clicked"
                          : session.hasHover
                            ? "Event hovered (not clicked)"
                            : session.hasView
                              ? "Event seen (not clicked)"
                              : "No interaction"}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-sm">
                    {sessionData?.city && sessionData?.country
                      ? `${sessionData.city}, ${sessionData.country}`
                      : sessionData?.country || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-2">
                      {browserIcon} {browser}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {formatDistanceToNow(
                      new Date(session.lastEvent.timestamp),
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

        {data.pagination.totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (data.pagination.hasPreviousPage) {
                        handlePageChange(paginationParams.page - 1);
                      }
                    }}
                    className={
                      !data.pagination.hasPreviousPage
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>

                {Array.from(
                  { length: data.pagination.totalPages },
                  (_, i) => i + 1,
                )
                  .filter((page) => {
                    const current = paginationParams.page;
                    const total = data.pagination.totalPages;
                    return (
                      page === 1 ||
                      page === total ||
                      (page >= current - 1 && page <= current + 1)
                    );
                  })
                  .map((page, index, array) => {
                    const previousPage = array[index - 1];
                    const showEllipsis =
                      index > 0 && previousPage && page - previousPage > 1;
                    return (
                      <>
                        {showEllipsis && (
                          <PaginationItem>
                            <span className="px-4 py-2">...</span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            isActive={page === paginationParams.page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (data.pagination.hasNextPage) {
                        handlePageChange(paginationParams.page + 1);
                      }
                    }}
                    className={
                      !data.pagination.hasNextPage
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
