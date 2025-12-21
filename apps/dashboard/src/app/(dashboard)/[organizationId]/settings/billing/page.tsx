import { Skeleton } from "@bklit/ui/components/skeleton";
import { unstable_noStore } from "next/cache";
import { Suspense } from "react";
import { BillingDetailsCard } from "@/components/billing/billing-details-card";
import { BillingSnapshotCard } from "@/components/billing/billing-snapshot-card";
import { BillingSuccessDialog } from "@/components/dialogs/billing-success-dialog";
import { PageHeader } from "@/components/header/page-header";
import { SubNavigation } from "@/components/navigation/sub-navigation";
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

    return (
      <>
        <PageHeader
          title="Billing"
          description={`Manage subscription and billing information for ${organization.name}.`}
        >
          <SubNavigation
            configKey="organizationSettings"
            organizationId={organizationId}
          />
        </PageHeader>
        <BillingSuccessDialog isOpenInitially={showSuccessMessage} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col gap-4">
            <Suspense
              fallback={
                <div className="h-[400px] w-full">
                  <Skeleton className="h-full w-full" />
                </div>
              }
            >
              <BillingSnapshotCard
                organizationId={organization.id}
                hideViewBillingButton
              />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <div className="h-[400px] w-full">
                <Skeleton className="h-full w-full" />
              </div>
            }
          >
            <BillingDetailsCard organizationId={organization.id} />
          </Suspense>
        </div>
      </>
    );
  }

  const organization = await api.organization.fetch({ id: organizationId });
  const showSuccessMessage = resolvedSearchParams?.purchase === "success";

  return (
    <>
      <PageHeader
        title="Billing"
        description={`Manage subscription and billing information for ${organization.name}.`}
      >
        <SubNavigation
          configKey="organizationSettings"
          organizationId={organizationId}
        />
      </PageHeader>
      <BillingSuccessDialog isOpenInitially={showSuccessMessage} />

      {/* Billing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-4">
          <Suspense
            fallback={
              <div className="h-[400px] w-full">
                <Skeleton className="h-full w-full" />
              </div>
            }
          >
            <BillingSnapshotCard
              organizationId={organizationId}
              hideViewBillingButton
            />
          </Suspense>
        </div>
        <Suspense
          fallback={
            <div className="h-[400px] w-full">
              <Skeleton className="h-full w-full" />
            </div>
          }
        >
          <BillingDetailsCard organizationId={organizationId} />
        </Suspense>
      </div>
    </>
  );
}
