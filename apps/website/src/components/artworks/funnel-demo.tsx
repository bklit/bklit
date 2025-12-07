"use client";

import { Funnel } from "@bklit/ui/components/charts/funnel";

const data = [
  {
    id: "landing-page",
    value: 10000,
    label: "Landing Page",
  },
  {
    id: "product-page",
    value: 6500,
    label: "Product Page",
  },
  {
    id: "cart",
    value: 3200,
    label: "Add to Cart",
  },
  {
    id: "checkout",
    value: 1800,
    label: "Checkout",
  },
];

export const FunnelDemo = () => {
  return (
    <div className="h-[500px] w-full sm:max-w-4xl mx-auto">
      <Funnel data={data} />
    </div>
  );
};
