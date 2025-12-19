"use client";

import { formatPrice, getPricingPlans } from "@bklit/auth/pricing";
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
  const isPro = organization.plan === "pro";
  const hasActiveProPlan = isPro;

  console.debug("Active subscriptions:", subscriptions.length);

  const pricingPlans = getPricingPlans();
  const plans: PlanConfig[] = pricingPlans.map((plan) => ({
    name: plan.name,
    description: plan.description,
    price: plan.price,
    interval: plan.interval,
    polarProductId: plan.polarProductId || null,
    benefits: plan.benefits,
    isPopular: plan.isPopular,
  }));

  const isCurrentPlan = (planId: string | null) => {
    if (planId === null) {
      return !isPro;
    }
    const proPlan = plans.find((p) => p.polarProductId !== null);
    if (proPlan && planId === proPlan.polarProductId) {
      return isPro;
    }
    return false;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 w-full">
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
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
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

  if (isCurrent) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Current Plan
      </Button>
    );
  }

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

  if (!plan.polarProductId && hasActiveProPlan) {
    return (
      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          await authClient.customer.portal();
        }}
      >
        Downgrade to Free
      </Button>
    );
  }

  return (
    <Button variant="outline" className="w-full" disabled>
      Not Available
    </Button>
  );
};
