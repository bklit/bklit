"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
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
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import React, { useMemo } from "react";
import { getSourceFavicon } from "@/lib/utils/get-source-favicon";
import { useTRPC } from "@/trpc/react";

interface AcquisitionsTableProps {
  organizationId: string;
  projectId: string;
}

const sourceTypeVariants = {
  Direct: "secondary",
  Organic: "success",
  Social: "outline",
  Paid: "default",
  UTM: "default",
  Referral: "alternative",
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
        parse: (value) => parseInt(value, 10) || 1,
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

  const { data: projectData } = useQuery(
    trpc.project.fetch.queryOptions({
      id: projectId,
      organizationId,
    }),
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
          <CardDescription>
            A look at where your traffic is coming from.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
          <CardDescription>
            A look at where your traffic is coming from.
          </CardDescription>
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
          <CardDescription>
            A look at where your traffic is coming from.
          </CardDescription>
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
        <CardDescription>
          A look at where your traffic is coming from.
        </CardDescription>
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
              {acquisitionsData.acquisitions.map((acquisition) => {
                const sourceFavicon = getSourceFavicon(
                  acquisition.source,
                  projectData?.domain,
                );
                return (
                  <TableRow key={acquisition.source}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-4 bg-gray-200 ring-1 ring-gray-200">
                          <AvatarImage src={sourceFavicon} />
                        </Avatar>
                        {acquisition.source}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        size="lg"
                        variant={
                          sourceTypeVariants[
                            acquisition.sourceType as keyof typeof sourceTypeVariants
                          ] || "outline"
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
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <div>
                          {formatDistanceToNow(
                            new Date(acquisition.lastViewed),
                            {
                              addSuffix: true,
                            },
                          )}
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
                );
              })}
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
