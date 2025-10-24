import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/server";
import { authenticated } from "@/lib/auth";
import { api } from "@/trpc/server";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const session = await authenticated({
    callbackUrl: `/settings/billing`,
  });

  // Get user's organizations
  const organizations = await api.organization.list();

  // Check if we have a purchase success parameter - if so, try to find the organization that was just upgraded
  const showSuccessMessage = resolvedSearchParams?.purchase === "success";

  let organization;

  if (showSuccessMessage) {
    // If this is a success redirect, try to find the organization that was just upgraded
    // by checking which organization has the most recent subscription activity
    try {
      // Get all organizations and check their subscription status with timestamps
      const orgsWithSubscriptions = await Promise.all(
        organizations.map(async (org) => {
          const subscriptions = await auth.api.subscriptions({
            query: {
              page: 1,
              limit: 1,
              active: true,
              referenceId: org.id,
            },
            headers: await headers(),
          });

          // Get the most recent subscription for this org
          const mostRecentSubscription = subscriptions.result.items[0];
          const subscriptionCreatedAt = mostRecentSubscription?.created_at
            ? new Date(mostRecentSubscription.created_at)
            : null;

          return {
            ...org,
            hasActiveSubscription: subscriptions.result.items.length > 0,
            subscriptionCreatedAt,
          };
        }),
      );

      // Find the organization with the MOST RECENT subscription (most likely the one just upgraded)
      const upgradedOrg = orgsWithSubscriptions
        .filter((org) => org.hasActiveSubscription)
        .sort((a, b) => {
          if (!a.subscriptionCreatedAt || !b.subscriptionCreatedAt) return 0;
          return (
            b.subscriptionCreatedAt.getTime() -
            a.subscriptionCreatedAt.getTime()
          );
        })[0];
      organization = upgradedOrg || organizations[0];
    } catch (error) {
      console.error("Error checking subscription status:", error);
      organization = organizations[0];
    }
  } else {
    // Default to first organization
    organization = organizations[0];
  }

  if (!organization) redirect(`/`);

  // Redirect to the organization-specific billing page if we found the upgraded organization
  if (showSuccessMessage && organization) {
    redirect(`/${organization.id}/settings/billing?purchase=success`);
  }

  // If no success message, redirect to first organization's billing page
  redirect(`/${organization.id}/settings/billing`);
}
