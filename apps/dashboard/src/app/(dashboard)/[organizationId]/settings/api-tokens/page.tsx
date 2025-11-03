import { ApiTokens } from "@/components/api-tokens/api-tokens";
import { CreateTokenButton } from "@/components/api-tokens/create-token-button";
import { PageHeader } from "@/components/header/page-header";
import { authenticated } from "@/lib/auth";
import { api, HydrateClient } from "@/trpc/server";
import { WorkspaceSettingsNavigation } from "../(general)/page";

export default async function ApiTokensSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  await authenticated();
  const { organizationId } = await params;

  const [tokens, organization] = await Promise.all([
    api.apiToken.list({ organizationId }),
    api.organization.fetch({ id: organizationId }),
  ]);

  return (
    <HydrateClient>
      <PageHeader
        title="API Tokens"
        description="Manage API tokens for authenticating your tracking requests."
      >
        <CreateTokenButton organizationId={organizationId} />
      </PageHeader>
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <div className="w-1/6">
          <WorkspaceSettingsNavigation params={params} />
        </div>
        <div className="w-5/6">
          <ApiTokens
            organizationId={organizationId}
            organizationName={organization.name}
            tokens={tokens}
          />
        </div>
      </div>
    </HydrateClient>
  );
}
