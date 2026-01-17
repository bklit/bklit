"use client";

import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleFlag } from "react-circle-flags";
import { useLiveEventStream } from "@/hooks/use-live-event-stream";
import { getMarkerGradient } from "@/lib/maps/marker-colors";
import { getBrowserIcon } from "@/lib/utils/get-browser-icon";
import { getDeviceIcon } from "@/lib/utils/get-device-icon";
import { useTRPC } from "@/trpc/react";

interface LiveSessionDetailProps {
  sessionId: string | null;
  projectId: string;
  organizationId: string;
}

interface PageviewUpdate {
  url: string;
  timestamp: string;
}

interface EventUpdate {
  trackingId: string;
  eventType: string;
  timestamp: string;
}

interface PageviewEventData {
  sessionId?: string;
  url: string;
  timestamp?: string;
}

interface TrackedEventData {
  sessionId?: string;
  trackingId: string;
  eventType: string;
  timestamp?: string;
}

export function LiveSessionDetail({
  sessionId,
  projectId,
  organizationId,
}: LiveSessionDetailProps) {
  const trpc = useTRPC();
  const [realtimePageviews, setRealtimePageviews] = useState<PageviewUpdate[]>(
    []
  );
  const [realtimeEvents, setRealtimeEvents] = useState<EventUpdate[]>([]);
  const [newPageAnimation, setNewPageAnimation] = useState(false);

  // Get consistent gradient colors for this session (matches map marker)
  const sessionGradient = useMemo(() => {
    return getMarkerGradient(sessionId || "default");
  }, [sessionId]);

  // Fetch session details
  const { data: session, isLoading } = useQuery({
    ...trpc.session.getById.queryOptions(
      { sessionId: sessionId || "", projectId, organizationId },
      {
        enabled: !!sessionId,
        refetchInterval: 30_000,
      }
    ),
  });

  // Real-time pageview handler
  const handlePageview = useCallback(
    (data: PageviewEventData) => {
      if (data.sessionId === sessionId) {
        setRealtimePageviews((prev) =>
          [
            {
              url: data.url,
              timestamp: data.timestamp || new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 10)
        );

        setNewPageAnimation(true);
        setTimeout(() => setNewPageAnimation(false), 1000);
      }
    },
    [sessionId]
  );

  // Real-time event handler
  const handleEvent = useCallback(
    (data: TrackedEventData) => {
      if (data.sessionId === sessionId) {
        setRealtimeEvents((prev) =>
          [
            {
              trackingId: data.trackingId,
              eventType: data.eventType,
              timestamp: data.timestamp || new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 10)
        );
      }
    },
    [sessionId]
  );

  // Subscribe to SSE events (NEW architecture)
  useLiveEventStream(projectId, {
    onPageview: handlePageview,
    onEvent: handleEvent,
  });

  // Reset real-time data when session changes
  const sessionIdForReset = sessionId;
  useEffect(() => {
    // Use sessionIdForReset to trigger reset when session changes
    if (sessionIdForReset !== undefined) {
      setRealtimePageviews([]);
      setRealtimeEvents([]);
    }
  }, [sessionIdForReset]);

  // Compute all pageviews
  const allPageviews = useMemo(() => {
    if (!session) {
      return realtimePageviews;
    }

    interface PageViewEvent {
      url: string;
      timestamp: string | Date;
    }

    const sessionPageviews = (session.pageViewEvents || []).map(
      (pv: PageViewEvent) => ({
        url: pv.url,
        timestamp:
          typeof pv.timestamp === "string"
            ? pv.timestamp
            : pv.timestamp.toISOString(),
      })
    );

    return [...realtimePageviews, ...sessionPageviews].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [session, realtimePageviews]);

  const currentPage = allPageviews[0]?.url || session?.entryPage || "";

  // Early returns after all hooks
  if (!sessionId) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <p className="text-center text-muted-foreground text-sm">
            Click a marker on the map to see visitor details
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardContent className="flex min-h-[300px] items-center justify-center">
          <p className="text-center text-muted-foreground text-sm">
            Session not found
          </p>
        </CardContent>
      </Card>
    );
  }

  const deviceIcon = getDeviceIcon(session.userAgent || "");
  const browserIcon = getBrowserIcon(session.userAgent || "");
  const countryCode = session.country?.toLowerCase() || "us";

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          {/* Profile avatar with session gradient (matches map marker) */}
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `linear-gradient(135deg, ${sessionGradient.from}, ${sessionGradient.to})`,
            }}
          >
            <CircleFlag className="size-5" countryCode={countryCode} />
          </div>
          <div>
            <CardTitle className="text-base">
              Visitor from {session.country || "Unknown"}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              {session.city && <span>{session.city}</span>}
              {session.city && <span>•</span>}
              <div className="flex items-center gap-1.5">
                {deviceIcon}
                {browserIcon}
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Page */}
        <div>
          <h3 className="mb-2 font-medium text-muted-foreground text-xs">
            Current Page
          </h3>
          <div className="rounded-lg bg-muted px-3 py-2">
            <p className="truncate font-mono text-sm">{currentPage}</p>
          </div>
        </div>

        {/* Page Journey */}
        {allPageviews.length > 0 && (
          <div>
            <h3 className="mb-2 font-medium text-muted-foreground text-xs">
              Page Journey
            </h3>
            <AnimatePresence mode="popLayout">
              <div className="space-y-1">
                {allPageviews.slice(0, 5).map((pv, index) => {
                  const isCurrent = index === 0;
                  const isNew = index === 0 && newPageAnimation;
                  return (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 transition-all ${
                        isCurrent ? "bg-primary/10" : "bg-muted/50"
                      } ${isNew ? "ring-2 ring-primary/50" : ""}`}
                      initial={isCurrent ? { opacity: 0, y: -10 } : false}
                      key={`${pv.url}-${pv.timestamp}`}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {isCurrent ? (
                          <div className="relative flex size-3 shrink-0">
                            <div
                              className="relative inline-flex size-3 rounded-full"
                              style={{
                                background: `linear-gradient(135deg, ${sessionGradient.from}, ${sessionGradient.to})`,
                              }}
                            />
                          </div>
                        ) : (
                          <div className="size-3 shrink-0 rounded-full bg-muted" />
                        )}
                        <span
                          className={`truncate font-mono text-xs ${isCurrent ? "font-semibold text-primary" : ""}`}
                        >
                          {pv.url}
                        </span>
                      </div>
                      <span className="shrink-0 text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(pv.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </div>
        )}

        {/* Events Triggered */}
        {realtimeEvents.length > 0 && (
          <div>
            <h3 className="mb-2 font-medium text-muted-foreground text-xs">
              Events Triggered
            </h3>
            <div className="space-y-1">
              {realtimeEvents.slice(0, 5).map((event, index) => (
                <div
                  className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
                  key={`${event.trackingId}-${event.timestamp}-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs" variant="secondary">
                      {event.eventType}
                    </Badge>
                    <span className="text-xs">{event.trackingId}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(event.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Info */}
        <div className="border-border border-t pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Session started</span>
            <span>
              {formatDistanceToNow(new Date(session.startedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
