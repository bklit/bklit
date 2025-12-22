import { ApiTokens } from "@/components/api-tokens/api-tokens";
// import { CreateTokenButton } from "@/components/api-tokens/create-token-button";
import { PageHeader } from "@/components/header/page-header";
import { SubNavigation } from "@/components/navigation/sub-navigation";
import { authenticated } from "@/lib/auth";
import { api } from "@/trpc/server";

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
    <>
      <PageHeader
        description="Manage API tokens for authenticating your tracking requests."
        title="API Tokens"
      >
        <SubNavigation
          configKey="organizationSettings"
          organizationId={organizationId}
        />
      </PageHeader>
      <ApiTokens
        organizationId={organizationId}
        organizationName={organization.name}
        tokens={tokens}
      />
    </>
  );
}
