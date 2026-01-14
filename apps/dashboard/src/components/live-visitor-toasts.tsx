"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { CircleFlag } from "react-circle-flags";
import { toast } from "sonner";
import { useSocketIOEvents } from "@/hooks/use-socketio-client";
import { getCountryCodeForFlag } from "@/lib/maps/country-coordinates";
import { isMobileDevice } from "@/lib/user-agent";
import { useTRPC } from "@/trpc/react";

interface LiveVisitorToastsProps {
  projectId: string;
  organizationId: string;
}

export function LiveVisitorToasts({
  projectId,
  organizationId,
}: LiveVisitorToastsProps) {
  const [seenSessionIds, setSeenSessionIds] = useState<Set<string>>(new Set());
  const lastToastTime = useRef<number>(0);
  const toastDebounceMs = 2000;

  if (!(projectId && organizationId)) {
    return null;
  }

  const trpc = useTRPC();

  const preferencesQuery = useQuery(
    trpc.notification.getPreferences.queryOptions(
      {
        projectId,
        organizationId,
      },
      {
        enabled: !!projectId && !!organizationId,
        retry: false,
      }
    )
  );

  const sessionsQuery = useQuery(
    trpc.session.recentSessions.queryOptions(
      {
        projectId,
        organizationId,
      },
      {
        enabled: !!projectId && !!organizationId,
        refetchInterval: 30_000, // 30s (was 15s) - real-time handles instant notifications
        staleTime: 20_000,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: (failureCount, error) => {
          if (error instanceof Error && error.name === "AbortError") {
            return false;
          }
          return failureCount < 3;
        },
      }
    )
  );

  const recentSessionsData = sessionsQuery.data || [];
  const sessionsErrorData = sessionsQuery.error;
  const preferences = preferencesQuery.data || { liveVisitorToasts: true };

  if (
    sessionsErrorData &&
    !(
      sessionsErrorData instanceof Error &&
      sessionsErrorData.name === "AbortError"
    )
  ) {
    console.error("Error fetching recent sessions:", sessionsErrorData);
  }

  // Real-time pageview handler (declare early) - only show toast for NEW sessions
  const handleRealtimePageview = useCallback(
    (data: any) => {
      if (!preferences?.liveVisitorToasts) return;

      // Only show toast for new sessions (first pageview)
      if (!data.isNewSession) return;

      const now = Date.now();
      if (now - lastToastTime.current < toastDebounceMs) return;

      // Track this session IMMEDIATELY so polling doesn't show duplicate
      if (data.sessionId) {
        setSeenSessionIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(data.sessionId);
          return newSet;
        });
      }

      lastToastTime.current = now;

      const location = data.country || "Unknown location";
      const city = data.city ? `, ${data.city}` : "";
      const countryCode = getCountryCodeForFlag(data.country || "");
      const isMobile = data.mobile;
      const deviceType = isMobile ? "mobile" : "desktop";

      toast(`New visitor from ${location}${city}`, {
        description: `Viewing on ${deviceType}`,
        icon: <CircleFlag className="size-4" countryCode={countryCode} />,
      });
    },
    [preferences?.liveVisitorToasts]
  );

  const { isConnected } = useSocketIOEvents(
    projectId,
    "pageview",
    handleRealtimePageview
  );

  useEffect(() => {
    // Keep polling toasts as fallback/verification even with real-time
    // They won't conflict because we track seen sessions
    if (!preferences?.liveVisitorToasts) {
      return;
    }

    if (!recentSessionsData || recentSessionsData.length === 0) {
      return;
    }

    const now = Date.now();

    for (const session of recentSessionsData as Array<{
      id: string;
      sessionId: string;
      startedAt: Date;
      country: string | null;
      city: string | null;
      userAgent: string | null;
      entryPage: string;
    }>) {
      if (seenSessionIds.has(session.sessionId)) {
        continue;
      }

      if (now - lastToastTime.current < toastDebounceMs) {
        continue;
      }

      setSeenSessionIds((prev) => new Set([...prev, session.sessionId]));
      lastToastTime.current = now;

      const isMobile = isMobileDevice(session.userAgent || "");
      const deviceType = isMobile ? "mobile" : "desktop";
      const location = session.country || "Unknown location";
      const city = session.city ? `, ${session.city}` : "";
      const countryCode = getCountryCodeForFlag(session.country || "");

      // Show as polling toast (fallback/missed by real-time)
      toast(`New visitor from ${location}${city}`, {
        description: `Viewing on ${deviceType}`,
        icon: <CircleFlag className="size-4" countryCode={countryCode} />,
      });
    }
  }, [recentSessionsData, preferences?.liveVisitorToasts, seenSessionIds]);

  useEffect(() => {
    const cleanup = setInterval(
      () => {
        setSeenSessionIds((prev) => {
          const filtered = new Set<string>();
          for (const sessionId of prev) {
            if (Math.random() > 0.1) {
              filtered.add(sessionId);
            }
          }
          return filtered;
        });
      },
      5 * 60 * 1000
    );

    return () => clearInterval(cleanup);
  }, []);

  return null;
}
