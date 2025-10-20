import type { Metadata } from "next";
import { Events } from "@/components/events";
import { prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Events",
};

interface PageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
  }>;
}

export default async function EventsPage({ params }: PageProps) {
  const { organizationId, projectId } = await params;

  prefetch(
    trpc.event.list.queryOptions({
      projectId,
      organizationId,
    }),
  );

  return <Events organizationId={organizationId} projectId={projectId} />;
}
