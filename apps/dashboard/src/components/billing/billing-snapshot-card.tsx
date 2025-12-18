"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@bklit/ui/components/item";
import { Progress } from "@bklit/ui/components/progress";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/auth/client";
import { calculateDaysUntil } from "@/lib/billing-utils";
import { useTRPC } from "@/trpc/react";

interface BillingSnapshotCardProps {
  organizationId: string;
  hideViewBillingButton?: boolean;
}

export function BillingSnapshotCard({
  organizationId,
  hideViewBillingButton = false,
}: BillingSnapshotCardProps) {
  const trpc = useTRPC();

  const { data: billing, isLoading } = useQuery(
    trpc.organization.getBillingSnapshot.queryOptions({
      organizationId,
    }),
  );

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
          <Button asChild variant="outline" className="w-full">
            <Link href={`/${organizationId}/settings/billing`}>
              Go to Billing
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isProPlan = String(billing?.planName) === "pro";

  // Calculate days remaining in billing cycle
  const getDaysRemaining = () => {
    if (!billing?.usage?.periodStart) return null;

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
        <div className="flex items-center justify-between">
          <CardTitle>Usage</CardTitle>
        </div>
        <CardDescription>
          {daysRemaining !== null
            ? daysRemaining === 0
              ? "Cycle ends today"
              : daysRemaining === 1
                ? "1 day remaining in cycle"
                : `${daysRemaining} days remaining in cycle`
            : "Manage your subscription"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Metrics */}
        {billing.usage && (
          <Item variant="outline" className="bg-bklit-600/30">
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
                  <p className="text-xs text-red-600 dark:text-red-400">
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
                    100,
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
                    100,
                  )}
                />
              </div>
            </ItemContent>
          </Item>
        )}

        {!hideViewBillingButton && (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/${organizationId}/settings/billing`}>
              View billing
            </Link>
          </Button>
        )}

        {hideViewBillingButton &&
          (isProPlan ? (
            <Item variant="success">
              <ItemContent>
                <ItemTitle>You are on the Pro Plan</ItemTitle>
                <ItemDescription className="text-teal-600">
                  {billing.usage?.limit.toLocaleString() || "0"} operations per
                  month
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="secondary"
                  className="cursor-pointer w-full"
                  onClick={async () => {
                    await authClient.customer.portal();
                  }}
                >
                  Manage subscription
                </Button>
              </ItemActions>
            </Item>
          ) : (
            <Item variant="outline" className="bg-bklit-600/30">
              <ItemContent>
                <ItemTitle>You are on the Free Plan</ItemTitle>
                <ItemDescription>
                  {billing.usage?.limit.toLocaleString() || "0"} operations per
                  month
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  className="cursor-pointer w-full"
                  onClick={async () => {
                    await authClient.customer.portal();
                  }}
                >
                  Upgrade to Pro
                </Button>
              </ItemActions>
            </Item>
          ))}
      </CardContent>
    </Card>
  );
}
