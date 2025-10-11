import { headers } from "next/headers";
import { getPolarSubscriptionsForOrg } from "@/actions/polar-actions";
import { auth } from "@/auth/server";
import { BillingSuccessDialog } from "@/components/dialogs/billing-success-dialog";
import { PageHeader } from "@/components/page-header";
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

  // Fetch directly from Polar API for products
  const directPolarData = await getPolarSubscriptionsForOrg(organizationId);

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
            subscriptions={subscriptions.result.items}
            products={
              directPolarData.success &&
              directPolarData.data?.products?.result?.items
                ? directPolarData.data.products.result.items
                : []
            }
          />
        </div>
      </div>
    </HydrateClient>
  );
}
