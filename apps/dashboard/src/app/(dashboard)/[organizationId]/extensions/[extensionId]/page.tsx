import { PageHeader } from "@/components/header/page-header";
import { ExtensionDetail } from "@/components/extensions/extension-detail";
import { authenticated } from "@/lib/auth";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { notFound } from "next/navigation";

export default async function ExtensionDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string; extensionId: string }>;
}) {
  await authenticated();
  const { organizationId, extensionId } = await params;

  try {
    prefetch(trpc.extension.get.queryOptions({ extensionId }));
    prefetch(trpc.organization.fetch.queryOptions({ id: organizationId }));
  } catch {
    notFound();
  }

  return (
    <HydrateClient>
      <ExtensionDetail
        organizationId={organizationId}
        extensionId={extensionId}
      />
    </HydrateClient>
  );
}

