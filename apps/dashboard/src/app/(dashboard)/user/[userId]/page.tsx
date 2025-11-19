import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@bklit/ui/components/item";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/header/page-header";
import { authenticated } from "@/lib/auth";
import { api } from "@/trpc/server";

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

  const organizations = await api.organization.list();

  const organizationMemberships = organizations.map((org) => {
    const userMembership = org.members.find(
      (member) => member.userId === session.user.id,
    );
    return {
      organization: org,
      role: userMembership?.role || "member",
      createdAt: userMembership?.createdAt,
    };
  });

  return (
    <>
      <PageHeader
        title="My Workspaces"
        description="Manage your organizations and projects."
      >
        <Button asChild>
          <Link href="/organizations/create">
            <Plus className="mr-2 size-4" />
            Create Organization
          </Link>
        </Button>
      </PageHeader>

      <div className="container mx-auto flex gap-4">
        {organizationMemberships.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                You haven&apos;t joined any organizations yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizationMemberships.map((membership) => (
              <Card
                key={membership.organization.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {membership.organization.name}
                      <Badge variant="secondary">
                        {membership.organization.projects.length} projects
                      </Badge>
                    </CardTitle>
                    <Badge
                      variant={
                        membership.role === "owner" ? "default" : "secondary"
                      }
                    >
                      {membership.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 justify-end">
                    <Button asChild variant="outline">
                      <Link href={`/${membership.organization.id}`}>
                        View Organization
                      </Link>
                    </Button>
                    {membership.role === "owner" && (
                      <Button asChild variant="secondary">
                        <Link href={`/${membership.organization.id}/settings`}>
                          Settings
                        </Link>
                      </Button>
                    )}
                  </div>
                  {membership.organization.projects.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2">
                        {membership.organization.projects
                          .slice(0, 3)
                          .map((project) => (
                            <Item
                              key={project.id}
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <Link
                                href={`/${membership.organization.id}/${project.id}`}
                              >
                                <ItemContent>
                                  <ItemTitle>{project.name}</ItemTitle>
                                </ItemContent>
                                <ItemActions>
                                  <ChevronRight size={16} />
                                </ItemActions>
                              </Link>
                            </Item>
                          ))}
                        {membership.organization.projects.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{membership.organization.projects.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
