import { PageHeader } from "@/components/header/page-header";
import { SubNavigation } from "@/components/navigation/sub-navigation";
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
    <div className="flex h-full w-full flex-1 flex-col gap-4">
      <PageHeader description="Build your funnels with ease." title="Funnels">
        <SubNavigation
          configKey="funnelNavigation"
          organizationId={organizationId}
          projectId={projectId}
        />
      </PageHeader>
      <FunnelBuilder organizationId={organizationId} projectId={projectId} />
    </div>
  );
}
