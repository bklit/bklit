import { Organization } from "@/components/organization/";
import { authenticated } from "@/lib/auth";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function OrganizationDashboardPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  await authenticated();
  const { organizationId } = await params;

  prefetch(trpc.organization.fetch.queryOptions({ id: organizationId }));

  return (
    <HydrateClient>
      <Organization organizationId={organizationId} />
    </HydrateClient>
  );
}
