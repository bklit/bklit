"use client";

import { LiveMap } from "@/components/maps/live-map";
import { LiveMapProvider } from "@/contexts/live-map-context";
import { Live } from "./index";

interface LiveWrapperProps {
  projectId: string;
  organizationId: string;
}

export function LiveWrapper({ projectId, organizationId }: LiveWrapperProps) {
  return (
    <LiveMapProvider>
      <LiveMap organizationId={organizationId} projectId={projectId} />
      <Live organizationId={organizationId} projectId={projectId} />
    </LiveMapProvider>
  );
}
