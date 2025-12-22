"use client";

import { Funnel } from "@bklit/ui/components/charts/funnel";

const data = [
  {
    id: "landing-page",
    value: 10_000,
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
    <div className="mx-auto h-[500px] w-full sm:max-w-4xl">
      <Funnel data={data} />
    </div>
  );
};
