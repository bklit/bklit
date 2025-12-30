import { ProjectExtensionsList } from "@/components/extensions/project-extensions-list";
import { PageHeader } from "@/components/header/page-header";
import { SubNavigation } from "@/components/navigation/sub-navigation";
import { authenticated } from "@/lib/auth";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function ProjectExtensionsPage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  await authenticated();
  const { organizationId, projectId } = await params;

  prefetch(trpc.extension.listForProject.queryOptions({ projectId }));
  prefetch(trpc.event.list.queryOptions({ projectId, organizationId }));

  return (
    <>
      <PageHeader
        title="Extensions"
        description="Configure extensions for this project."
      >
        <SubNavigation
          configKey="projectSettings"
          organizationId={organizationId}
          projectId={projectId}
        />
      </PageHeader>
      <HydrateClient>
        <ProjectExtensionsList
          organizationId={organizationId}
          projectId={projectId}
        />
      </HydrateClient>
    </>
  );
}
