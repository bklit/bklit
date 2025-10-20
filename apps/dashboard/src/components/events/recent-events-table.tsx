"use client";

import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
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
import { format, formatDistanceToNow } from "date-fns";
import { Info } from "lucide-react";
import { parseAsInteger, parseAsIsoDateTime, useQueryStates } from "nuqs";
import React, { useMemo } from "react";
import { getBrowserIcon } from "@/lib/utils/get-browser-icon";
import { useTRPC } from "@/trpc/react";

interface RecentEventsTableProps {
  organizationId: string;
  projectId: string;
  trackingId: string;
}

export function RecentEventsTable({
  organizationId,
  projectId,
  trackingId,
}: RecentEventsTableProps) {
  const trpc = useTRPC();

  const [queryParams, setQueryParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
      page: parseAsInteger.withDefault(1),
    },
    { history: "push" },
  );

  const startDate = useMemo(() => {
    if (queryParams.startDate) return queryParams.startDate;
    if (!queryParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [queryParams.startDate, queryParams.endDate]);

  const endDate = queryParams.endDate ?? undefined;

  const { data: event, isLoading } = useQuery(
    trpc.event.getByTrackingId.queryOptions({
      trackingId,
      projectId,
      organizationId,
      startDate,
      endDate,
      page: queryParams.page,
      limit: 4, // 4 results per page for testing
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>
          {isLoading || !event
            ? "Loading event triggers..."
            : `Showing ${event.recentEvents.length} of ${event.totalCount} event triggers (page ${event.pagination.page} of ${event.pagination.totalPages})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                        DOM-triggered events (data-attr, ID). User sees and
                        interacts with the element. Counts toward conversion.
                      </p>
                      <p className="font-semibold mb-1">Manual</p>
                      <p className="text-xs">
                        JavaScript-invoked events. May be programmatic, not
                        user-perceived. Doesn't count toward conversion.
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
            {isLoading ? (
              // Show skeleton rows while loading
              Array.from({ length: 4 }, (_, index) => (
                <TableRow key={`skeleton-${Date.now()}-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : !event || event.recentEvents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No events tracked yet
                </TableCell>
              </TableRow>
            ) : (
              event.recentEvents.map((trackedEvent) => {
                const metadata = trackedEvent.metadata as {
                  eventType?: string;
                  triggerMethod?: string;
                } | null;
                const triggerMethod = metadata?.triggerMethod || "automatic";

                const session = (
                  trackedEvent as typeof trackedEvent & {
                    session?: {
                      userAgent?: string | null;
                      country?: string | null;
                      city?: string | null;
                    } | null;
                  }
                ).session;

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
                      {formatDistanceToNow(new Date(trackedEvent.timestamp), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        {/* Pagination Controls */}
        {event && event.pagination.totalPages > 1 && (
          <div className="flex justify-between items-center w-full gap-4 mt-4">
            <div className="text-sm text-muted-foreground shrink-0">
              Showing {(event.pagination.page - 1) * 4 + 1} to{" "}
              {Math.min(event.pagination.page * 4, event.totalCount)} of{" "}
              {event.totalCount} results
            </div>
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (event.pagination.hasPreviousPage) {
                        setQueryParams({ page: event.pagination.page - 1 });
                      }
                    }}
                    className={
                      !event.pagination.hasPreviousPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {/* Generate page numbers with ellipsis */}
                {Array.from(
                  { length: event.pagination.totalPages },
                  (_, i) => i + 1,
                )
                  .filter((page) => {
                    const current = event.pagination.page;
                    const total = event.pagination.totalPages;
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === total ||
                      (page >= current - 1 && page <= current + 1)
                    );
                  })
                  .map((page, index, array) => {
                    const previousPage = array[index - 1];
                    const showEllipsisBefore =
                      index > 0 && previousPage && page - previousPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setQueryParams({ page });
                            }}
                            isActive={page === event.pagination.page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (event.pagination.hasNextPage) {
                        setQueryParams({ page: event.pagination.page + 1 });
                      }
                    }}
                    className={
                      !event.pagination.hasNextPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
