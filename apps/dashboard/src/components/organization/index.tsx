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
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@bklit/ui/components/item";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Layers2, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BillingSnapshotCard } from "@/components/billing/billing-snapshot-card";
import { InviteMemberForm } from "@/components/forms/invite-member-form";
import { PageHeader } from "@/components/header/page-header";
import { useTRPC } from "@/trpc/react";

export const Organization = ({
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

      <div className="w-full flex flex-col gap-4">
        <div className="w-full flex flex-col gap-4 sm:grid sm:grid-cols-2">
          <BillingSnapshotCard organizationId={organizationId} />

          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>Manage your team.</CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(true)}
                  aria-label="Invite member"
                >
                  Invite member
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="bg-bklit-600/30 rounded-md p-4 space-y-px border">
                {organization.members.slice(0, 5).map((member) => (
                  <Item key={member.id} size="sm">
                    <ItemMedia>
                      <Avatar>
                        <AvatarImage src={member.user.image || ""} />
                        <AvatarFallback>
                          {member.user.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{member.user.name}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <Badge
                        variant={
                          member.role === "owner" ? "default" : "outline"
                        }
                      >
                        {member.role}
                      </Badge>
                    </ItemActions>
                  </Item>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Projects</h2>
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

      <InviteMemberForm
        organizationId={organizationId}
        isOpen={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </>
  );
};
