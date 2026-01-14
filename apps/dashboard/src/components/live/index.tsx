"use client";

import { useState, useEffect } from "react";
import { LiveStatsCard } from "./live-stats-card";
import { LiveSessionDetail } from "./live-session-detail";
import { useLiveMap } from "@/contexts/live-map-context";

interface LiveProps {
  projectId: string;
  organizationId: string;
}

export const Live = ({ projectId, organizationId }: LiveProps) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { registerMarkerClickHandler } = useLiveMap();

  // Register handler for map marker clicks
  useEffect(() => {
    registerMarkerClickHandler((sessionId: string) => {
      setSelectedSessionId(sessionId);
    });
  }, [registerMarkerClickHandler]);

  return (
    <div className="container mx-auto grid grid-cols-1 gap-4 md:grid-cols-2">
      <LiveStatsCard organizationId={organizationId} projectId={projectId} />
      <LiveSessionDetail 
        sessionId={selectedSessionId}
        projectId={projectId}
        organizationId={organizationId}
      />
    </div>
  );
};
