import type { Metadata } from "next";
import { Funnels } from "@/components/funnels";
import { prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Funnels",
};

interface PageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
  }>;
}

export default async function FunnelsPage({ params }: PageProps) {
  const { organizationId, projectId } = await params;

  prefetch(
    trpc.funnel.list.queryOptions({
      projectId,
      organizationId,
    })
  );

  return <Funnels organizationId={organizationId} projectId={projectId} />;
}
