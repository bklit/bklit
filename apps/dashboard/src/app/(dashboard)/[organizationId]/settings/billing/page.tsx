import { unstable_noStore } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { BillingSuccessDialog } from "@/components/dialogs/billing-success-dialog";
import { PageHeader } from "@/components/header/page-header";
import { PricingTable } from "@/components/plans/pricing-table";
import { authenticated } from "@/lib/auth";
import { api, HydrateClient } from "@/trpc/server";
import { WorkspaceSettingsNavigation } from "../(general)/page";

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { organizationId } = await params;
  const resolvedSearchParams = await searchParams;

  // Handle case where REFERENCE_ID placeholder wasn't replaced
  if (
    organizationId === "{REFERENCE_ID}" ||
    organizationId === "%7BREFERENCE_ID%7D"
  ) {
    // Get user's organizations and use the first one
    const organizations = await api.organization.list();
    const organization = organizations[0];

    if (!organization) {
      return (
        <div className="container mx-auto py-6 px-4">
          <PageHeader
            title="Billing"
            description="No organization found. Please create an organization first."
          />
        </div>
      );
    }

    const showSuccessMessage = resolvedSearchParams?.purchase === "success";

    // Force fresh data fetch when success parameter is present
    if (showSuccessMessage) {
      unstable_noStore();
    }

    // Fetch active subscriptions for the organization
    const subscriptions = await auth.api.subscriptions({
      query: {
        page: 1,
        limit: 10,
        active: true,
        referenceId: organization.id,
      },
      headers: await headers(),
    });

    return (
      <HydrateClient>
        <PageHeader
          title="Billing"
          description={`Manage subscription and billing information for ${organization.name}.`}
        />
        <div className="container mx-auto py-6 px-4">
          <BillingSuccessDialog isOpenInitially={showSuccessMessage} />

          <PricingTable
            organization={organization}
            subscriptions={subscriptions.result.items}
          />
        </div>
      </HydrateClient>
    );
  }

  const _session = await authenticated({
    callbackUrl: `/${organizationId}/billing`,
  });

  const organization = await api.organization.fetch({ id: organizationId });
  const showSuccessMessage = resolvedSearchParams?.purchase === "success";

  // Fetch active subscriptions for the organization
  const subscriptions = await auth.api.subscriptions({
    query: {
      page: 1,
      limit: 10,
      active: true,
      referenceId: organizationId,
    },
    headers: await headers(),
  });

  return (
    <HydrateClient>
      <PageHeader
        title="Billing"
        description={`Manage subscription and billing information for ${organization.name}.`}
      />
      <div className="container mx-auto py-6 px-4 flex gap-4">
        <div className="w-1/6">
          <WorkspaceSettingsNavigation params={params} />
        </div>
        <div className="w-5/6">
          <BillingSuccessDialog isOpenInitially={showSuccessMessage} />

          <PricingTable
            organization={organization}
            subscriptions={subscriptions.result.items}
          />
        </div>
      </div>
    </HydrateClient>
  );
}
