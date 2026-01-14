"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Badge } from "@bklit/ui/components/badge";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { CircleFlag } from "react-circle-flags";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSocketIOEvents } from "@/hooks/use-socketio-client";
import { useTRPC } from "@/trpc/react";
import { getBrowserIcon } from "@/lib/utils/get-browser-icon";
import { getDeviceIcon } from "@/lib/utils/get-device-icon";

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

export function LiveSessionDetail({
  sessionId,
  projectId,
  organizationId,
}: LiveSessionDetailProps) {
  const trpc = useTRPC();
  const [realtimePageviews, setRealtimePageviews] = useState<PageviewUpdate[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<EventUpdate[]>([]);

  // Fetch session details
  const { data: session, isLoading } = useQuery({
    ...trpc.session.getById.queryOptions(
      { id: sessionId || '', organizationId },
      {
        enabled: !!sessionId,
        refetchInterval: 30_000,
      }
    ),
  });

  // Real-time pageview updates
  useSocketIOEvents(projectId, 'pageview', (data: any) => {
    if (data.sessionId === sessionId) {
      setRealtimePageviews((prev) => [
        { url: data.url, timestamp: data.timestamp || new Date().toISOString() },
        ...prev,
      ].slice(0, 10)); // Keep last 10
    }
  });

  // Real-time event updates
  useSocketIOEvents(projectId, 'event', (data: any) => {
    if (data.sessionId === sessionId) {
      setRealtimeEvents((prev) => [
        { 
          trackingId: data.trackingId, 
          eventType: data.eventType,
          timestamp: data.timestamp || new Date().toISOString() 
        },
        ...prev,
      ].slice(0, 10));
    }
  });

  // Reset real-time data when session changes
  useEffect(() => {
    setRealtimePageviews([]);
    setRealtimeEvents([]);
  }, [sessionId]);

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

  const DeviceIcon = getDeviceIcon(session.userAgent || '');
  const BrowserIcon = getBrowserIcon(session.userAgent || '');
  const countryCode = session.country?.toLowerCase() || 'us';
  const allPageviews = [
    ...realtimePageviews,
    ...(session.pageViewEvents || []).map((pv: any) => ({
      url: pv.url,
      timestamp: pv.timestamp,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const currentPage = allPageviews[0]?.url || session.entryPage;

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CircleFlag className="size-6" countryCode={countryCode} />
          <div>
            <CardTitle className="text-base">
              Visitor from {session.country || 'Unknown'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              {session.city && <span>{session.city}</span>}
              {session.city && <span>•</span>}
              <DeviceIcon className="size-3" />
              <BrowserIcon className="size-3" />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Page */}
        <div>
          <h3 className="mb-2 font-medium text-xs text-muted-foreground">
            Current Page
          </h3>
          <div className="rounded-lg bg-muted px-3 py-2">
            <p className="truncate font-mono text-sm">{currentPage}</p>
          </div>
        </div>

        {/* Page Journey */}
        {allPageviews.length > 0 && (
          <div>
            <h3 className="mb-2 font-medium text-xs text-muted-foreground">
              Page Journey
            </h3>
            <div className="space-y-1">
              {allPageviews.slice(0, 5).map((pv, index) => (
                <div
                  key={`${pv.url}-${pv.timestamp}`}
                  className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="shrink-0 font-mono text-muted-foreground text-xs">
                      {index + 1}.
                    </span>
                    <span className="truncate font-mono text-xs">
                      {pv.url}
                    </span>
                  </div>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(pv.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Triggered */}
        {realtimeEvents.length > 0 && (
          <div>
            <h3 className="mb-2 font-medium text-xs text-muted-foreground">
              Events Triggered
            </h3>
            <div className="space-y-1">
              {realtimeEvents.slice(0, 5).map((event, index) => (
                <div
                  key={`${event.trackingId}-${event.timestamp}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {event.eventType}
                    </Badge>
                    <span className="text-xs">{event.trackingId}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Info */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Session started</span>
            <span>{formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

