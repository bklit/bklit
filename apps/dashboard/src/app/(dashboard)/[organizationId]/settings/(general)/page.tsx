import { PageHeader } from "@/components/header/page-header";
import { SubNavigation } from "@/components/navigation/sub-navigation";
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
    <>
      <PageHeader
        title="Settings"
        description="Manage your organization settings."
      >
        <SubNavigation
          configKey="organizationSettings"
          organizationId={organizationId}
        />
      </PageHeader>
      <OrganizationSettings organization={organization} />
    </>
  );
}
