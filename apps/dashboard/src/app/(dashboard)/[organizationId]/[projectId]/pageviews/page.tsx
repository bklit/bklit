import type { Metadata } from "next";
import { Pageviews } from "@/components/pageviews";

export const metadata: Metadata = {
  title: "Pageviews",
};

interface PageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
  }>;
}

export default async function PageviewsPage({ params }: PageProps) {
  const { organizationId, projectId } = await params;

  return <Pageviews organizationId={organizationId} projectId={projectId} />;
}
