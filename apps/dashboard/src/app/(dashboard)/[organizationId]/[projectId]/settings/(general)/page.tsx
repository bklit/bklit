import { prisma } from "@bklit/db/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { CopyInput } from "@bklit/ui/components/input-copy";
import { MemberRole } from "@bklit/utils/roles";
import { redirect } from "next/navigation";
import { DeleteProjectForm } from "@/components/forms/delete-project-form";
import { DeploymentTrackingForm } from "@/components/forms/deployment-tracking-form";
import { PageHeader } from "@/components/header/page-header";
import { SubNavigation } from "@/components/navigation/sub-navigation";
import { FormPermissions } from "@/components/permissions/form-permissions";
import { authenticated } from "@/lib/auth";

async function getSiteData(
  projectId: string,
  organizationId: string,
  userId: string
) {
  const site = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
    },
    include: {
      organization: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!site?.organization || site.organization.members.length === 0) {
    return null;
  }

  return { site, userMembership: site.organization.members[0] };
}

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;
  const session = await authenticated();

  const siteData = await getSiteData(
    projectId,
    organizationId,
    session.user.id
  );

  if (!siteData) {
    redirect("/");
  }

  const { site } = siteData;
  return (
    <>
      <PageHeader
        description="Manage your projects settings."
        title="Project settings"
      >
        <SubNavigation
          configKey="projectSettings"
          organizationId={organizationId}
          projectId={projectId}
        />
      </PageHeader>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Project ID</CardTitle>
            <CardDescription>
              The project ID is used to identify your project in the Bklit API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CopyInput value={site.id} />
          </CardContent>
        </Card>

        <DeploymentTrackingForm projectId={projectId} />

        <FormPermissions asChild requiredRole={MemberRole.ADMIN}>
          <Card variant="destructive">
            <CardHeader>
              <CardTitle>Delete {site.name}</CardTitle>
              <CardDescription>
                Danger zone: Delete this project and all associated data.
              </CardDescription>
            </CardHeader>
            <CardFooter className="space-y-6">
              <DeleteProjectForm projectId={site.id} projectName={site.name} />
            </CardFooter>
          </Card>
        </FormPermissions>
      </div>
    </>
  );
}
