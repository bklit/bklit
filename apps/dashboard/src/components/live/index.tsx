"use client";

import { useLiveCard } from "@bklit/ui/components/live/card";
import type { UserData } from "@bklit/ui/components/live/card-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useLiveMap } from "@/contexts/live-map-context";
import { useSocketIOEvents } from "@/hooks/use-socketio-client";
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
  const { registerMarkerClickHandler } = useLiveMap();
  const { openUserDetail } = useLiveCard();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [hasOpenedSession, setHasOpenedSession] = useState<string | null>(null);

  // Fetch session details when a marker is clicked
  const { data: sessionData } = useQuery({
    ...trpc.session.getById.queryOptions(
      { sessionId: selectedSessionId || "", projectId, organizationId },
      {
        enabled: !!selectedSessionId,
        refetchInterval: 5000, // Refetch every 5 seconds to show live updates
        staleTime: 0, // No stale time for instant timeline updates
      }
    ),
  });

  // Real-time update for session details when pageview occurs
  const handlePageviewForSession = useCallback(
    (data: { sessionId?: string }) => {
      if (data.sessionId === selectedSessionId) {
        queryClient.invalidateQueries({
          queryKey: [["session", "getById"]],
        });
      }
    },
    [selectedSessionId, queryClient]
  );

  useSocketIOEvents(projectId, "pageview", handlePageviewForSession);

  // Register handler for map marker clicks
  useEffect(() => {
    registerMarkerClickHandler((sessionId: string) => {
      setSelectedSessionId(sessionId);
      setHasOpenedSession(null); // Reset when a new session is clicked
    });
  }, [registerMarkerClickHandler]);

  // When session data is loaded, show it in the card's user view (only once per session)
  useEffect(() => {
    if (
      sessionData &&
      selectedSessionId &&
      hasOpenedSession !== selectedSessionId
    ) {
      // Get the most recent pageview
      const latestPageview = sessionData.pageViewEvents?.[0];

      // Build page journey from pageViewEvents (most recent first)
      const pageJourney =
        sessionData.pageViewEvents?.map((event, index) => ({
          url: event.url,
          timestamp: new Date(event.timestamp),
          isCurrentPage: index === 0, // First item is current page
        })) || [];

      // Transform session data to UserData format
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
        referrer: "Direct", // Pageview data doesn't include referrer in this endpoint
        browser: getBrowserFromUserAgent(sessionData.userAgent || ""),
        device: getDeviceFromUserAgent(sessionData.userAgent || ""),
        os: getOSFromUserAgent(sessionData.userAgent || ""),
        pageJourney,
        triggeredEvents: [], // We can add event tracking later if needed
      };

      openUserDetail(userData);
      setHasOpenedSession(selectedSessionId); // Mark this session as opened
    }
  }, [sessionData, selectedSessionId, hasOpenedSession, openUserDetail]);

  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-50 flex -translate-x-1/2 justify-center p-6">
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

// Helper functions to parse user agent
function getBrowserFromUserAgent(userAgent: string): string {
  if (!userAgent) {
    return "Unknown";
  }
  if (userAgent.includes("Chrome") && !userAgent.includes("Edge")) {
    return "Chrome";
  }
  if (userAgent.includes("Firefox")) {
    return "Firefox";
  }
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return "Safari";
  }
  if (userAgent.includes("Edge")) {
    return "Edge";
  }
  return "Other";
}

function getDeviceFromUserAgent(userAgent: string): string {
  if (!userAgent) {
    return "Unknown";
  }
  const ua = userAgent.toLowerCase();
  if (
    ua.includes("ipad") ||
    (ua.includes("android") && !ua.includes("mobile"))
  ) {
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
  if (!userAgent) {
    return "Unknown";
  }
  if (userAgent.includes("Windows")) {
    return "Windows";
  }
  if (userAgent.includes("Mac OS")) {
    return "macOS";
  }
  if (userAgent.includes("Linux")) {
    return "Linux";
  }
  if (userAgent.includes("Android")) {
    return "Android";
  }
  if (
    userAgent.includes("iPhone") ||
    userAgent.includes("iPad") ||
    userAgent.includes("iOS")
  ) {
    return "iOS";
  }
  return "Other";
}
