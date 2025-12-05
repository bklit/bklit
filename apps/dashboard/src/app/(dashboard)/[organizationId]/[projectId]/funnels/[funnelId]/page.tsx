import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    prefetch(
      trpc.funnel.getById.queryOptions({
        funnelId,
        projectId,
        organizationId,
      }),
    );
  } catch (error) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Funnel Details</h1>
        <p className="text-muted-foreground">
          Funnel detail page - to be implemented
        </p>
      </div>
    </div>
  );
}

