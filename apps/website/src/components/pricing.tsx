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
import { ArrowRight, Check } from "lucide-react";

export const Pricing = () => {
  const plans = getPricingPlans();

  return (
    <div className="container mx-auto max-w-6xl px-4">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 w-full">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className="relative bg-zinc-900 rounded-4xl border-none p-8"
          >
            <CardHeader className="justify-center text-center">
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
                        <Check className="size-4 text-emerald-500 shrink-0" />
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

            <CardFooter className="pt-4">
              <Button
                variant={plan.isPopular ? "default" : "outline"}
                className="w-full"
                size="lg"
                asChild
              >
                <a
                  href="https://app.bklit.com/signin?utm_source=website&utm_medium=pricing-table&utm_campaign=bklit"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get started <ArrowRight size={16} />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
