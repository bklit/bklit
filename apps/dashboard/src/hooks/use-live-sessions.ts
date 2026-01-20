"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findCountryCoordinates } from "@/lib/maps/country-coordinates";
import { getMarkerGradient } from "@/lib/maps/marker-colors";
import { useTRPC } from "@/trpc/react";
import { useLiveEventStream } from "./use-live-event-stream";
import { type MapEventType, useMapEvents } from "./use-map-events";

interface MapEventData {
  type: MapEventType;
  message: string;
  data?: Record<string, unknown>;
}

export interface PageJourneyEntry {
  url: string;
  timestamp: Date;
  isCurrentPage: boolean;
}

export interface TrackedEventEntry {
  trackingId: string;
  eventType: string;
  timestamp: Date;
}

export interface LiveSession {
  id: string;
  coordinates: [number, number]; // [lon, lat]
  hasExactCoordinates: boolean;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  gradient: { from: string; to: string };
  pageJourney: PageJourneyEntry[];
  events: TrackedEventEntry[];
  startedAt: Date;
  userAgent: string | null;
  isEnding?: boolean; // True when session is fading out
}

export interface CountryGroup {
  countryCode: string;
  countryName: string;
  coordinates: [number, number];
  sessions: LiveSession[];
}

interface PageviewEventData {
  url: string;
  sessionId?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  lat?: number;
  lon?: number;
  userAgent?: string;
  isNewSession?: boolean;
  timestamp?: string;
}

interface SessionEndEventData {
  sessionId: string;
  countryCode?: string;
}

interface TrackedEventData {
  sessionId?: string;
  trackingId: string;
  eventType: string;
  timestamp?: string;
}

interface UseLiveSessionsOptions {
  projectId: string;
  organizationId: string;
  expandedCountries?: Set<string>;
}

function isValidCoordinate(lat?: number | null, lon?: number | null): boolean {
  if (lat === undefined || lat === null || lon === undefined || lon === null) {
    return false;
  }
  if (lat === 0 && lon === 0) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function getCoordinatesWithFallback(
  data: PageviewEventData
): { coordinates: [number, number]; hasExactCoordinates: boolean } | null {
  // 1. Use exact coordinates if valid
  if (isValidCoordinate(data.lat, data.lon)) {
    return {
      coordinates: [data.lon!, data.lat!],
      hasExactCoordinates: true,
    };
  }

  // 2. Fallback to country center
  if (data.countryCode) {
    const center = findCountryCoordinates(data.countryCode);
    if (center) {
      return {
        coordinates: [center.longitude, center.latitude],
        hasExactCoordinates: false,
      };
    }
  }

  // 3. No coordinates available
  return null;
}

export function useLiveSessions({
  projectId,
  organizationId,
  expandedCountries,
}: UseLiveSessionsOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { logEvent } = useMapEvents();
  const [sessions, setSessions] = useState<Map<string, LiveSession>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for deferred logging to avoid state updates during render
  const pendingLogEvents = useRef<MapEventData[]>([]);
  const logEventTimeout = useRef<NodeJS.Timeout | null>(null);

  // Deferred logging to avoid state updates during render
  const scheduleLogEvent = useCallback(
    (type: MapEventType, message: string, data?: Record<string, unknown>) => {
      pendingLogEvents.current.push({ type, message, data });

      // Debounce logging to next tick
      if (logEventTimeout.current) {
        clearTimeout(logEventTimeout.current);
      }

      logEventTimeout.current = setTimeout(() => {
        const events = pendingLogEvents.current.splice(0);
        events.forEach((event) => {
          logEvent(event.type, event.message, event.data);
        });
      }, 0);
    },
    [logEvent]
  );

  // Process pending log events after render
  useEffect(() => {
    return () => {
      if (logEventTimeout.current) {
        clearTimeout(logEventTimeout.current);
      }
      // Process any remaining events on cleanup
      const events = pendingLogEvents.current.splice(0);
      events.forEach((event) => {
        logEvent(event.type, event.message, event.data);
      });
    };
  }, [logEvent]);

  // Initial load from tRPC - sync when user returns to window
  const { data: initialLocations, isLoading } = useQuery({
    ...trpc.session.liveUserLocations.queryOptions(
      { projectId, organizationId },
      {
        staleTime: 0, // Always consider stale for fresh data
        refetchOnWindowFocus: true, // Sync when user returns to tab
        refetchOnMount: false, // Only on mount, not every render
      }
    ),
  });

  // Initialize sessions from tRPC data
  useEffect(() => {
    if (initialLocations && !isInitialized) {
      const initialSessions = new Map<string, LiveSession>();

      for (const location of initialLocations) {
        const hasExact = isValidCoordinate(
          location.coordinates[1],
          location.coordinates[0]
        );

        initialSessions.set(location.id, {
          id: location.id,
          coordinates: location.coordinates as [number, number],
          hasExactCoordinates: hasExact,
          country: location.country,
          countryCode: location.countryCode,
          city: location.city,
          gradient: getMarkerGradient(location.id),
          pageJourney: [],
          events: [],
          startedAt: location.startedAt,
          userAgent: null,
        });
      }

      setSessions(initialSessions);
      setIsInitialized(true);
    }
  }, [initialLocations, isInitialized]);

  // Handle real-time pageview events
  const handlePageview = useCallback(
    (data: PageviewEventData) => {
      console.log("🔵 [handlePageview] Pageview received", {
        sessionId: data.sessionId,
        url: data.url,
        isNewSession: data.isNewSession,
      });

      if (!data.sessionId) {
        console.warn("⚠️ [handlePageview] No sessionId");
        return;
      }

      const coordResult = getCoordinatesWithFallback(data);

      setSessions((prev) => {
        const newSessions = new Map(prev);
        const existing = newSessions.get(data.sessionId!);

        console.log("🔍 [handlePageview] Check", {
          sessionId: data.sessionId,
          exists: !!existing,
          isNewSession: data.isNewSession,
          willAdd: data.isNewSession || !existing,
          totalSessions: prev.size,
        });

        if (data.isNewSession || !existing) {
          // New session - add to map
          if (coordResult) {
            const newSession = {
              id: data.sessionId!,
              coordinates: coordResult.coordinates,
              hasExactCoordinates: coordResult.hasExactCoordinates,
              country: data.country || null,
              countryCode: data.countryCode || null,
              city: data.city || null,
              gradient: getMarkerGradient(data.sessionId!),
              pageJourney: [
                {
                  url: data.url,
                  timestamp: data.timestamp
                    ? new Date(data.timestamp)
                    : new Date(),
                  isCurrentPage: true,
                },
              ],
              events: [],
              startedAt: data.timestamp ? new Date(data.timestamp) : new Date(),
              userAgent: data.userAgent || null,
            };
            newSessions.set(data.sessionId!, newSession);

            scheduleLogEvent(
              "session_added",
              `New session from ${data.city || data.country || "Unknown"}`,
              {
                sessionId: data.sessionId,
                country: data.country,
                countryCode: data.countryCode,
                city: data.city,
                hasExactCoordinates: coordResult.hasExactCoordinates,
                url: data.url,
              }
            );
          }
        } else {
          // Existing session - update page journey
          const updatedJourney = [
            {
              url: data.url,
              timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
              isCurrentPage: true,
            },
            ...existing.pageJourney.map((p) => ({
              ...p,
              isCurrentPage: false,
            })),
          ].slice(0, 20); // Keep last 20 pages

          // Update coordinates if we got better ones
          let newCoords = existing.coordinates;
          let newHasExact = existing.hasExactCoordinates;
          if (
            coordResult &&
            !existing.hasExactCoordinates &&
            coordResult.hasExactCoordinates
          ) {
            newCoords = coordResult.coordinates;
            newHasExact = true;
          }

          newSessions.set(data.sessionId!, {
            ...existing,
            coordinates: newCoords,
            hasExactCoordinates: newHasExact,
            pageJourney: updatedJourney,
            country: data.country || existing.country,
            countryCode: data.countryCode || existing.countryCode,
            city: data.city || existing.city,
          });

          scheduleLogEvent(
            "session_updated",
            `Session navigated to ${data.url}`,
            {
              sessionId: data.sessionId,
              newUrl: data.url,
              pageCount: updatedJourney.length,
            }
          );
        }

        return newSessions;
      });

      // Invalidate live queries for counts
      queryClient.invalidateQueries({
        queryKey: [["session", "liveUsers"]],
      });
    },
    [queryClient]
  );

  // Handle real-time tracked events
  const handleTrackedEvent = useCallback((data: TrackedEventData) => {
    if (!data.sessionId) return;

    setSessions((prev) => {
      const newSessions = new Map(prev);
      const existing = newSessions.get(data.sessionId!);

      if (existing) {
        const newEvent: TrackedEventEntry = {
          trackingId: data.trackingId,
          eventType: data.eventType,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        };

        newSessions.set(data.sessionId!, {
          ...existing,
          events: [newEvent, ...existing.events].slice(0, 20),
        });
      }

      return newSessions;
    });
  }, []);

  // Handle session end events - mark as ending first, then remove after animation
  const handleSessionEnd = useCallback(
    (data: SessionEndEventData) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("🔴 [handleSessionEnd] Called with data:", data);
      }
      scheduleLogEvent("session_ended", "Session end handler called", {
        sessionId: data.sessionId,
        hasSessionId: !!data.sessionId,
        reason: data.reason,
      });

      if (!data.sessionId) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("⚠️ [handleSessionEnd] No sessionId in data, skipping");
        }
        scheduleLogEvent("error", "Session end event missing sessionId", {
          data,
        });
        return;
      }

      setSessions((prev) => {
        const existing = prev.get(data.sessionId);

        if (process.env.NODE_ENV !== "production") {
          console.log(
            `🔍 [handleSessionEnd] Looking for session ${data.sessionId}:`,
            {
              found: !!existing,
              totalSessions: prev.size,
              allSessionIds: Array.from(prev.keys()),
            }
          );
        }

        if (!existing) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `⚠️ [handleSessionEnd] Session ${data.sessionId} not found in map`
            );
          }
          scheduleLogEvent("error", "Session not found in map", {
            sessionId: data.sessionId,
            availableSessions: Array.from(prev.keys()),
          });
          return prev;
        }

        // Log the session end event
        scheduleLogEvent(
          "session_ended",
          `Session ending from ${existing.city || existing.country || "Unknown"}`,
          {
            sessionId: data.sessionId,
            country: existing.country,
            countryCode: existing.countryCode,
            city: existing.city,
            duration: Date.now() - existing.startedAt.getTime(),
            reason: data.reason,
          }
        );

        // Mark as ending for fade-out animation
        const newSessions = new Map(prev);
        newSessions.set(data.sessionId, { ...existing, isEnding: true });
        if (process.env.NODE_ENV !== "production") {
          console.log(
            `✅ [handleSessionEnd] Marked session ${data.sessionId} as ending`
          );
        }
        return newSessions;
      });

      // After animation delay, actually remove the session
      setTimeout(() => {
        setSessions((prev) => {
          const newSessions = new Map(prev);
          const removed = newSessions.delete(data.sessionId);

          if (process.env.NODE_ENV !== "production") {
            console.log(
              `🗑️ [handleSessionEnd] Attempted to remove session ${data.sessionId}:`,
              removed
            );
          }

          if (removed) {
            scheduleLogEvent("session_removed", "Session removed from map", {
              sessionId: data.sessionId,
            });
          } else {
            scheduleLogEvent("error", "Failed to remove session from map", {
              sessionId: data.sessionId,
            });
          }

          return newSessions;
        });
      }, 800); // Match the icon-opacity-transition duration

      queryClient.invalidateQueries({
        queryKey: [["session", "liveUsers"]],
      });
    },
    [queryClient, scheduleLogEvent]
  );

  // Subscribe to SSE events (NEW architecture)
  const { isConnected } = useLiveEventStream(projectId, {
    onPageview: handlePageview,
    onEvent: handleTrackedEvent,
    onSessionEnd: handleSessionEnd,
  });

  // Filter out stale sessions (> 30 minutes old) - safety net for edge cases
  // This handles: dashboard left open for hours, brief WebSocket disconnection, etc.
  const activeSessions = useMemo(() => {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    const active = new Map<string, LiveSession>();

    for (const [id, session] of sessions.entries()) {
      // Keep sessions that started within last 30 minutes
      if (session.startedAt.getTime() >= thirtyMinutesAgo) {
        active.set(id, session);
      }
    }

    return active;
  }, [sessions]);

  // Separate sessions by coordinate type
  // Only group countries with 2+ sessions - single sessions show as individual markers
  // Expanded countries show all sessions as individual markers (after clicking a group)
  const { individualSessions, countryGroups, totalCount } = useMemo(() => {
    const individual: LiveSession[] = [];
    const byCountry = new Map<string, LiveSession[]>();

    for (const session of activeSessions.values()) {
      if (session.hasExactCoordinates) {
        individual.push(session);
      } else if (session.countryCode) {
        const existing = byCountry.get(session.countryCode) || [];
        byCountry.set(session.countryCode, [...existing, session]);
      }
    }

    // Convert country map to CountryGroup array
    // Only create groups for countries with 2+ sessions that aren't expanded
    const groups: CountryGroup[] = [];
    for (const [countryCode, countrySessions] of byCountry) {
      const isExpanded = expandedCountries?.has(countryCode);

      if (countrySessions.length === 1 || isExpanded) {
        // Single session OR expanded country - show as individual markers
        for (const session of countrySessions) {
          individual.push(session);
        }
      } else {
        // Multiple sessions (not expanded) - create country group with count
        const firstSession = countrySessions[0];
        if (firstSession) {
          groups.push({
            countryCode,
            countryName: firstSession.country || "Unknown",
            coordinates: firstSession.coordinates,
            sessions: countrySessions,
          });
        }
      }
    }

    return {
      individualSessions: individual,
      countryGroups: groups,
      totalCount: activeSessions.size,
    };
  }, [activeSessions, expandedCountries]);

  // Get a specific session by ID (only returns active sessions)
  const getSession = useCallback(
    (sessionId: string): LiveSession | undefined => {
      return activeSessions.get(sessionId);
    },
    [activeSessions]
  );

  return {
    sessions,
    individualSessions,
    countryGroups,
    totalCount,
    getSession,
    isLoading: isLoading && !isInitialized,
    isConnected,
  };
}
