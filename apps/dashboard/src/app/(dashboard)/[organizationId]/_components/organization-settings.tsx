"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { DeleteOrganizationForm } from "@/components/forms/delete-team-form";
import { useTRPC } from "@/trpc/react";

export const OrganizationSettings = ({
  organizationId,
}: {
  organizationId: string;
}) => {
  const trpc = useTRPC();
  const { data: organization, isLoading } = useQuery(
    trpc.organization.fetch.queryOptions({
      id: organizationId,
    }),
  );

  if (isLoading) return <div>Loading...</div>;
  if (!organization) return <div>Organization not found</div>;

  return (
    <div className="space-y-6 prose dark:prose-invert max-w-none">
      <Card className="card">
        <CardHeader>
          <CardTitle>Delete organization</CardTitle>
          <CardDescription>
            Delete this organization and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {organization.userMembership.role === "owner" && (
            <DeleteOrganizationForm
              organizationId={organization.id}
              organizationName={organization.name}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
