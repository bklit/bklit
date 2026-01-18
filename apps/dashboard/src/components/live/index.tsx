"use client";

import { useLiveCard } from "@bklit/ui/components/live/card";
import type { UserData } from "@bklit/ui/components/live/card-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLiveMap } from "@/contexts/live-map-context";
import { useLiveEventStream } from "@/hooks/use-live-event-stream";
import { getMarkerGradient } from "@/lib/maps/marker-colors";
import { useTRPC } from "@/trpc/react";
import {
  LiveCardWithData,
  LiveCardWithDataSkeleton,
} from "./live-card-with-data";

interface LiveProps {
  projectId: string;
  organizationId: string;
}

export const Live = ({ projectId, organizationId }: LiveProps) => {
  const { selectedSessionId, setSelectedSessionId } = useLiveMap();
  const { openUserDetail, view } = useLiveCard();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [hasOpenedSession, setHasOpenedSession] = useState<string | null>(null);
  const prevViewRef = useRef<string>(view);

  useEffect(() => {
    const wasUserView = prevViewRef.current === "user";
    const isNoLongerUserView = view !== "user";

    if (wasUserView && isNoLongerUserView) {
      setHasOpenedSession(null);
      setSelectedSessionId(null);
    }

    prevViewRef.current = view;
  }, [view, hasOpenedSession, selectedSessionId, setSelectedSessionId]);

  const queryEnabled =
    !!selectedSessionId && hasOpenedSession !== selectedSessionId;
  const {
    data: sessionData,
    isLoading: isLoadingSession,
    error: sessionError,
  } = useQuery({
    ...trpc.session.getById.queryOptions(
      { sessionId: selectedSessionId || "", projectId, organizationId },
      {
        enabled: queryEnabled,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      }
    ),
  });

  const handlePageviewForSession = useCallback(
    (data: { sessionId?: string }) => {
      if (
        data.sessionId &&
        data.sessionId === selectedSessionId &&
        hasOpenedSession === selectedSessionId
      ) {
        queryClient.invalidateQueries({
          queryKey: [["session", "getById"]],
        });
      }
    },
    [selectedSessionId, hasOpenedSession, queryClient]
  );

  useLiveEventStream(projectId, {
    onPageview: handlePageviewForSession,
  });

  useEffect(() => {
    const conditionMet = !!(
      sessionData &&
      selectedSessionId &&
      hasOpenedSession !== selectedSessionId
    );

    if (conditionMet) {
      const latestPageview = sessionData.pageViewEvents?.[0];

      const pageJourney =
        sessionData.pageViewEvents?.map((event, index) => ({
          url: event.url,
          timestamp: new Date(event.timestamp),
          isCurrentPage: index === 0,
        })) || [];

      const sessionGradient = getMarkerGradient(selectedSessionId);

      const userData: UserData = {
        id: sessionData.sessionId ?? sessionData.id ?? "unknown",
        name: `Visitor from ${sessionData.city || sessionData.country || "Unknown"}`,
        location:
          [sessionData.city, sessionData.country].filter(Boolean).join(", ") ||
          "Unknown",
        countryCode: sessionData.country?.substring(0, 2) || "XX",
        firstSeen: formatDistanceToNow(new Date(sessionData.startedAt), {
          addSuffix: true,
        }),
        sessions: 1,
        events: sessionData.pageViewEvents?.length || 0,
        currentPage: latestPageview?.url || sessionData.entryPage || "/",
        referrer: "Direct",
        browser: getBrowserFromUserAgent(sessionData.userAgent || ""),
        device: getDeviceFromUserAgent(sessionData.userAgent || ""),
        os: getOSFromUserAgent(sessionData.userAgent || ""),
        pageJourney,
        triggeredEvents: [],
        gradient: sessionGradient,
      };

      openUserDetail(userData);
      setHasOpenedSession(selectedSessionId);
    }
  }, [sessionData, selectedSessionId, hasOpenedSession, openUserDetail]);

  return (
    <div className="-translate-x-1/2 pointer-events-none absolute bottom-4 left-1/2 z-50 flex justify-center px-6">
      <div className="pointer-events-auto">
        <Suspense fallback={<LiveCardWithDataSkeleton />}>
          <LiveCardWithData
            organizationId={organizationId}
            projectId={projectId}
          />
        </Suspense>
      </div>
    </div>
  );
};

function getBrowserFromUserAgent(userAgent: string): string {
  if (!userAgent) return "Unknown";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edge")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Other";
}

function getDeviceFromUserAgent(userAgent: string): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent.toLowerCase();
  if (ua.includes("ipad") || (ua.includes("android") && !ua.includes("mobile"))) {
    return "Tablet";
  }
  if (
    ua.includes("iphone") ||
    ua.includes("ipod") ||
    (ua.includes("android") && ua.includes("mobile")) ||
    ua.includes("mobile")
  ) {
    return "Mobile";
  }
  return "Desktop";
}

function getOSFromUserAgent(userAgent: string): string {
  if (!userAgent) return "Unknown";
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac OS")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad") || userAgent.includes("iOS")) {
    return "iOS";
  }
  return "Other";
}
