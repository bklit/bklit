import { PageHeader } from "@/components/header/page-header";
import { FunnelBuilder } from "@/components/reactflow/funnel-builder/funnel-builder";

interface PageProps {
  params: Promise<{
    organizationId: string;
    projectId: string;
  }>;
}

export default async function FunnelsBuilderPage({ params }: PageProps) {
  const { organizationId, projectId } = await params;

  return (
    <div className="w-full flex-1 flex flex-col gap-4 h-full">
      <PageHeader title="Funnels" description="Build your funnels with ease." />
      <FunnelBuilder organizationId={organizationId} projectId={projectId} />
    </div>
  );
}
