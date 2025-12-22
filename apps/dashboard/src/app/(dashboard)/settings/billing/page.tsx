import type { AppRouter } from "@bklit/api";
import type { inferRouterOutputs } from "@trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/server";
import { api } from "@/trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Organization = RouterOutputs["organization"]["list"][0];

export default async function RedirectBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const organizations = await api.organization.list();
  const showSuccessMessage = resolvedSearchParams?.purchase === "success";

  let organization: Organization | undefined;

  if (showSuccessMessage) {
    try {
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

          const mostRecentSubscription = subscriptions.result.items[0];
          const subscriptionCreatedAt = mostRecentSubscription?.createdAt
            ? new Date(mostRecentSubscription.createdAt)
            : null;

          return {
            ...org,
            hasActiveSubscription: subscriptions.result.items.length > 0,
            subscriptionCreatedAt,
          };
        })
      );

      // Find org with most recent subscription
      const upgradedOrg = orgsWithSubscriptions
        .filter((org) => org.hasActiveSubscription)
        .sort((a, b) => {
          if (!(a.subscriptionCreatedAt && b.subscriptionCreatedAt)) return 0;
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
    organization = organizations[0];
  }

  if (!organization) redirect("/");

  if (showSuccessMessage && organization) {
    // Redirect to organization-specific billing page
    // Note: Revalidation is handled by the webhook when database is updated
    redirect(`/${organization.id}/settings/billing?purchase=success`);
  }

  redirect(`/${organization.id}/settings/billing`);
}
