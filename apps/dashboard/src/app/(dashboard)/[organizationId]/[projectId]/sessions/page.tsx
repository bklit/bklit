import type { Metadata } from "next";
import { Sessions } from "@/components/sessions";

export const metadata: Metadata = {
  title: "Sessions",
};

interface PageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
  }>;
}

export default async function SessionsPage({ params }: PageProps) {
  const { organizationId, projectId } = await params;

  return <Sessions organizationId={organizationId} projectId={projectId} />;
}
