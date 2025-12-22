"use client";

import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
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
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { parseAsInteger, parseAsIsoDateTime, useQueryStates } from "nuqs";
import React, { useMemo } from "react";
import { useTRPC } from "@/trpc/react";
import type { Session } from "./index";

interface SessionsTableProps {
  organizationId: string;
  projectId: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0s";

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function getBrowserFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";

  return "Other";
}

function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Tablet")) return "Tablet";

  return "Desktop";
}

export function SessionsTable({
  organizationId,
  projectId,
}: SessionsTableProps) {
  const trpc = useTRPC();

  const [queryParams, setQueryParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(4),
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    { history: "push" }
  );

  const startDate = useMemo(() => {
    if (queryParams.startDate) return queryParams.startDate;
    if (!queryParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [queryParams.startDate, queryParams.endDate]);

  const endDate = queryParams.endDate ?? undefined;

  const { data: sessionsData, isLoading } = useQuery(
    trpc.session.getRecent.queryOptions({
      projectId,
      organizationId,
      page: queryParams.page,
      limit: queryParams.limit,
      startDate,
      endDate,
    })
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading || !sessionsData ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, () => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={crypto.randomUUID()}
                >
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessionsData.sessions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No sessions found
            </p>
          ) : (
            sessionsData.sessions.map((session: Session) => (
              <Link
                className="block"
                href={`/${organizationId}/${projectId}/sessions/${session.id}`}
                key={session.id}
              >
                <div className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-3">
                      <div className="font-medium text-sm">
                        {formatDistanceToNow(new Date(session.startedAt), {
                          addSuffix: true,
                        })}
                      </div>
                      <Badge
                        variant={session.didBounce ? "destructive" : "default"}
                      >
                        {session.didBounce ? "Bounced" : "Engaged"}
                      </Badge>
                    </div>
                    <div className="space-x-4 text-muted-foreground text-xs">
                      <span>{session.pageViewEvents.length} pages</span>
                      <span>{getBrowserFromUserAgent(session.userAgent)}</span>
                      <span>{getDeviceType(session.userAgent)}</span>
                      {session.country && <span>{session.country}</span>}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="font-medium text-sm">
                      {formatDuration(session.duration)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {format(new Date(session.startedAt), "MMM d, HH:mm")}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter>
        {/* Pagination Controls */}
        {sessionsData && sessionsData.pagination.totalPages > 1 && (
          <div className="mt-4 flex w-full items-center justify-between gap-4">
            <div className="shrink-0 text-muted-foreground text-sm">
              Showing{" "}
              {(sessionsData.pagination.page - 1) *
                sessionsData.pagination.limit +
                1}{" "}
              to{" "}
              {Math.min(
                sessionsData.pagination.page * sessionsData.pagination.limit,
                sessionsData.totalCount
              )}{" "}
              of {sessionsData.totalCount} results
            </div>
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className={
                      sessionsData.pagination.hasPreviousPage
                        ? "cursor-pointer"
                        : "pointer-events-none opacity-50"
                    }
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (sessionsData.pagination.hasPreviousPage) {
                        setQueryParams({
                          page: sessionsData.pagination.page - 1,
                        });
                      }
                    }}
                  />
                </PaginationItem>

                {/* Generate page numbers with ellipsis */}
                {Array.from(
                  { length: sessionsData.pagination.totalPages },
                  (_, i) => i + 1
                )
                  .filter((page) => {
                    const current = sessionsData.pagination.page;
                    const total = sessionsData.pagination.totalPages;
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
                            className="cursor-pointer"
                            href="#"
                            isActive={page === sessionsData.pagination.page}
                            onClick={(e) => {
                              e.preventDefault();
                              setQueryParams({ page });
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext
                    className={
                      sessionsData.pagination.hasNextPage
                        ? "cursor-pointer"
                        : "pointer-events-none opacity-50"
                    }
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (sessionsData.pagination.hasNextPage) {
                        setQueryParams({
                          page: sessionsData.pagination.page + 1,
                        });
                      }
                    }}
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
