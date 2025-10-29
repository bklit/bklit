import { Acquisitions } from "@/components/acquisitions";

interface AcquisitionsPageProps {
  params: {
    organizationId: string;
    projectId: string;
  };
}

export default function AcquisitionsPage({ params }: AcquisitionsPageProps) {
  return (
    <Acquisitions
      organizationId={params.organizationId}
      projectId={params.projectId}
    />
  );
}
