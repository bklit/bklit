"use client";

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
}

export function PageviewsTable({
  organizationId,
  projectId,
}: PageviewsTableProps) {
  const trpc = useTRPC();

  const [queryParams, setQueryParams] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(20),
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

  const { data: pageviewsData, isLoading } = useQuery(
    trpc.pageview.getPageviews.queryOptions({
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
        <CardTitle>Pageviews</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !pageviewsData ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, () => (
              <Skeleton key={crypto.randomUUID()} className="h-12 w-full" />
            ))}
          </div>
        ) : pageviewsData.pages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pageviews found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Title</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Last Viewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageviewsData.pages.map((page) => (
                <TableRow key={page.url}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {page.path}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {page.viewCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
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
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Pagination Controls */}
      {pageviewsData && pageviewsData.pagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pageviewsData.pagination.hasPreviousPage) {
                      setQueryParams({
                        page: pageviewsData.pagination.page - 1,
                      });
                    }
                  }}
                  className={
                    !pageviewsData.pagination.hasPreviousPage
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>

              {Array.from(
                { length: pageviewsData.pagination.totalPages },
                (_, i) => i + 1,
              )
                .filter((page) => {
                  const current = pageviewsData.pagination.page;
                  const total = pageviewsData.pagination.totalPages;
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
                          onClick={(e) => {
                            e.preventDefault();
                            setQueryParams({ page });
                          }}
                          isActive={page === pageviewsData.pagination.page}
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
                    if (pageviewsData.pagination.hasNextPage) {
                      setQueryParams({
                        page: pageviewsData.pagination.page + 1,
                      });
                    }
                  }}
                  className={
                    !pageviewsData.pagination.hasNextPage
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
}
