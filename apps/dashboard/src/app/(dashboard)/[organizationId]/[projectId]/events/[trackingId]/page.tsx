import type { Metadata } from "next";
import { EventDetail } from "@/components/events/event-detail";
import { prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Event Details",
};

interface PageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
    trackingId: string;
  }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { organizationId, projectId, trackingId } = await params;

  prefetch(
    trpc.event.getByTrackingId.queryOptions({
      trackingId,
      projectId,
      organizationId,
    }),
  );

  return (
    <EventDetail
      organizationId={organizationId}
      projectId={projectId}
      trackingId={trackingId}
    />
  );
}
