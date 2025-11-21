import { unstable_noStore } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { BillingSuccessDialog } from "@/components/dialogs/billing-success-dialog";
import { PageHeader } from "@/components/header/page-header";
import { PricingTable } from "@/components/plans/pricing-table";
import { SettingsNavigation } from "@/components/settings/settings-navigation";
import { authenticated } from "@/lib/auth";
import { api } from "@/trpc/server";

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
        <div className="container mx-auto">
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
      <>
        <PageHeader
          title="Billing"
          description={`Manage subscription and billing information for ${organization.name}.`}
        >
          <SettingsNavigation
            type="organizationSettings"
            organizationId={organizationId}
          />
        </PageHeader>
        <BillingSuccessDialog isOpenInitially={showSuccessMessage} />
        <PricingTable
          organization={organization}
          subscriptions={subscriptions.result.items}
        />
      </>
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
    <>
      <PageHeader
        title="Billing"
        description={`Manage subscription and billing information for ${organization.name}.`}
      >
        <SettingsNavigation
          type="organizationSettings"
          organizationId={organizationId}
        />
      </PageHeader>
      <BillingSuccessDialog isOpenInitially={showSuccessMessage} />
      <PricingTable
        organization={organization}
        subscriptions={subscriptions.result.items}
      />
    </>
  );
}
