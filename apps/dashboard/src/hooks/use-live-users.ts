"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTRPC } from "@/trpc/react";
import { useLiveEventStream } from "./use-live-event-stream";

interface UseLiveUsersProps {
  projectId: string;
  organizationId: string;
}

export function useLiveUsers({ projectId, organizationId }: UseLiveUsersProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const enabled = !!projectId && !!organizationId;

  // Polling fallback - always active but less aggressive when real-time is connected
  const {
    data: liveUsers,
    isLoading,
    error,
  } = useQuery({
    ...trpc.session.liveUsers.queryOptions(
      { projectId, organizationId },
      {
        refetchInterval: 10_000, // 10s for more responsive updates
        staleTime: 0, // No stale time - always allow refetch
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: (failureCount, error) => {
          if (error instanceof Error && error.name === "AbortError") {
            return false;
          }
          return failureCount < 3;
        },
      }
    ),
    enabled,
  });

  // Real-time enhancement - invalidate cache when events occur
  const handleInvalidate = useCallback(() => {
    // Immediately invalidate to trigger refetch
    queryClient.invalidateQueries({
      queryKey: [["session", "liveUsers"]],
    });
  }, [queryClient]);

  const { isConnected } = useLiveEventStream(projectId, {
    onPageview: handleInvalidate,
    onSessionEnd: handleInvalidate,
  });

  return {
    liveUsers: liveUsers ?? 0,
    isLoading,
    error,
    isRealtime: isConnected,
  };
}
