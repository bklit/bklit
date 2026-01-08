"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@bklit/ui/components/item";
import { Progress } from "@bklit/ui/components/progress";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useWorkspace } from "@/contexts/workspace-provider";
import { calculateDaysUntil } from "@/lib/billing-utils";
import { useTRPC } from "@/trpc/react";
import { PricingUpgrade } from "../pricing/pricing-upgrade";

interface BillingSnapshotCardProps {
  organizationId: string;
  hideViewBillingButton?: boolean;
}

export function BillingSnapshotCard({
  organizationId,
  hideViewBillingButton = false,
}: BillingSnapshotCardProps) {
  const trpc = useTRPC();
  const { activeOrganization } = useWorkspace();

  const { data: billing, isLoading } = useQuery(
    trpc.organization.getBillingSnapshot.queryOptions({
      organizationId,
    })
  );

  const { data: productsData } = useQuery({
    queryKey: ["pro-product"],
    queryFn: async () => {
      const res = await fetch("/api/pricing/pro-product");
      if (!res.ok) {
        throw new Error("Failed to fetch pricing");
      }
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Billing</CardTitle>
            <Skeleton className="h-5 w-12" />
          </div>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage skeletons */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!billing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Unable to load billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" variant="outline">
            <Link href={`/${organizationId}/settings/billing`}>
              Go to Billing
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isPro = billing?.planName === "pro";
  const proProduct = productsData?.product;

  // Calculate days remaining in billing cycle
  const getDaysRemaining = () => {
    if (!billing?.usage?.periodStart) {
      return null;
    }

    let cycleEnd: Date;
    if (billing.currentPeriodEnd) {
      // Pro plan - use subscription period end
      cycleEnd = new Date(billing.currentPeriodEnd);
    } else {
      // Free plan - use end of current month
      const now = new Date();
      cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      cycleEnd.setHours(23, 59, 59, 999);
    }

    return calculateDaysUntil(cycleEnd);
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
        <CardDescription>
          {daysRemaining !== null
            ? daysRemaining === 0
              ? "Cycle ends today"
              : daysRemaining === 1
                ? "1 day remaining in cycle"
                : `${daysRemaining} days remaining in cycle`
            : "Manage your subscription"}
        </CardDescription>

        {!hideViewBillingButton && (
          <CardAction>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/${organizationId}/settings/billing`}>Billing</Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Metrics */}
        {billing.usage && (
          <Item className="bg-bklit-600/30" variant="outline">
            <ItemContent className="space-y-2">
              {/* Total Operations */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Total Operations
                  </span>
                  <span className="font-medium">
                    {billing.usage.total.toLocaleString()} /{" "}
                    {billing.usage.limit.toLocaleString()}
                  </span>
                </div>
                <Progress value={Math.min(billing.usage.percentageUsed, 100)} />
                {billing.usage.percentageUsed >= 90 && (
                  <p className="text-red-600 text-xs dark:text-red-400">
                    {billing.usage.percentageUsed >= 100
                      ? "Limit reached"
                      : "Approaching limit"}
                  </p>
                )}
              </div>

              {/* Pageviews */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Pageviews</span>
                  <span className="font-medium">
                    {billing.usage.pageviews.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (billing.usage.pageviews / billing.usage.limit) * 100,
                    100
                  )}
                />
              </div>

              {/* Tracked Events */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Custom Events</span>
                  <span className="font-medium">
                    {billing.usage.trackedEvents.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (billing.usage.trackedEvents / billing.usage.limit) * 100,
                    100
                  )}
                />
              </div>

              {/* Overage Events (Pro only) */}
              {isPro && proProduct && (
                <div className="space-y-1.5 border-t pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Overage Events
                    </span>
                    <span className="font-medium">
                      {Math.max(
                        0,
                        billing.usage.total - proProduct.baseEvents
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      On-demand Charges
                    </span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(
                        Math.max(
                          0,
                          billing.usage.total - proProduct.baseEvents
                        ) * proProduct.overagePrice
                      )}
                    </span>
                  </div>
                </div>
              )}
            </ItemContent>
          </Item>
        )}

        {billing.cancelAtPeriodEnd && billing.currentPeriodEnd && (
          <Item
            className="border-destructive bg-destructive/10"
            variant="outline"
          >
            <ItemContent>
              <ItemTitle>Subscription Ending</ItemTitle>
              <ItemDescription className="text-destructive/80">
                Your Pro plan will end on{" "}
                {new Date(billing.currentPeriodEnd).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </ItemDescription>
            </ItemContent>
          </Item>
        )}

        <PricingUpgrade currentPlan={activeOrganization?.plan} />
      </CardContent>
    </Card>
  );
}
