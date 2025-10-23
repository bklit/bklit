import type { AppRouter } from "@bklit/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import type { inferRouterOutputs } from "@trpc/server";
import { DeleteOrganizationForm } from "@/components/forms/delete-team-form";
import { UpdateOrganizationNameForm } from "@/components/forms/update-organization-name-form";
import { UpdateOrganizationThemeForm } from "@/components/forms/update-organization-theme-form";
import { getThemeGradient } from "@/lib/utils/get-organization-theme";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Organization = RouterOutputs["organization"]["fetch"];

export const OrganizationSettings = ({
  organization,
}: {
  organization: Organization;
}) => {
  if (!organization) return <div>Organization not found</div>;

  return (
    <div className="space-y-6 prose dark:prose-invert max-w-none">
      <UpdateOrganizationNameForm
        organizationId={organization.id}
        currentName={organization.name}
      />
      <Card>
        <CardHeader>
          <CardTitle>Team avatar</CardTitle>
          <CardDescription>
            This is the avatar of your team, it will be displayed in the
            dashboard and other places and is used to identify your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="size-24">
              <AvatarImage
                src={organization.logo || ""}
                alt={organization.name || ""}
              />
              <AvatarFallback
                className={getThemeGradient(organization.theme)}
              />
            </Avatar>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {organization.logo
                  ? "Avatar uploaded. Theme selection is disabled when an avatar is present."
                  : "No avatar uploaded. You can select a theme below."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!organization.logo && (
        <UpdateOrganizationThemeForm
          organizationId={organization.id}
          currentTheme={
            organization.theme ||
            (organization.metadata
              ? JSON.parse(organization.metadata)?.theme
              : null)
          }
        />
      )}

      <Card variant="destructive">
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
