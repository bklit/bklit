import { ApiTokens } from "@/components/api-tokens/api-tokens";
import { CreateTokenButton } from "@/components/api-tokens/create-token-button";
import { SettingsLayout } from "@/components/settings/settings-layout";
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
    <SettingsLayout
      title="API Tokens"
      description="Manage API tokens for authenticating your tracking requests."
      headerActions={<CreateTokenButton organizationId={organizationId} />}
      navigationType="organizationSettings"
      organizationId={organizationId}
    >
      <ApiTokens
        organizationId={organizationId}
        organizationName={organization.name}
        tokens={tokens}
      />
    </SettingsLayout>
  );
}
