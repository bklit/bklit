"use client";

import { SankeyNivo } from "@bklit/ui/components/charts/sankey-nivo";

const data = {
  nodes: [
    { id: "Trail Bikes" },
    { id: "Enduro Bikes" },
    { id: "XC Bikes" },
    { id: "Trail M 29" },
    { id: "Enduro Pro" },
    { id: "XC Race" },
    { id: "Cart" },
    { id: "Exit" },
  ],
  links: [
    // Step 1: Home -> Category pages
    { source: "XC Bikes", target: "Trail Bikes", value: 450 },
    { source: "Home", target: "Enduro Bikes", value: 380 },
    { source: "Home", target: "XC Bikes", value: 320 },

    // Step 2: Category -> Product pages
    { source: "Trail Bikes", target: "Exit", value: 350 },
    { source: "Enduro Bikes", target: "Enduro Pro", value: 300 },
    { source: "XC Bikes", target: "XC Race", value: 250 },

    // Step 3: Product pages -> Cart (final destination)
    { source: "Trail M 29", target: "Exit", value: 220 },
    { source: "Enduro Pro", target: "Exit", value: 180 },
    { source: "XC Race", target: "Cart", value: 150 },
  ],
};

export const SankeyDemo = () => {
  return (
    <div className="w-full">
      <SankeyNivo data={data} />
    </div>
  );
};
