import { PageHeader } from "@/components/header/page-header";
import { authenticated } from "@/lib/auth";
import { HydrateClient } from "@/trpc/server";
import { ApiTokens } from "../../_components/api-tokens";
import { WorkspaceSettingsNavigation } from "../(general)/page";

export default async function ApiTokensSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  await authenticated();
  const { organizationId } = await params;

  return (
    <HydrateClient>
      <PageHeader
        title="API Tokens"
        description="Manage API tokens for authenticating your tracking requests."
      />
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <div className="w-1/6">
          <WorkspaceSettingsNavigation params={params} />
        </div>
        <div className="w-5/6">
          <ApiTokens organizationId={organizationId} />
        </div>
      </div>
    </HydrateClient>
  );
}
