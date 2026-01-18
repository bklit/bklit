"use client";

import { LiveCardProvider } from "@bklit/ui/components/live/card";
import { useSidebar } from "@bklit/ui/components/sidebar";
import { useEffect } from "react";
import { LiveMap } from "@/components/maps/live-map";
import { LiveMapProvider } from "@/contexts/live-map-context";
import { MapEventsProvider } from "@/hooks/use-map-events";
import { Live } from "./index";

interface LiveWrapperProps {
  projectId: string;
  organizationId: string;
}

export function LiveWrapper({ projectId, organizationId }: LiveWrapperProps) {
  const { setOpen } = useSidebar();

  // Collapse sidebar on mount for better map view
  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    <MapEventsProvider>
      <LiveMapProvider>
        <LiveCardProvider>
          <LiveMap organizationId={organizationId} projectId={projectId} />
          <Live organizationId={organizationId} projectId={projectId} />
        </LiveCardProvider>
      </LiveMapProvider>
    </MapEventsProvider>
  );
}
