"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { CircleFlag } from "react-circle-flags";
import { toast } from "sonner";
import { useLiveEventStream } from "@/hooks/use-live-event-stream";
import { getCountryCodeForFlag } from "@/lib/maps/country-coordinates";
import { useTRPC } from "@/trpc/react";

interface LiveVisitorToastsProps {
  projectId: string;
  organizationId: string;
}

interface PageviewEventData {
  sessionId?: string;
  country?: string;
  city?: string;
  mobile?: boolean;
  isNewSession?: boolean;
}

export function LiveVisitorToasts({
  projectId,
  organizationId,
}: LiveVisitorToastsProps) {
  const lastToastTime = useRef<number>(0);
  const seenSessionIds = useRef<Set<string>>(new Set());
  const toastDebounceMs = 2000;
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

  const preferences = preferencesQuery.data || { liveVisitorToasts: true };

  const handleRealtimePageview = useCallback(
    (data: PageviewEventData) => {
      if (!preferences?.liveVisitorToasts) return;
      if (!data.isNewSession) return;

      const now = Date.now();
      if (now - lastToastTime.current < toastDebounceMs) return;

      if (data.sessionId) {
        if (seenSessionIds.current.has(data.sessionId)) return;
        seenSessionIds.current.add(data.sessionId);
      }

      lastToastTime.current = now;

      const location = data.country || "Unknown location";
      const city = data.city ? `, ${data.city}` : "";
      const countryCode = getCountryCodeForFlag(data.country || "");
      const deviceType = data.mobile ? "mobile" : "desktop";

      toast(`New visitor from ${location}${city}`, {
        description: `Viewing on ${deviceType}`,
        icon: <CircleFlag className="size-4" countryCode={countryCode} />,
      });
    },
    [preferences?.liveVisitorToasts]
  );

  useLiveEventStream(projectId, {
    onPageview: handleRealtimePageview,
  });

  if (!(projectId && organizationId)) {
    return null;
  }

  return null;
}
