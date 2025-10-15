"use client";

import { Alert, AlertDescription } from "@bklit/ui/components/alert";
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

import { AlertCircle, Check, Crown, Star } from "lucide-react";
import Link from "next/link";

interface PolarPricingTableProps {
  plans: any[];
  currentOrganizationId?: string;
  currentPlanId?: string;
  showCurrentPlan?: boolean;
}

export function PolarPricingTable({
  plans,
  currentOrganizationId,
  currentPlanId,
  showCurrentPlan = true,
}: PolarPricingTableProps) {
  const formatPrice = (priceAmount: number, currency: string = "USD") => {
    if (priceAmount === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(priceAmount / 100); // Polar prices are in cents
  };

  const isCurrentPlan = (planId: string) => {
    if (!currentPlanId || !showCurrentPlan) return false;
    return planId === currentPlanId;
  };

  const getActionButton = (plan: any) => {
    const isCurrent = isCurrentPlan(plan.id);

    if (isCurrent) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Current Plan
        </Button>
      );
    }

    // If user is on free plan and this is the pro plan, show upgrade button
    if (plan.id === "pro" && currentPlanId !== "pro") {
      return (
        <Button asChild className="w-full">
          <Link
            href={`/checkout?product=${plan.polarProductId}&organization=${currentOrganizationId}`}
          >
            Upgrade to Pro
          </Link>
        </Button>
      );
    }

    // If this is the free plan and user is not on it, show downgrade/get started
    if (plan.id === "free") {
      return (
        <Button variant="outline" className="w-full" disabled>
          Current Plan
        </Button>
      );
    }

    // Default case
    return (
      <Button asChild className="w-full">
        <Link href={`/${currentOrganizationId}/billing`}>Get Started</Link>
      </Button>
    );
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load pricing information. This might be due to a temporary
            issue with our payment provider.
          </AlertDescription>
        </Alert>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Please try again in a moment, or contact support if the issue
            persists.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {plans.map((plan) => (
          <Card key={plan.id}>
            {(plan.name.toLowerCase().includes("pro") ||
              plan.priceAmount > 0) && (
              <div className="flex justify-center">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star size={12} />
                  Most Popular
                </Badge>
              </div>
            )}

            {isCurrentPlan(plan.id) && (
              <div className="flex justify-center">
                <Badge variant="secondary" className="px-3 py-1">
                  <Crown size={12} />
                  Current
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {plan.description}
              </CardDescription>

              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-bold">
                  {formatPrice(plan.priceAmount, plan.currency)}
                </span>
                {plan.priceAmount > 0 && plan.interval && (
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
                        key={benefit.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{benefit.description || benefit.name}</span>
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
            <CardFooter>{getActionButton(plan)}</CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
