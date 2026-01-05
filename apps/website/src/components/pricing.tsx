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
      <div className="grid lg:grid-cols-2 w-full bg-border gap-px">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className="relative border-none bg-background rounded-none"
          >
            <CardHeader className="text-center dark:text-white text-black border-b border-border">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {plan.description}
              </CardDescription>

              <div className="flex items-baseline justify-center gap-1 pt-4">
                <span className="text-4xl font-bold">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 flex-1 p-6 sm:p-8 ">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Features
                </h4>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-muted-foreground text-sm "
                    >
                      <Check className="size-3 text-emerald-500 shrink-0" />
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
