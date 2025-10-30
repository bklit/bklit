import { prisma } from "@bklit/db/client";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { CodeBlock } from "@bklit/ui/components/code-block";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyInput } from "@/components/copy-input";
import { DeleteProjectForm } from "@/components/forms/delete-project-form";
import { PageHeader } from "@/components/header/page-header";
import { authenticated } from "@/lib/auth";
import { HydrateClient } from "@/trpc/server";

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

export async function ProjectSettingsNavigation({
  params,
}: {
  params: Promise<{ organizationId: string; projectId: string }>;
}) {
  const { organizationId, projectId } = await params;

  return (
    <nav className="flex flex-col gap-px">
      <Button variant="ghost" asChild className="justify-start">
        <Link href={`/${organizationId}/${projectId}/settings/`}>General</Link>
      </Button>
      <Button variant="ghost" asChild className="justify-start">
        <Link href={`/${organizationId}/${projectId}/settings/notifications`}>
          Notifications
        </Link>
      </Button>
    </nav>
  );
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
    <HydrateClient>
      <PageHeader
        title="Project settings"
        description="Manage your projects settings."
      />
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <div className="w-1/6">
          <ProjectSettingsNavigation params={params} />
        </div>
        <div className="w-5/6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project ID</CardTitle>
              <CardDescription>
                The project ID is used to identify your project in the Bklit
                API.
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
                Integrate the SDK into your website to start tracking your
                users.
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
                <DeleteProjectForm
                  projectId={site.id}
                  projectName={site.name}
                />
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </HydrateClient>
  );
}
