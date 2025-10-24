import { PageHeader } from "@/components/header/page-header";
import { NavSide } from "@/components/nav/nav-side";
import { authenticated } from "@/lib/auth";
import { workspaceSettingsNavItems } from "@/lib/navigation";
import { api, HydrateClient } from "@/trpc/server";
import { OrganizationSettings } from "../../_components/organization-settings";

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  await authenticated();
  const { organizationId } = await params;

  const organization = await api.organization.fetch({ id: organizationId });
  const navItems = workspaceSettingsNavItems(organizationId);

  return (
    <HydrateClient>
      <PageHeader
        title="Settings"
        description="Manage your organization settings."
      />
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <div className="w-1/6">
          <NavSide items={navItems} />
        </div>
        <div className="w-5/6">
          <OrganizationSettings organization={organization} />
        </div>
      </div>
    </HydrateClient>
  );
}
