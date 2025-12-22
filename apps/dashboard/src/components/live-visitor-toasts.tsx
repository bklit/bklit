"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { CircleFlag } from "react-circle-flags";
import { toast } from "sonner";
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
        refetchInterval: 15_000,
        staleTime: 10_000,
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

  useEffect(() => {
    if (!preferences?.liveVisitorToasts) {
      return;
    }

    if (!recentSessionsData || recentSessionsData.length === 0) {
      return;
    }

    const now = Date.now();

    recentSessionsData.forEach(
      (session: {
        id: string;
        sessionId: string;
        startedAt: Date;
        country: string | null;
        city: string | null;
        userAgent: string | null;
        entryPage: string;
      }) => {
        if (seenSessionIds.has(session.sessionId)) {
          return;
        }

        if (now - lastToastTime.current < toastDebounceMs) {
          return;
        }

        setSeenSessionIds((prev) => new Set([...prev, session.sessionId]));
        lastToastTime.current = now;

        const isMobile = isMobileDevice(session.userAgent || "");
        const deviceType = isMobile ? "mobile" : "desktop";
        const location = session.country || "Unknown location";
        const city = session.city ? `, ${session.city}` : "";
        const countryCode = getCountryCodeForFlag(session.country || "");

        toast(`New live visitor from ${location}${city}.`, {
          description: `Viewing on ${deviceType}`,
          icon: <CircleFlag className="size-4" countryCode={countryCode} />,
        });
      }
    );
  }, [recentSessionsData, preferences?.liveVisitorToasts, seenSessionIds]);

  useEffect(() => {
    const cleanup = setInterval(
      () => {
        setSeenSessionIds((prev) => {
          const filtered = new Set<string>();
          prev.forEach((sessionId) => {
            if (Math.random() > 0.1) {
              filtered.add(sessionId);
            }
          });
          return filtered;
        });
      },
      5 * 60 * 1000
    );

    return () => clearInterval(cleanup);
  }, []);

  return null;
}
