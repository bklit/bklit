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
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { parseAsInteger, parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { CircleFlag } from "react-circle-flags";
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

  // Pagination state
  const [paginationParams, setPaginationParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
    },
    {
      history: "push",
    }
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
    })
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
              <Skeleton className="h-12 w-full" key={`skeleton-${i}`} />
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
          <div className="py-8 text-center text-muted-foreground">
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
              <TableHead className="text-right">Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.sessions.map((session) => {
              const sessionData = session.session;
              const browser = sessionData?.user_agent
                ? (() => {
                    const ua = sessionData.user_agent;
                    if (ua.includes("Chrome")) {
                      return "Chrome";
                    }
                    if (ua.includes("Firefox")) {
                      return "Firefox";
                    }
                    if (ua.includes("Safari")) {
                      return "Safari";
                    }
                    if (ua.includes("Edge")) {
                      return "Edge";
                    }
                    return "Unknown";
                  })()
                : "Unknown";

              const browserIcon = getBrowserIcon(browser);

              return (
                <TableRow key={session.sessionId}>
                  <TableCell>
                    {session.sessionId === "no-session" || !sessionData?.id ? (
                      session.sessionId === "no-session" ? (
                        "No Session"
                      ) : (
                        `${session.sessionId.substring(0, 8)}...`
                      )
                    ) : (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/${organizationId}/${projectId}/sessions/${sessionData.id}`}
                        >
                          View Session
                          <ArrowRight size={16} />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      if (session.hasClick) {
                        return (
                          <Badge size="lg" variant="success">
                            Clicked
                          </Badge>
                        );
                      }
                      if (session.hasView) {
                        return (
                          <Badge size="lg" variant="secondary">
                            Viewed
                          </Badge>
                        );
                      }
                      return (
                        <Badge size="lg" variant="outline">
                          -
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {session.hasClick ? (
                          <Badge size="lg" variant="success">
                            Yes
                          </Badge>
                        ) : (
                          <Badge size="lg" variant="outline">
                            No
                          </Badge>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        {(() => {
                          if (session.hasClick) {
                            return "Event clicked";
                          }
                          if (session.hasHover) {
                            return "Event hovered (not clicked)";
                          }
                          if (session.hasView) {
                            return "Event seen (not clicked)";
                          }
                          return "No interaction";
                        })()}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-2">
                      {sessionData?.country_code && (
                        <CircleFlag
                          className="size-4"
                          countryCode={
                            sessionData.country_code.toLowerCase() || "us"
                          }
                        />
                      )}
                      {sessionData?.city && sessionData?.country
                        ? `${sessionData.city}, ${sessionData.country}`
                        : sessionData?.country || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="flex items-center gap-2">
                      {browserIcon} {browser}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDistanceToNow(
                      new Date(session.lastEvent.timestamp),
                      {
                        addSuffix: true,
                      }
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
                    className={
                      data.pagination.hasPreviousPage
                        ? ""
                        : "pointer-events-none opacity-50"
                    }
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (data.pagination.hasPreviousPage) {
                        handlePageChange(paginationParams.page - 1);
                      }
                    }}
                  />
                </PaginationItem>

                {Array.from(
                  { length: data.pagination.totalPages },
                  (_, i) => i + 1
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
                            isActive={page === paginationParams.page}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext
                    className={
                      data.pagination.hasNextPage
                        ? ""
                        : "pointer-events-none opacity-50"
                    }
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (data.pagination.hasNextPage) {
                        handlePageChange(paginationParams.page + 1);
                      }
                    }}
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
