import { prisma } from "@bklit/db/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { CodeBlock } from "@bklit/ui/components/code-block";
import { CopyInput } from "@bklit/ui/components/input-copy";
import { redirect } from "next/navigation";
import { DeleteProjectForm } from "@/components/forms/delete-project-form";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { authenticated } from "@/lib/auth";

async function getSiteData(
  projectId: string,
  organizationId: string,
  userId: string,
) {
  const site = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: organizationId,
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

  if (!site || !site.organization || site.organization.members.length === 0) {
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
    session.user.id,
  );

  if (!siteData) {
    redirect("/");
  }

  const { site, userMembership } = siteData;
  return (
    <SettingsLayout
      title="Project settings"
      description="Manage your projects settings."
      navigationType="projectSettings"
      organizationId={organizationId}
      projectId={projectId}
    >
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
        <Card>
          <CardHeader>
            <CardTitle>SDK integration</CardTitle>
            <CardDescription>
              Integrate the SDK into your website to start tracking your users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <CodeBlock language="bash">{`npm install @bklit/sdk
# or
pnpm add @bklit/sdk`}</CodeBlock>
            </div>
            <div className="space-y-2">
              <CodeBlock
                language="typescript"
                lineNumbers={true}
              >{`import { initBklit } from "@bklit/sdk";

initBklit({
  projectId: "${site.id}",
  apiHost: "https://your-api-host.com",
  debug: true,
});`}</CodeBlock>
            </div>
          </CardContent>
        </Card>
        <Card variant="destructive">
          <CardHeader>
            <CardTitle>Delete {site.name}</CardTitle>
            <CardDescription>
              Danger zone: Delete this project and all associated data.
            </CardDescription>
          </CardHeader>
          <CardFooter className="space-y-6">
            {userMembership?.role === "owner" && (
              <DeleteProjectForm projectId={site.id} projectName={site.name} />
            )}
          </CardFooter>
        </Card>
      </div>
    </SettingsLayout>
  );
}
