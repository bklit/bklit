import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionDetails } from "@/components/sessions/session-details";
import { prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Session Details",
};

interface PageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
    id: string;
  }>;
}

export default async function SessionDetailsPage({ params }: PageProps) {
  const { organizationId, projectId, id } = await params;

  try {
    prefetch(
      trpc.session.getById.queryOptions({
        sessionId: id,
        projectId,
        organizationId,
      }),
    );
  } catch {
    notFound();
  }

  return (
    <SessionDetails
      organizationId={organizationId}
      projectId={projectId}
      sessionId={id}
    />
  );
}
