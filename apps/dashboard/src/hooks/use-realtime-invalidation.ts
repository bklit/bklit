"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { useSocketIOEvents } from "./use-socketio-client";

export type InvalidationScope =
  | "live-users"
  | "live-locations"
  | "live-pages"
  | "live-countries"
  | "live-referrers"
  | "recent-sessions"
  | "recent-pageviews"
  | "all";

interface UseRealtimeInvalidationOptions {
  projectId: string;
  scopes: InvalidationScope[];
  debounceMs?: number;
}

const SCOPE_TO_QUERY_KEYS: Record<InvalidationScope, string[][]> = {
  "live-users": [["session", "liveUsers"]],
  "live-locations": [["session", "liveUserLocations"]],
  "live-pages": [["session", "liveTopPages"]],
  "live-countries": [["session", "liveTopCountries"]],
  "live-referrers": [["session", "liveTopReferrers"]],
  "recent-sessions": [
    ["session", "getRecent"],
    ["session", "recentSessions"],
  ],
  "recent-pageviews": [["top-pages"]],
  all: [],
};

export function useRealtimeInvalidation({
  projectId,
  scopes,
  debounceMs = 500,
}: UseRealtimeInvalidationOptions) {
  const queryClient = useQueryClient();
  const lastInvalidationRef = useRef<number>(0);
  const pendingInvalidationRef = useRef<NodeJS.Timeout | null>(null);

  const invalidateScopes = useCallback(() => {
    for (const scope of scopes) {
      if (scope === "all") {
        queryClient.invalidateQueries();
      } else {
        const queryKeys = SCOPE_TO_QUERY_KEYS[scope];
        for (const queryKey of queryKeys) {
          queryClient.invalidateQueries({ queryKey });
        }
      }
    }
  }, [queryClient, scopes]);

  const handleEvent = useCallback(() => {
    const now = Date.now();
    const timeSinceLastInvalidation = now - lastInvalidationRef.current;

    // Clear any pending invalidation
    if (pendingInvalidationRef.current) {
      clearTimeout(pendingInvalidationRef.current);
      pendingInvalidationRef.current = null;
    }

    if (timeSinceLastInvalidation >= debounceMs) {
      // Enough time has passed, invalidate immediately
      lastInvalidationRef.current = now;
      invalidateScopes();
    } else {
      // Schedule invalidation for later
      const delay = debounceMs - timeSinceLastInvalidation;
      pendingInvalidationRef.current = setTimeout(() => {
        lastInvalidationRef.current = Date.now();
        invalidateScopes();
        pendingInvalidationRef.current = null;
      }, delay);
    }
  }, [debounceMs, invalidateScopes]);

  // Subscribe to both pageview and event types
  const { isConnected: pageviewConnected } = useSocketIOEvents(
    projectId,
    "pageview",
    handleEvent
  );
  const { isConnected: eventConnected } = useSocketIOEvents(
    projectId,
    "event",
    handleEvent
  );

  return {
    isConnected: pageviewConnected || eventConnected,
    invalidateNow: invalidateScopes,
  };
}

