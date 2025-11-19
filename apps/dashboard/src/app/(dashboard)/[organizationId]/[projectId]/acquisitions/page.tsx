import { Acquisitions } from "@/components/acquisitions";

interface AcquisitionsPageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
  }>;
}

export default async function AcquisitionsPage({ params }: AcquisitionsPageProps) {
  const { organizationId, projectId } = await params;
  
  return (
    <Acquisitions
      organizationId={organizationId}
      projectId={projectId}
    />
  );
}
