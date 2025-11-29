"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/react";

interface UseLiveUsersProps {
  projectId: string;
  organizationId: string;
}

export function useLiveUsers({ projectId, organizationId }: UseLiveUsersProps) {
  const trpc = useTRPC();

  const enabled = !!projectId && !!organizationId;

  const {
    data: liveUsers,
    isLoading,
    error,
  } = useQuery({
    ...trpc.session.liveUsers.queryOptions(
      {
        projectId,
        organizationId,
      },
      {
        refetchInterval: 15000, // Poll every 15 seconds (less aggressive)
        staleTime: 10000, // Consider data stale after 10 seconds
        refetchOnWindowFocus: false, // Don't refetch when window gains focus
        refetchOnMount: true, // Refetch when component mounts
        retry: (failureCount, error) => {
          // Don't retry on abort errors (normal behavior)
          if (error instanceof Error && error.name === "AbortError") {
            return false;
          }
          return failureCount < 3;
        },
      },
    ),
    enabled,
  });

  return {
    liveUsers: liveUsers ?? 0,
    isLoading,
    error,
  };
}
