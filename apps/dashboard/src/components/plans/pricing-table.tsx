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
  organization,
  subscriptions,
}: {
  organization: { plan?: string; name: string };
  subscriptions: Subscription[] | CustomerSubscription[];
}) {
  // Use organization.plan as the source of truth
  const isPro = organization.plan === "pro";
  const hasActiveProPlan = isPro;

  // Log subscription data for debugging (using the subscriptions parameter)
  console.debug("Active subscriptions:", subscriptions.length);

  // Current plan - single source of truth for display
  const currentPlan = {
    name: isPro ? "Pro" : "Free",
    description: isPro
      ? "For teams who need more power"
      : "Perfect for getting started",
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

  // Build plans - using hardcoded plans since we get products from better-auth config
  const freePlan: PlanConfig = {
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    interval: "month",
    polarProductId: null,
    benefits: FREE_FEATURES,
  };

  const proPlan: PlanConfig = {
    name: "Pro",
    description: "For teams who need more power",
    price: 1000, // $10.00 in cents
    interval: "month",
    polarProductId:
      process.env.NEXT_PUBLIC_POLAR_PRO_PLAN_PRODUCT_ID || "pro-plan", // Use real product ID
    benefits: PRO_FEATURES,
    isPopular: true,
  };

  const plans = [freePlan, proPlan];

  const isCurrentPlan = (planId: string | null) => {
    if (planId === null) {
      // Free plan is current if organization.plan is "free"
      return !isPro;
    }
    if (
      planId ===
      (process.env.NEXT_PUBLIC_POLAR_PRO_PLAN_PRODUCT_ID || "pro-plan")
    ) {
      // Pro plan is current if organization.plan is "pro"
      return isPro;
    }
    return false;
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
        Downgrade to Free
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
