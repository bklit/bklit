"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTRPC } from "@/trpc/react";
import { useSocketIOEvents } from "./use-socketio-client";

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

  // Real-time enhancement - invalidate cache when pageview received
  const handlePageview = useCallback(() => {
    // Immediately invalidate to trigger refetch
    queryClient.invalidateQueries({
      queryKey: [["session", "liveUsers"]],
    });
  }, [queryClient]);

  const { isConnected, isAvailable } = useSocketIOEvents(
    projectId,
    "pageview",
    handlePageview
  );

  return {
    liveUsers: liveUsers ?? 0,
    isLoading,
    error,
    isRealtime: isConnected,
    realtimeAvailable: isAvailable,
  };
}
