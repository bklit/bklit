"use client";

import { LiveCard, type LiveCardData } from "@bklit/ui/components/live/card";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useLiveUsers } from "@/hooks/use-live-users";
import { useSocketIOEvents } from "@/hooks/use-socketio-client";
import { useTRPC } from "@/trpc/react";

/**
 * LiveCardWithData - A wrapper component that fetches live analytics data
 * and passes it to the LiveCard component.
 *
 * Features:
 * - Real-time updates via Socket.IO for pageview events
 * - 30-second polling fallback for reliability
 * - Automatic data transformation to LiveCardData format
 * - Live user count, top pages, top countries, and top referrers
 *
 * @param projectId - The project to fetch analytics for
 * @param organizationId - The organization that owns the project
 * @param className - Optional className for styling
 */
interface LiveCardWithDataProps {
  projectId: string;
  organizationId: string;
  className?: string;
}

// Country code to emoji flag mapper
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

  // Get live users count with real-time updates
  const { liveUsers } = useLiveUsers({
    projectId,
    organizationId,
  });

  // Get top countries
  const { data: topCountries = [] } = useQuery({
    ...trpc.session.liveTopCountries.queryOptions(
      { projectId, organizationId },
      {
        refetchInterval: 10_000, // More frequent updates
        staleTime: 0, // No stale time for instant updates
      }
    ),
  });

  // Get top pages
  const { data: topPages = [] } = useQuery({
    ...trpc.session.liveTopPages.queryOptions(
      { projectId, organizationId, limit: 10 },
      {
        refetchInterval: 10_000,
        staleTime: 0,
      }
    ),
  });

  // Get top referrers
  const { data: topReferrers = [] } = useQuery({
    ...trpc.session.liveTopReferrers.queryOptions(
      { projectId, organizationId, limit: 5 },
      {
        refetchInterval: 10_000,
        staleTime: 0,
      }
    ),
  });

  // Real-time invalidation on pageview events - immediate, no delay
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

  useSocketIOEvents(projectId, "pageview", handlePageview);

  // Transform data to LiveCardData format
  const cardData: LiveCardData = useMemo(() => {
    // Transform pages
    const pages = topPages.map((page) => ({
      path: page.path,
      count: page.count,
    }));

    // Transform countries with emoji flags
    const countries = topCountries.map((country) => ({
      name: country.country,
      code: country.countryCode,
      flag: getFlagEmoji(country.countryCode),
      count: country.views,
    }));

    // Transform referrers
    const referrers = topReferrers.map((referrer) => ({
      name: referrer.name,
      count: referrer.count,
    }));

    return {
      pages,
      referrers,
      countries,
      liveUsers,
      users: [], // We'd need to implement a users endpoint for this
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
