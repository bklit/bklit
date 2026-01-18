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

  // FIX Problem 2: Reset state when going back from user view
  // This allows clicking the same marker again after going back
  useEffect(() => {
    const wasUserView = prevViewRef.current === "user";
    const isNoLongerUserView = view !== "user";

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "live/index.tsx:VIEW_CHANGE",
        message: "View changed effect",
        data: {
          prevView: prevViewRef.current,
          currentView: view,
          wasUserView,
          isNoLongerUserView,
          hasOpenedSession,
          selectedSessionId,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H2_FIX",
      }),
    }).catch(() => {});
    // #endregion

    if (wasUserView && isNoLongerUserView) {
      // User went back from user detail view - reset everything
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "live/index.tsx:VIEW_CHANGE:RESET",
            message: "Resetting session state after going back",
            data: {
              prevHasOpenedSession: hasOpenedSession,
              prevSelectedSessionId: selectedSessionId,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H2_FIX",
          }),
        }
      ).catch(() => {});
      // #endregion

      setHasOpenedSession(null);
      setSelectedSessionId(null);
    }

    prevViewRef.current = view;
  }, [view, hasOpenedSession, selectedSessionId, setSelectedSessionId]);

  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "live/index.tsx:RENDER",
      message: "Live component render",
      data: { selectedSessionId, hasOpenedSession, projectId },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "E",
    }),
  }).catch(() => {});
  // #endregion

  // Fetch session details when a marker is clicked
  // Only enabled when we have a session AND it hasn't been opened yet (one-time fetch)
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
        staleTime: 30_000, // Cache for 30 seconds
        refetchOnWindowFocus: false,
      }
    ),
  });

  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "live/index.tsx:QUERY_STATE",
      message: "Session query state",
      data: {
        queryEnabled,
        selectedSessionId,
        hasOpenedSession,
        isLoadingSession,
        hasSessionData: !!sessionData,
        hasError: !!sessionError,
        errorMsg: sessionError?.message,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "F",
    }),
  }).catch(() => {});
  // #endregion

  // Real-time updates come through SSE - only invalidate when needed
  const handlePageviewForSession = useCallback(
    (data: { sessionId?: string }) => {
      // Only invalidate if this pageview is for the currently viewed session
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

  // Subscribe to SSE events for real-time page journey updates
  useLiveEventStream(projectId, {
    onPageview: handlePageviewForSession,
  });

  // Reset hasOpenedSession when a new session is selected (from map click)
  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "live/index.tsx:SESSION_CHANGE",
        message: "Session change effect",
        data: {
          selectedSessionId,
          hasOpenedSession,
          willReset:
            selectedSessionId && selectedSessionId !== hasOpenedSession,
          conditionCheck: `${selectedSessionId} !== ${hasOpenedSession}`,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H2B",
      }),
    }).catch(() => {});
    // #endregion

    if (selectedSessionId && selectedSessionId !== hasOpenedSession) {
      // New session selected - reset the "opened" flag to trigger fetch
      setHasOpenedSession(null);
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "live/index.tsx:SESSION_CHANGE:RESET",
            message: "hasOpenedSession reset to null",
            data: {
              selectedSessionId,
              previousHasOpenedSession: hasOpenedSession,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            hypothesisId: "H2B",
          }),
        }
      ).catch(() => {});
      // #endregion
    }
  }, [selectedSessionId, hasOpenedSession]);

  // When session data is loaded, show it in the card's user view (only once per session)
  useEffect(() => {
    const conditionMet = !!(
      sessionData &&
      selectedSessionId &&
      hasOpenedSession !== selectedSessionId
    );

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "live/index.tsx:OPEN_USER_EFFECT",
        message: "Open user detail effect",
        data: {
          hasSessionData: !!sessionData,
          selectedSessionId,
          hasOpenedSession,
          conditionMet,
          comparison: `${hasOpenedSession} !== ${selectedSessionId}`,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        hypothesisId: "H2B",
      }),
    }).catch(() => {});
    // #endregion

    if (conditionMet) {
      // Get the most recent pageview
      const latestPageview = sessionData.pageViewEvents?.[0];

      // Build page journey from pageViewEvents (most recent first)
      const pageJourney =
        sessionData.pageViewEvents?.map((event, index) => ({
          url: event.url,
          timestamp: new Date(event.timestamp),
          isCurrentPage: index === 0, // First item is current page
        })) || [];

      // Get gradient that matches the map marker for this session
      const sessionGradient = getMarkerGradient(selectedSessionId);

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
        gradient: sessionGradient, // Match marker gradient
      };

      openUserDetail(userData);
      setHasOpenedSession(selectedSessionId); // Mark this session as opened
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
