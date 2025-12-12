"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardAction,
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
import { useState } from "react";
import { InviteMemberForm } from "@/components/forms/invite-member-form";
import { PageHeader } from "@/components/header/page-header";
import { useTRPC } from "@/trpc/react";

export const OrganizationDashboard = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const trpc = useTRPC();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { data: organization } = useSuspenseQuery(
    trpc.organization.fetch.queryOptions({
      id: organizationId,
    }),
  );

  return (
    <>
      <PageHeader
        title={organization.name}
        description="Manage your team and projects."
      >
        {organization.userMembership.role === "owner" && (
          <Button asChild>
            <Link href={`/${organizationId}/projects/create`}>
              <Plus size={16} />
              Create project
            </Link>
          </Button>
        )}
      </PageHeader>
      <div className="container mx-auto flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/5 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>Manage your team.</CardDescription>
              <CardAction>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setInviteDialogOpen(true)}
                  aria-label="Invite member"
                >
                  <Plus size={16} />
                </Button>
              </CardAction>
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
                        <Avatar>
                          <AvatarImage src={member.user.image || ""} />
                          <AvatarFallback>
                            {member.user.name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
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
        </div>

        <div className="w-full sm:w-4/5">
          {/* Projects Section */}
          <div className="space-y-4">
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

      <InviteMemberForm
        organizationId={organizationId}
        isOpen={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </>
  );
};
