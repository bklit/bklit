import { Button } from "@bklit/ui/components/button";
import Link from "next/link";
import { PageHeader } from "@/components/header/page-header";
import { authenticated } from "@/lib/auth";
import { api, HydrateClient } from "@/trpc/server";
import { OrganizationSettings } from "../../_components/organization-settings";

export async function WorkspaceSettingsNavigation({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;

  return (
    <nav className="flex flex-col gap-px">
      <Button variant="ghost" asChild className="justify-start">
        <Link href={`/${organizationId}/settings/`}>General</Link>
      </Button>

      <Button variant="ghost" asChild className="justify-start">
        <Link href={`/${organizationId}/settings/billing`}>Billing</Link>
      </Button>
    </nav>
  );
}

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
    <HydrateClient>
      <PageHeader
        title="Settings"
        description="Manage your organization settings."
      />
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <div className="w-1/6">
          <WorkspaceSettingsNavigation params={params} />
        </div>
        <div className="w-5/6">
          <OrganizationSettings organization={organization} />
        </div>
      </div>
    </HydrateClient>
  );
}
