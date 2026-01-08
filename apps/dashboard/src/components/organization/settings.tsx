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
import { MemberRole } from "@bklit/utils/roles";
import type { inferRouterOutputs } from "@trpc/server";
import { DeleteOrganizationForm } from "@/components/forms/delete-organization-form";
import { UpdateOrganizationNameForm } from "@/components/forms/update-organization-name-form";
import { UpdateOrganizationThemeForm } from "@/components/forms/update-organization-theme-form";
import { FormPermissions } from "@/components/permissions/form-permissions";
import { getThemeGradient } from "@/lib/utils/get-organization-theme";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Organization = RouterOutputs["organization"]["fetch"];

export const OrganizationSettings = ({
  organization,
}: {
  organization: Organization;
}) => {
  if (!organization) {
    return <div>Organization not found</div>;
  }

  return (
    <div className="prose dark:prose-invert max-w-none space-y-6">
      <UpdateOrganizationNameForm
        currentName={organization.name}
        organizationId={organization.id}
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
                alt={organization.name || ""}
                src={organization.logo || ""}
              />
              <AvatarFallback
                className={getThemeGradient(organization.theme)}
              />
            </Avatar>
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-sm">
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
          currentTheme={
            organization.theme ||
            (organization.metadata
              ? JSON.parse(organization.metadata)?.theme
              : null)
          }
          organizationId={organization.id}
        />
      )}
      <FormPermissions asChild requiredRole={MemberRole.ADMIN}>
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
      </FormPermissions>
    </div>
  );
};
