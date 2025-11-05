import { SettingsLayout } from "@/components/settings/settings-layout";
import { authenticated } from "@/lib/auth";
import { api } from "@/trpc/server";
import { OrganizationSettings } from "../../_components/organization-settings";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  await authenticated();
  const { organizationId } = await params;

  // Fetch organization data on the server
  const organization = await api.organization.fetch({ id: organizationId });

  return (
    <SettingsLayout
      title="Settings"
      description="Manage your organization settings."
      navigationType="organizationSettings"
      organizationId={organizationId}
    >
      <OrganizationSettings organization={organization} />
    </SettingsLayout>
  );
}
