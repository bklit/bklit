"use client";

import { LiveMapProvider } from "@/contexts/live-map-context";
import { Live } from "./index";
import { LiveMap } from "@/components/maps/live-map";

interface LiveWrapperProps {
  projectId: string;
  organizationId: string;
}

export function LiveWrapper({ projectId, organizationId }: LiveWrapperProps) {
  return (
    <LiveMapProvider>
      <LiveMap projectId={projectId} organizationId={organizationId} />
      <Live projectId={projectId} organizationId={organizationId} />
    </LiveMapProvider>
  );
}

