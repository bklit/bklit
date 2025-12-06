"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { ProgressRow } from "@bklit/ui/components/progress-row";
import { Skeleton } from "@bklit/ui/components/skeleton";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { CircleFlag } from "react-circle-flags";
import { useLiveMap } from "@/contexts/live-map-context";
import { useTRPC } from "@/trpc/react";

interface LiveStatsCardProps {
  projectId: string;
  organizationId: string;
}

export function LiveStatsCard({
  projectId,
  organizationId,
}: LiveStatsCardProps) {
  const trpc = useTRPC();
  const { centerOnCountry } = useLiveMap();

  const { data: topCountries, isLoading: isLoadingCountries } = useQuery({
    ...trpc.session.liveTopCountries.queryOptions(
      { projectId, organizationId },
      {
        refetchInterval: 15000,
        staleTime: 10000,
      },
    ),
  });

  const { data: topPages, isLoading: isLoadingPages } = useQuery({
    ...trpc.session.liveTopPages.queryOptions(
      { projectId, organizationId, limit: 5 },
      {
        refetchInterval: 15000,
        staleTime: 10000,
      },
    ),
  });

  const { data: liveUsers = 0, isLoading: isLoadingLiveUsers } = useQuery({
    ...trpc.session.liveUsers.queryOptions(
      { projectId, organizationId },
      {
        refetchInterval: 15000,
        staleTime: 10000,
      },
    ),
  });

  const isLoading = isLoadingCountries || isLoadingPages || isLoadingLiveUsers;
  const totalCountryViews =
    topCountries?.reduce((sum, c) => sum + (Number(c.views) || 0), 0) || 0;
  const totalPageViews =
    topPages?.reduce((sum, page) => sum + page.count, 0) || 0;

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Live Stats</CardTitle>
        <CardDescription>
          Top countries and pages by live users.
        </CardDescription>
        <CardAction className="text-2xl font-semibold">
          <NumberFlow value={liveUsers} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium mb-1">Countries</h3>
              {!topCountries || topCountries.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">
                  No live users
                </div>
              ) : (
                topCountries.map((country) => {
                  const percentage =
                    totalCountryViews > 0
                      ? ((Number(country.views) || 0) / totalCountryViews) * 100
                      : 0;
                  return (
                    <button
                      key={country.countryCode || country.country}
                      type="button"
                      onClick={() => {
                        centerOnCountry(
                          country.countryCode || null,
                          country.country || null,
                        );
                      }}
                    >
                      <ProgressRow
                        label={country.country || "Unknown"}
                        value={country.views}
                        percentage={percentage}
                        icon={
                          <CircleFlag
                            countryCode={
                              country.countryCode?.toLowerCase() || "us"
                            }
                            className="size-4"
                          />
                        }
                      />
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium mb-1">Pages</h3>
              {!topPages || topPages.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">
                  No live users
                </div>
              ) : (
                topPages.map((page) => (
                  <ProgressRow
                    key={page.path}
                    variant="secondary"
                    label={page.path}
                    value={page.count}
                    percentage={(page.count / totalPageViews) * 100}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
