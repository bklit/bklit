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
      <div className="grid w-full gap-6 lg:grid-cols-2 lg:gap-8">
        {plans.map((plan) => (
          <Card
            className="relative rounded-4xl border-none bg-bklit-100 p-6 sm:p-8 dark:bg-zinc-900"
            key={plan.name}
          >
            <CardHeader className="justify-center text-center text-black dark:text-white">
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

            <CardContent className="flex-1 space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
                  Features
                </h4>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      className="flex items-center gap-3 text-muted-foreground text-sm sm:text-lg"
                      key={feature}
                    >
                      <Check className="size-4 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter className="pt-4">
              <Button
                asChild
                className="w-full"
                size="lg"
                variant={plan.popular ? "default" : "outline"}
              >
                <a
                  href={`https://app.bklit.com/signin?utm_source=website&utm_medium=pricing-table&utm_campaign=${plan.name.toLowerCase()}`}
                  rel="noopener noreferrer"
                  target="_blank"
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
