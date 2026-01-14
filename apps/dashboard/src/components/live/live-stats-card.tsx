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
import { useLiveUsers } from "@/hooks/use-live-users";
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
        refetchInterval: 30_000, // 30s (was 15s) - real-time triggers invalidation
        staleTime: 20_000,
      }
    ),
  });

  const { data: topPages, isLoading: isLoadingPages } = useQuery({
    ...trpc.session.liveTopPages.queryOptions(
      { projectId, organizationId, limit: 5 },
      {
        refetchInterval: 30_000, // 30s (was 15s) - real-time triggers invalidation
        staleTime: 20_000,
      }
    ),
  });

  const {
    liveUsers,
    isLoading: isLoadingLiveUsers,
    isRealtime,
    realtimeAvailable,
  } = useLiveUsers({
    projectId,
    organizationId,
  });

  const isLoading = isLoadingCountries || isLoadingLiveUsers;

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Live Stats</CardTitle>
        <CardDescription>
          {liveUsers === 1 ? '1 visitor' : `${liveUsers} visitors`} active now
        </CardDescription>
        <CardAction className="flex items-center gap-2 font-semibold text-4xl">
          <NumberFlow value={liveUsers} />
          {realtimeAvailable && (
            <span
              className={`size-2 rounded-full ${isRealtime ? "bg-green-500" : "bg-yellow-500"}`}
              title={isRealtime ? "Real-time connected" : "Polling mode"}
            />
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map(() => (
              <Skeleton className="size-12 rounded-full" key={crypto.randomUUID()} />
            ))}
          </div>
        ) : !topCountries || topCountries.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground text-sm">
            No active visitors
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {topCountries.map((country) => (
              <button
                key={country.countryCode || country.country}
                onClick={() => {
                  centerOnCountry(
                    country.countryCode || null,
                    country.country || null
                  );
                }}
                className="group flex shrink-0 flex-col items-center gap-1 transition-transform hover:scale-110"
                type="button"
                title={country.country || 'Unknown'}
              >
                <div className="relative">
                  <CircleFlag
                    className="size-10"
                    countryCode={country.countryCode?.toLowerCase() || "us"}
                  />
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
                    {country.views}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs group-hover:text-foreground">
                  {country.country || 'Unknown'}
                </span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
