import { Team } from "@/components/team";
import { authenticated } from "@/lib/auth";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  await authenticated();
  const { organizationId } = await params;

  prefetch(
    trpc.organization.members.list.queryOptions({
      organizationId,
      page: 1,
      limit: 15,
    }),
  );

  prefetch(trpc.organization.fetch.queryOptions({ id: organizationId }));

  return (
    <HydrateClient>
      <Team organizationId={organizationId} />
    </HydrateClient>
  );
}
