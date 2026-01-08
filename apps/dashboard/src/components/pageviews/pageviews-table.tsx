"use client";

import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
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
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { parseAsInteger, parseAsIsoDateTime, useQueryStates } from "nuqs";
import React, { useMemo } from "react";
import { useTRPC } from "@/trpc/react";

interface PageviewsTableProps {
  organizationId: string;
  projectId: string;
  viewMode: "all" | "entry-points";
}

export function PageviewsTable({
  organizationId,
  projectId,
  viewMode,
}: PageviewsTableProps) {
  const trpc = useTRPC();

  const [queryParams, setQueryParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(20),
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    { history: "push" }
  );

  const startDate = useMemo(() => {
    if (queryParams.startDate) {
      return queryParams.startDate;
    }
    if (!queryParams.endDate) {
      return undefined;
    }
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [queryParams.startDate, queryParams.endDate]);

  const endDate = queryParams.endDate ?? undefined;

  // Get pageviews data for "all" mode
  const { data: pageviewsData, isLoading: pageviewsLoading } = useQuery({
    ...trpc.pageview.getPageviews.queryOptions({
      projectId,
      organizationId,
      page: queryParams.page,
      limit: queryParams.limit,
      startDate,
      endDate,
    }),
    enabled: viewMode === "all",
  });

  // Get entry points data for "entry-points" mode
  const { data: entryPointsData, isLoading: entryPointsLoading } = useQuery({
    ...trpc.pageview.getEntryPoints.queryOptions({
      projectId,
      organizationId,
      page: queryParams.page,
      limit: queryParams.limit,
      startDate,
      endDate,
    }),
    enabled: viewMode === "entry-points",
  });

  const isLoading = pageviewsLoading || entryPointsLoading;
  const data = viewMode === "all" ? pageviewsData : entryPointsData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {viewMode === "entry-points" ? "Entry Points" : "Pageviews"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, () => (
              <Skeleton className="h-12 w-full" key={crypto.randomUUID()} />
            ))}
          </div>
        ) : (
            viewMode === "all"
              ? (data as any).pages?.length === 0
              : (data as any).entryPages?.length === 0
          ) ? (
          <div className="py-8 text-center text-muted-foreground">
            {viewMode === "entry-points"
              ? "No entry points found"
              : "No pageviews found"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Title</TableHead>
                <TableHead>Path</TableHead>
                {viewMode === "entry-points" ? (
                  <>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Total Views</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Desktop</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Views</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Avg/User</TableHead>
                  </>
                )}
                <TableHead>Last Viewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewMode === "all"
                ? (data as any).pages?.map((page: any) => (
                    <TableRow key={page.url}>
                      <TableCell className="font-medium">
                        {page.title}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground text-sm">
                        <Badge size="lg" variant="code">
                          {page.path}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {page.viewCount}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {page.uniqueUserCount}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {page.avgViewsPerUser}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div className="space-y-1">
                          <div>
                            {formatDistanceToNow(new Date(page.lastViewed), {
                              addSuffix: true,
                            })}
                          </div>
                          <div className="text-xs">
                            {format(new Date(page.lastViewed), "MMM d, HH:mm")}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : (data as any).entryPages?.map((page: any) => (
                    <TableRow key={page.url}>
                      <TableCell className="font-medium">
                        {page.title}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground text-sm">
                        <code className="rounded-md border border-border/10 bg-background px-2 py-1">
                          {page.path}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {page.sessions}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {page.totalPageviews}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {page.mobileSessions}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {page.desktopSessions}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div className="space-y-1">
                          <div>
                            {formatDistanceToNow(new Date(page.lastVisited), {
                              addSuffix: true,
                            })}
                          </div>
                          <div className="text-xs">
                            {format(new Date(page.lastVisited), "MMM d, HH:mm")}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Pagination Controls */}
      {data && data.pagination.totalPages > 1 && (
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
                      setQueryParams({
                        page: data.pagination.page - 1,
                      });
                    }
                  }}
                />
              </PaginationItem>

              {Array.from(
                { length: data.pagination.totalPages },
                (_, i) => i + 1
              )
                .filter((page) => {
                  const current = data.pagination.page;
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
                    <React.Fragment key={page}>
                      {showEllipsis && (
                        <PaginationItem>
                          <span className="px-4 py-2">...</span>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={page === data.pagination.page}
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
                    data.pagination.hasNextPage
                      ? ""
                      : "pointer-events-none opacity-50"
                  }
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (data.pagination.hasNextPage) {
                      setQueryParams({
                        page: data.pagination.page + 1,
                      });
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
}
