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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@bklit/ui/components/item";
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
import { useQueries } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { parseAsInteger, parseAsIsoDateTime, useQueryStates } from "nuqs";
import React, { useMemo } from "react";
import { useTRPC } from "@/trpc/react";

interface Funnel {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  steps: Array<{
    id: string;
    stepOrder: number;
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface FunnelsListProps {
  organizationId: string;
  projectId: string;
  funnels: Funnel[];
  isLoading: boolean;
  totalCount?: number;
  pagination?: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function FunnelsList({
  organizationId,
  projectId,
  funnels,
  isLoading,
  totalCount,
  pagination,
  onPageChange,
}: FunnelsListProps) {
  const trpc = useTRPC();

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

  // Fetch stats for all funnels to get conversion rates and last session timestamps
  const funnelStatsQueries = useQueries({
    queries: funnels.map((funnel) =>
      trpc.funnel.getStats.queryOptions({
        funnelId: funnel.id,
        projectId,
        organizationId,
        startDate,
        endDate,
      }),
    ),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnels</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemGroup>
            {Array.from({ length: 5 }, (_, i) => (
              <Item key={i}>
                <ItemContent>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64 mt-2" />
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>
    );
  }

  if (funnels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No funnels found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnels</CardTitle>
      </CardHeader>
      <CardContent>
        <ItemGroup className="space-y-2">
          {funnels.map((funnel, index) => {
            const stats = funnelStatsQueries[index]?.data;
            const conversionRate = stats?.overallConversionRate ?? 0;
            const lastSessionTimestamp = stats?.lastSessionTimestamp;

            return (
              <Item key={funnel.id} asChild variant="outline">
                <Link
                  href={`/${organizationId}/${projectId}/funnels/${funnel.id}`}
                >
                  <ItemContent>
                    <ItemTitle>{funnel.name}</ItemTitle>
                    <ItemDescription>
                      <span>{funnel.steps.length} steps</span>
                      {lastSessionTimestamp && (
                        <>
                          {" "}
                          &bull;{" "}
                          <span>
                            Last used{" "}
                            {formatDistanceToNow(
                              new Date(lastSessionTimestamp),
                              {
                                addSuffix: true,
                              },
                            )}
                          </span>
                        </>
                      )}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="flex flex-col items-end gap-1">
                    <Badge
                      variant={conversionRate > 30 ? "success" : "destructive"}
                      size="lg"
                    >
                      {conversionRate > 0
                        ? conversionRate >= 99.995
                          ? "100%"
                          : `${conversionRate.toFixed(2)}%`
                        : "0%"}
                      {" conversion"}
                    </Badge>
                  </ItemActions>
                </Link>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
      {pagination && pagination.totalPages > 1 && (
        <CardFooter>
          <div className="flex justify-between items-center w-full gap-4">
            <div className="text-sm text-muted-foreground shrink-0">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(
                pagination.page * pagination.limit,
                totalCount ?? funnels.length,
              )}{" "}
              of {totalCount ?? funnels.length} results
            </div>
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.hasPreviousPage) {
                        onPageChange(pagination.page - 1);
                      }
                    }}
                    className={
                      !pagination.hasPreviousPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    const current = pagination.page;
                    const total = pagination.totalPages;
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
                              onPageChange(page);
                            }}
                            isActive={page === pagination.page}
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
                      if (pagination.hasNextPage) {
                        onPageChange(pagination.page + 1);
                      }
                    }}
                    className={
                      !pagination.hasNextPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
