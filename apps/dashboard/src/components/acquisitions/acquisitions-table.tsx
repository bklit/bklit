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
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import React, { useMemo } from "react";
import { useTRPC } from "@/trpc/react";

interface AcquisitionsTableProps {
  organizationId: string;
  projectId: string;
}

const sourceTypeColors = {
  Direct: "bg-gray-100 text-gray-800",
  Organic: "bg-green-100 text-green-800",
  Social: "bg-blue-100 text-blue-800",
  Paid: "bg-purple-100 text-purple-800",
  UTM: "bg-orange-100 text-orange-800",
  Referral: "bg-yellow-100 text-yellow-800",
} as const;

export function AcquisitionsTable({
  organizationId,
  projectId,
}: AcquisitionsTableProps) {
  const trpc = useTRPC();

  const [queryParams, setQueryParams] = useQueryStates(
    {
      page: {
        defaultValue: 1,
        parse: (value) => parseInt(value) || 1,
        serialize: (value) => value.toString(),
      },
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    {
      history: "push",
    },
  );

  const startDate = useMemo(() => {
    if (queryParams.startDate) return queryParams.startDate;
    if (!queryParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [queryParams.startDate, queryParams.endDate]);

  const endDate = queryParams.endDate ?? undefined;

  const {
    data: acquisitionsData,
    isLoading,
    error,
  } = useQuery(
    trpc.acquisition.getAcquisitions.queryOptions({
      projectId,
      organizationId,
      page: queryParams.page,
      limit: 20,
      startDate,
      endDate,
    }),
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }, () => (
              <Skeleton key={crypto.randomUUID()} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Error loading acquisition data: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!acquisitionsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No acquisition data found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        {acquisitionsData.acquisitions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No acquisition data found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Avg/User</TableHead>
                <TableHead>Last Viewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acquisitionsData.acquisitions.map((acquisition) => (
                <TableRow key={acquisition.source}>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div>{acquisition.source}</div>
                      {acquisition.source.includes("(") && (
                        <div className="text-xs text-muted-foreground">
                          UTM Campaign
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        sourceTypeColors[
                          acquisition.sourceType as keyof typeof sourceTypeColors
                        ] || "bg-gray-100 text-gray-800"
                      }
                    >
                      {acquisition.sourceType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {acquisition.viewCount}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {acquisition.uniqueUserCount}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {acquisition.avgViewsPerUser}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div>
                        {formatDistanceToNow(new Date(acquisition.lastViewed), {
                          addSuffix: true,
                        })}
                      </div>
                      <div className="text-xs">
                        {format(
                          new Date(acquisition.lastViewed),
                          "MMM d, HH:mm",
                        )}
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
      {acquisitionsData && acquisitionsData.pagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (acquisitionsData.pagination.hasPreviousPage) {
                    setQueryParams({
                      page: acquisitionsData.pagination.page - 1,
                    });
                  }
                }}
                className={
                  !acquisitionsData.pagination.hasPreviousPage
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
              {Array.from(
                { length: acquisitionsData.pagination.totalPages },
                (_, i) => i + 1,
              )
                .filter((page) => {
                  const current = acquisitionsData.pagination.page;
                  const total = acquisitionsData.pagination.totalPages;
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
                          isActive={page === acquisitionsData.pagination.page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  );
                })}
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (acquisitionsData.pagination.hasNextPage) {
                    setQueryParams({
                      page: acquisitionsData.pagination.page + 1,
                    });
                  }
                }}
                className={
                  !acquisitionsData.pagination.hasNextPage
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </Card>
  );
}
