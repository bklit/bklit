import { prisma } from "@bklit/db/client";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/header/page-header";
import { authenticated } from "@/lib/auth";

async function getUserOrganizations(userId: string) {
  return await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          projects: true,
          members: {
            include: {
              user: {
                select: { name: true, email: true, image: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getUserDirectSites(organizationId: string) {
  return await prisma.project.findMany({
    where: { organizationId: organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await authenticated();

  // Only allow users to view their own page
  if (session.user.id !== userId) {
    redirect("/");
  }

  const [organizationMemberships] = await Promise.all([
    getUserOrganizations(userId),
    getUserDirectSites(userId),
  ]);

  return (
    <div className="space-y-6 prose dark:prose-invert max-w-none">
      <PageHeader
        title="My Workspaces"
        description="Manage your organizations and projects."
      />

      {/* Organizations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="size-6" />
            Organizations
          </h2>
          <Button asChild>
            <Link href="/organizations/create">
              <Plus className="mr-2 size-4" />
              Create Organization
            </Link>
          </Button>
        </div>

        {organizationMemberships.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                You haven&apos;t joined any organizations yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizationMemberships.map((membership) => (
              <Card
                key={membership.organization.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {membership.organization.name}
                    </CardTitle>
                    <Badge
                      variant={
                        membership.role === "owner" ? "default" : "secondary"
                      }
                    >
                      {membership.role}
                    </Badge>
                  </div>
                  <CardDescription>
                    {membership.organization.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Projects: {membership.organization.projects.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Members: {membership.organization.members.length}
                    </p>
                  </div>

                  {membership.organization.projects.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recent Projects:</p>
                      <div className="space-y-1">
                        {membership.organization.sites
                          .slice(0, 3)
                          .map((site) => (
                            <Link
                              key={site.id}
                              href={`/${membership.organization.id}/${site.id}`}
                              className="block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {site.name}
                            </Link>
                          ))}
                        {membership.organization.projects.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{membership.organization.projects.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/${membership.organization.id}`}>
                        View Organization
                      </Link>
                    </Button>
                    {membership.role === "owner" && (
                      <Button asChild size="sm">
                        <Link href={`/${membership.organization.id}/settings`}>
                          Settings
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
