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

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 && hours === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(" ") || "0s";
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

  const { data: sessionsData, isLoading } = useQuery(
    trpc.session.getRecent.queryOptions({
      projectId,
      organizationId,
      page: queryParams.page,
      limit: queryParams.limit,
      startDate,
      endDate,
    }),
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
                  key={crypto.randomUUID()}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessionsData.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No sessions found
            </p>
          ) : (
            sessionsData.sessions.map((session: Session) => (
              <Link
                key={session.id}
                href={`/${organizationId}/${projectId}/sessions/${session.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium">
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
                    <div className="text-xs text-muted-foreground space-x-4">
                      <span>{session.pageViewEvents.length} pages</span>
                      <span>{getBrowserFromUserAgent(session.userAgent)}</span>
                      <span>{getDeviceType(session.userAgent)}</span>
                      {session.country && <span>{session.country}</span>}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm font-medium">
                      {formatDuration(session.duration)}
                    </div>
                    <div className="text-xs text-muted-foreground">
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
          <div className="flex justify-between items-center w-full gap-4 mt-4">
            <div className="text-sm text-muted-foreground shrink-0">
              Showing{" "}
              {(sessionsData.pagination.page - 1) *
                sessionsData.pagination.limit +
                1}{" "}
              to{" "}
              {Math.min(
                sessionsData.pagination.page * sessionsData.pagination.limit,
                sessionsData.totalCount,
              )}{" "}
              of {sessionsData.totalCount} results
            </div>
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (sessionsData.pagination.hasPreviousPage) {
                        setQueryParams({
                          page: sessionsData.pagination.page - 1,
                        });
                      }
                    }}
                    className={
                      !sessionsData.pagination.hasPreviousPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {/* Generate page numbers with ellipsis */}
                {Array.from(
                  { length: sessionsData.pagination.totalPages },
                  (_, i) => i + 1,
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
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setQueryParams({ page });
                            }}
                            isActive={page === sessionsData.pagination.page}
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
                      if (sessionsData.pagination.hasNextPage) {
                        setQueryParams({
                          page: sessionsData.pagination.page + 1,
                        });
                      }
                    }}
                    className={
                      !sessionsData.pagination.hasNextPage
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
