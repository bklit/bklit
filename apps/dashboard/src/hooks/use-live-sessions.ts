"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTRPC } from "@/trpc/react";
import { findCountryCoordinates } from "@/lib/maps/country-coordinates";
import { getMarkerGradient } from "@/lib/maps/marker-colors";
import { useSocketIOEvents } from "./use-socketio-client";

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
}: UseLiveSessionsOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [sessions, setSessions] = useState<Map<string, LiveSession>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initial load from tRPC (only once)
  const { data: initialLocations, isLoading } = useQuery({
    ...trpc.session.liveUserLocations.queryOptions(
      { projectId, organizationId },
      {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
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
  const handlePageview = useCallback((data: PageviewEventData) => {
    if (!data.sessionId) return;

    const coordResult = getCoordinatesWithFallback(data);
    
    setSessions((prev) => {
      const newSessions = new Map(prev);
      const existing = newSessions.get(data.sessionId!);

      if (data.isNewSession || !existing) {
        // New session - add to map
        if (coordResult) {
          newSessions.set(data.sessionId!, {
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
                timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
                isCurrentPage: true,
              },
            ],
            events: [],
            startedAt: data.timestamp ? new Date(data.timestamp) : new Date(),
            userAgent: data.userAgent || null,
          });
        }
      } else {
        // Existing session - update page journey
        const updatedJourney = [
          {
            url: data.url,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
            isCurrentPage: true,
          },
          ...existing.pageJourney.map((p) => ({ ...p, isCurrentPage: false })),
        ].slice(0, 20); // Keep last 20 pages

        // Update coordinates if we got better ones
        let newCoords = existing.coordinates;
        let newHasExact = existing.hasExactCoordinates;
        if (coordResult && (!existing.hasExactCoordinates && coordResult.hasExactCoordinates)) {
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
      }

      return newSessions;
    });

    // Invalidate live queries for counts
    queryClient.invalidateQueries({
      queryKey: [["session", "liveUsers"]],
    });
  }, [queryClient]);

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

  // Handle session end events
  const handleSessionEnd = useCallback((data: SessionEndEventData) => {
    if (!data.sessionId) return;

    setSessions((prev) => {
      const newSessions = new Map(prev);
      newSessions.delete(data.sessionId);
      return newSessions;
    });

    queryClient.invalidateQueries({
      queryKey: [["session", "liveUsers"]],
    });
  }, [queryClient]);

  // Subscribe to websocket events
  const { isConnected } = useSocketIOEvents(projectId, "pageview", handlePageview);
  useSocketIOEvents(projectId, "event", handleTrackedEvent);
  useSocketIOEvents(projectId, "session_end", handleSessionEnd);

  // Separate sessions by coordinate type
  const { individualSessions, countryGroups, totalCount } = useMemo(() => {
    const individual: LiveSession[] = [];
    const byCountry = new Map<string, LiveSession[]>();

    for (const session of sessions.values()) {
      if (session.hasExactCoordinates) {
        individual.push(session);
      } else if (session.countryCode) {
        const existing = byCountry.get(session.countryCode) || [];
        byCountry.set(session.countryCode, [...existing, session]);
      }
    }

    // Convert country map to CountryGroup array
    const groups: CountryGroup[] = [];
    for (const [countryCode, countrySessions] of byCountry) {
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

    return {
      individualSessions: individual,
      countryGroups: groups,
      totalCount: sessions.size,
    };
  }, [sessions]);

  // Get a specific session by ID
  const getSession = useCallback(
    (sessionId: string): LiveSession | undefined => {
      return sessions.get(sessionId);
    },
    [sessions]
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

