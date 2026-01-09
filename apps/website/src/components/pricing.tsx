import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Check } from "lucide-react";
import { PLAN_DETAILS } from "../lib/plans";

export const Pricing = () => {
  const plans = Object.values(PLAN_DETAILS);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4">
      <div className="grid w-full gap-px bg-border lg:grid-cols-2">
        {plans.map((plan) => (
          <Card
            className="relative rounded-none border-none bg-background"
            key={plan.name}
          >
            <CardHeader className="border-border border-b text-center text-black dark:text-white">
              <CardTitle className="font-bold text-2xl">{plan.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {plan.description}
              </CardDescription>

              <div className="flex items-baseline justify-center gap-1 pt-4">
                <span className="font-bold text-4xl">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4 p-6 sm:p-8">
              <div className="space-y-3">
                <h4 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
                  Features
                </h4>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      className="flex items-center gap-3 text-muted-foreground text-sm"
                      key={feature}
                    >
                      <Check className="size-3 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
