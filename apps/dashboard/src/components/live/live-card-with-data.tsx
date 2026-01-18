"use client";

import { LiveCard, type LiveCardData } from "@bklit/ui/components/live/card";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useLiveEventStream } from "@/hooks/use-live-event-stream";
import { useLiveUsers } from "@/hooks/use-live-users";
import { useTRPC } from "@/trpc/react";

interface LiveCardWithDataProps {
  projectId: string;
  organizationId: string;
  className?: string;
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍";

  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127_397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

export function LiveCardWithData({
  projectId,
  organizationId,
  className,
}: LiveCardWithDataProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { liveUsers } = useLiveUsers({
    projectId,
    organizationId,
  });

  const { data: topCountries = [] } = useQuery({
    ...trpc.session.liveTopCountries.queryOptions(
      { projectId, organizationId },
      {
        refetchInterval: 10_000,
        staleTime: 0,
      }
    ),
  });

  const { data: topPages = [] } = useQuery({
    ...trpc.session.liveTopPages.queryOptions(
      { projectId, organizationId, limit: 10 },
      {
        refetchInterval: 10_000,
        staleTime: 0,
      }
    ),
  });

  const { data: topReferrers = [] } = useQuery({
    ...trpc.session.liveTopReferrers.queryOptions(
      { projectId, organizationId, limit: 5 },
      {
        refetchInterval: 10_000,
        staleTime: 0,
      }
    ),
  });

  const handlePageview = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [["session", "liveTopPages"]],
    });
    queryClient.invalidateQueries({
      queryKey: [["session", "liveTopCountries"]],
    });
    queryClient.invalidateQueries({
      queryKey: [["session", "liveTopReferrers"]],
    });
    queryClient.invalidateQueries({
      queryKey: [["session", "liveUserLocations"]],
    });
  }, [queryClient]);

  useLiveEventStream(projectId, {
    onPageview: handlePageview,
  });

  const cardData: LiveCardData = useMemo(() => {
    const pages = topPages.map((page) => ({
      path: page.path,
      count: page.count,
    }));

    const countries = topCountries.map((country) => ({
      name: country.country,
      code: country.countryCode,
      flag: getFlagEmoji(country.countryCode),
      count: country.views,
    }));

    const referrers = topReferrers.map((referrer) => ({
      name: referrer.name,
      count: referrer.count,
    }));

    return {
      pages,
      referrers,
      countries,
      liveUsers,
      users: [],
    };
  }, [topPages, topCountries, topReferrers, liveUsers]);

  return <LiveCard className={className} data={cardData} />;
}

export function LiveCardWithDataSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={className}>
      <Skeleton className="h-[300px] w-[420px] rounded-xl" />
    </div>
  );
}
