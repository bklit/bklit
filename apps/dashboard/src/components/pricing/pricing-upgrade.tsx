"use client";

import { Button } from "@bklit/ui/components/button";
import { Skeleton } from "@bklit/ui/components/skeleton";
import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { authClient } from "@/auth/client";
import { useWorkspace } from "@/contexts/workspace-provider";

interface PricingUpgradeProps {
  currentPlan?: string;
}

export function PricingUpgrade({ currentPlan }: PricingUpgradeProps) {
  const { activeOrganization } = useWorkspace();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["pro-product"],
    queryFn: async () => {
      const res = await fetch("/api/pricing/pro-product");
      if (!res.ok) throw new Error("Failed to fetch Pro product");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  const proProduct = data?.product;
  const isPro = currentPlan === "pro";

  if (isLoading) {
    return (
      <div className="w-full space-y-4 rounded-lg border bg-bklit-600/30 p-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!proProduct) {
    return null;
  }

  if (isPro) {
    return (
      <div className="w-full space-y-4 rounded-lg border bg-bklit-600/30 p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">You're on the Pro Plan</h3>
          <p className="text-muted-foreground text-sm">
            {proProduct.baseEvents.toLocaleString()} events per month, then $
            {proProduct.overagePrice.toFixed(4)} per event
          </p>
        </div>
        <Button
          className="w-full"
          onClick={async () => {
            await authClient.customer.portal();
          }}
          variant="outline"
        >
          Manage Subscription
        </Button>
      </div>
    );
  }

  const handleUpgrade = async () => {
    if (!activeOrganization) return;

    setIsCheckingOut(true);
    try {
      await authClient.checkout({
        products: [proProduct.productId],
        referenceId: activeOrganization.id,
      });
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="w-full space-y-6 rounded-lg border bg-bklit-600/30 p-4">
      <div className="space-y-2">
        <div className="font-bold text-3xl">
          <NumberFlow
            format={{
              style: "currency",
              currency: "USD",
            }}
            value={proProduct.basePrice / 100}
          />
          <span className="font-normal text-base text-muted-foreground">
            {" "}
            /month
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          <span className="font-semibold text-card-foreground text-xl">
            <NumberFlow
              format={{ style: "decimal" }}
              value={proProduct.baseEvents}
            />
          </span>{" "}
          events per month, then ${proProduct.overagePrice.toFixed(4)} per event
        </p>
      </div>

      <Button
        className="w-full"
        disabled={isCheckingOut}
        onClick={handleUpgrade}
        size="lg"
      >
        {isCheckingOut ? "Processing..." : "Upgrade to Pro"}
      </Button>
    </div>
  );
}
