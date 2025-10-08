import { Button } from "@bklit/ui/components/button";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { authenticated } from "@/lib/auth";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { OrganizationSettings } from "../../_components/organization-settings";

export async function SettingsNavigation({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;

  return (
    <nav className="flex flex-col gap-px">
      <Link href={`/${organizationId}/settings/`}>
        <Button variant="ghost">General</Button>
      </Link>
      <Link href={`/${organizationId}/settings/billing`}>
        <Button variant="ghost">Billing</Button>
      </Link>
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

  prefetch(trpc.organization.fetch.queryOptions({ id: organizationId }));

  return (
    <HydrateClient>
      <PageHeader
        title="Settings"
        description="Manage your organization settings."
      />
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <div className="w-1/6">
          <SettingsNavigation params={params} />
        </div>
        <div className="w-5/6">
          <OrganizationSettings organizationId={organizationId} />
        </div>
      </div>
    </HydrateClient>
  );
}
