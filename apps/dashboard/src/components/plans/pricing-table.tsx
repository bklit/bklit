"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import type { CustomerSubscription } from "@polar-sh/sdk/models/components/customersubscription.js";
import type { Product } from "@polar-sh/sdk/models/components/product.js";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js";
import { Check, Crown } from "lucide-react";
import { authClient } from "@/auth/client";
import { useWorkspace } from "@/contexts/workspace-provider";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100); // Polar uses cents
}

interface PlanConfig {
  name: string;
  description: string;
  price: number;
  interval?: string;
  polarProductId: string | null;
  benefits: string[];
  isPopular?: boolean;
}

export function PricingTable({
  subscriptions,
  products,
}: {
  subscriptions: Subscription[] | CustomerSubscription[];
  products?: Product[];
}) {
  // Check if user has an active subscription
  const activeSubscription = subscriptions.find(
    (subscription) => subscription.status === "active",
  );
  const hasActiveProPlan = !!activeSubscription;

  // Current plan - single source of truth for display
  const currentPlan = {
    name: activeSubscription?.product?.name || "Free",
    description:
      activeSubscription?.product?.description || "Perfect for getting started",
    isActive: hasActiveProPlan,
  };

  // Placeholder features
  const FREE_FEATURES = [
    "Up to 10,000 events per month",
    "1 project",
    "7-day data retention",
    "Basic analytics dashboard",
    "Core event tracking",
    "Community support",
  ];

  const PRO_FEATURES = [
    "Unlimited events",
    "Unlimited projects",
    "12-month data retention",
    "Advanced analytics & insights",
    "Custom event tracking",
    "Real-time analytics",
    "Session replay",
    "Funnel analysis",
    "A/B testing insights",
    "Custom dashboards",
    "API access",
    "Priority support",
  ];

  // Build plans from Polar products + hardcoded Free plan
  const freePlan: PlanConfig = {
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    interval: "month",
    polarProductId: null,
    benefits: FREE_FEATURES,
  };

  const proPlan: PlanConfig | null = products?.[0]
    ? {
        name: products[0].name,
        description: products[0].description || "For teams who need more power",
        price: (() => {
          const firstPrice = products[0].prices?.[0];
          if (!firstPrice) return 0;
          // Handle different price types
          if ("priceAmount" in firstPrice) {
            return firstPrice.priceAmount;
          }
          if ("minimumAmount" in firstPrice) {
            return firstPrice.minimumAmount || 0;
          }
          return 0;
        })(),
        interval: products[0].prices?.[0]?.recurringInterval || "month",
        polarProductId: products[0].id,
        benefits: (() => {
          const polarBenefits = products[0].benefits
            ?.map((b) => b.description)
            .filter(Boolean) as string[];
          // Use PRO_FEATURES if Polar has no benefits configured
          return polarBenefits && polarBenefits.length > 0
            ? polarBenefits
            : PRO_FEATURES;
        })(),
        isPopular: true,
      }
    : null;

  const plans = [freePlan, proPlan].filter((p): p is PlanConfig => p !== null);

  const isCurrentPlan = (planId: string | null) => {
    if (planId === null) {
      // Free plan is current if no active subscription
      return !hasActiveProPlan;
    }
    return activeSubscription?.productId === planId;
  };

  return (
    <div className="flex flex-col items-center w-full gap-6">
      {/* Current Plan Overview Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{currentPlan.name}</CardTitle>
          <CardDescription>{currentPlan.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {!currentPlan.isActive ? (
            // Upsell message for Free plan users
            <div className="flex flex-col items-center justify-center gap-2 text-center py-6 border-t border-t-primary/10 border-b border-b-primary/30 bg-gradient-to-br from-bklit-900 to-primary/20 -mx-6">
              <p className="text-muted-foreground">
                Upgrade to the{" "}
                <Badge variant="default">
                  {plans.find((p) => p.polarProductId !== null)?.name}
                </Badge>{" "}
                plan.
              </p>
              <p>Get more out of your data with powerful features!</p>
            </div>
          ) : (
            // Status for Pro plan users
            <div className="flex items-center justify-center gap-2">
              <Badge variant="default">Active Subscription</Badge>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="cursor-pointer"
            onClick={async () => {
              await authClient.customer.portal();
            }}
          >
            Manage subscription
          </Button>
        </CardFooter>
      </Card>

      {/* Plan Options */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 w-full">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.polarProductId);

          return (
            <Card key={plan.name} className={isCurrent ? "border-primary" : ""}>
              {plan.isPopular && !isCurrent && (
                <div className="flex justify-center pt-4">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              {isCurrent && (
                <div className="flex justify-center pt-4">
                  <Badge variant="secondary" className="px-3 py-1">
                    <Crown className="size-3 mr-1" />
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>

                <div className="flex items-baseline justify-center gap-1 pt-4">
                  <span className="text-4xl font-bold">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.interval && (
                    <span className="text-muted-foreground">
                      /{plan.interval}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                {/* Features List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Features
                  </h4>
                  <ul className="space-y-2">
                    {plan.benefits.length > 0 ? (
                      plan.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-center gap-3 text-sm"
                        >
                          <Check className="size-4 text-green-500 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">
                        No features listed
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <CheckoutButton
                  plan={plan}
                  isCurrent={isCurrent}
                  hasActiveProPlan={hasActiveProPlan}
                />
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const CheckoutButton = ({
  plan,
  isCurrent,
  hasActiveProPlan,
}: {
  plan: PlanConfig;
  isCurrent: boolean;
  hasActiveProPlan: boolean;
}) => {
  const { activeOrganization } = useWorkspace();

  // Current plan - disabled button
  if (isCurrent) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Current Plan
      </Button>
    );
  }

  // Pro plan (when user is on Free)
  if (plan.polarProductId && !hasActiveProPlan) {
    return (
      <Button
        className="w-full cursor-pointer"
        onClick={async () => {
          await authClient.checkout({
            products: [plan.polarProductId as string],
            referenceId: activeOrganization?.id,
          });
        }}
      >
        Upgrade to {plan.name}
      </Button>
    );
  }

  // Free plan (when user is on Pro) - downgrade by canceling
  if (!plan.polarProductId && hasActiveProPlan) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          // Open customer portal to cancel subscription
          await authClient.customer.portal();
        }}
      >
        Cancel Subscription
      </Button>
    );
  }

  // Default case (shouldn't normally reach here)
  return (
    <Button variant="outline" className="w-full" disabled>
      Not Available
    </Button>
  );
};
