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
    <div className="container mx-auto max-w-6xl px-4">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 w-full">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className="relative dark:bg-zinc-900 bg-bklit-100 rounded-4xl border-none p-6 sm:p-8"
          >
            <CardHeader className="justify-center text-center dark:text-white text-black">
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

            <CardContent className="space-y-4 flex-1">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Features
                </h4>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-muted-foreground text-sm sm:text-lg"
                    >
                      <Check className="size-4 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter className="pt-4">
              <Button
                variant={plan.popular ? "default" : "outline"}
                className="w-full"
                size="lg"
                asChild
              >
                <a
                  href={`https://app.bklit.com/signin?utm_source=website&utm_medium=pricing-table&utm_campaign=${plan.name.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {plan.name === "Pro" ? "Upgrade to Pro" : "Start Free"}{" "}
                  <ArrowRight size={16} />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
