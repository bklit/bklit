"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bklit/ui/components/empty";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bklit/ui/components/tooltip";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Layers2, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/header/page-header";
import { useTRPC } from "@/trpc/react";

export const OrganizationDashboard = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const trpc = useTRPC();
  const { data: organization } = useSuspenseQuery(
    trpc.organization.fetch.queryOptions({
      id: organizationId,
    }),
  );

  return (
    <>
      <PageHeader
        title={organization.name}
        description={
          organization.metadata?.description || "Organization dashboard"
        }
      />
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <div className="w-1/5 flex flex-col gap-4">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-normal flex items-center gap-2">
                Your team
              </h4>
              {organization.userMembership.role === "owner" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild size="icon" variant="ghost">
                      <Link href={`/${organizationId}/members/invite`}>
                        <Plus size={16} />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Invite member</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardDescription>Manage your team members....</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organization.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between"
                    >
                      {/* {member.user.name}
                      {member.user.email}*/}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {member.user.name?.[0]?.toUpperCase() || "?"}
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{member.user.name}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Badge
                        variant={
                          member.role === "owner" ? "secondary" : "outline"
                        }
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="w-4/5">
          {/* Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-normal flex items-center gap-2">
                Projects
              </h4>
              {organization.userMembership.role === "owner" && (
                <Button asChild>
                  <Link href={`/${organizationId}/projects/create`}>
                    <Plus size={16} />
                    Create project
                  </Link>
                </Button>
              )}
            </div>

            {organization.projects.length === 0 ? (
              <Card>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Layers2 />
                    </EmptyMedia>
                    <EmptyTitle>No Projects Yet</EmptyTitle>
                    <EmptyDescription>
                      No projects yet.{" "}
                      {organization.userMembership.role === "owner"
                        ? "Create your first project to get started."
                        : "Ask your organization owner to create a project."}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button asChild>
                      <Link href={`/${organizationId}/projects/create`}>
                        <Plus size={16} />
                        Create project
                      </Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organization.projects.map((site) => (
                  <Card
                    key={site.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base">{site.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {site.domain || "No domain configured"}
                        </CardDescription>
                      </div>
                      <Button asChild size="icon" variant="outline">
                        <Link href={`/${organizationId}/${site.id}/settings`}>
                          <Settings size={16} />
                        </Link>
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/${organizationId}/${site.id}`}>
                            View Project
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
