import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FunnelDetails } from "@/components/funnels/funnel-details";
import { prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Funnel Details",
};

interface PageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
    funnelId: string;
  }>;
}

export default async function FunnelDetailPage({ params }: PageProps) {
  const { organizationId, projectId, funnelId } = await params;

  try {
    await Promise.all([
      prefetch(
        trpc.funnel.getById.queryOptions({
          funnelId,
          projectId,
          organizationId,
        }),
      ),
      prefetch(
        trpc.funnel.getStats.queryOptions({
          funnelId,
          projectId,
          organizationId,
        }),
      ),
    ]);
  } catch {
    notFound();
  }

  return (
    <FunnelDetails
      organizationId={organizationId}
      projectId={projectId}
      funnelId={funnelId}
    />
  );
}
