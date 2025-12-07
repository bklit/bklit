"use client";

import { SankeyNivo } from "@bklit/ui/components/charts/sankey-nivo";

const data = {
  nodes: [
    { id: "Home" },
    { id: "Mountain Bikes" },
    { id: "Trail Bikes" },
    { id: "Enduro Bikes" },
    { id: "XC Bikes" },
    { id: "Trail Master 29" },
    { id: "Enduro Pro 27.5" },
    { id: "XC Race Elite" },
    { id: "Cart" },
    { id: "Checkout" },
    { id: "Purchase" },
    { id: "Exit" },
  ],
  links: [
    { source: "Home", target: "Mountain Bikes", value: 1200 },
    { source: "Home", target: "Exit", value: 300 },
    { source: "Mountain Bikes", target: "Trail Bikes", value: 450 },
    { source: "Mountain Bikes", target: "Enduro Bikes", value: 380 },
    { source: "Mountain Bikes", target: "XC Bikes", value: 320 },
    { source: "Mountain Bikes", target: "Exit", value: 50 },
    { source: "Trail Bikes", target: "Trail Master 29", value: 320 },
    { source: "Trail Bikes", target: "Exit", value: 130 },
    { source: "Enduro Bikes", target: "Enduro Pro 27.5", value: 280 },
    { source: "Enduro Bikes", target: "Exit", value: 100 },
    { source: "XC Bikes", target: "XC Race Elite", value: 220 },
    { source: "XC Bikes", target: "Exit", value: 100 },
    { source: "Trail Master 29", target: "Cart", value: 180 },
    { source: "Trail Master 29", target: "Exit", value: 140 },
    { source: "Enduro Pro 27.5", target: "Cart", value: 150 },
    { source: "Enduro Pro 27.5", target: "Exit", value: 130 },
    { source: "XC Race Elite", target: "Cart", value: 120 },
    { source: "XC Race Elite", target: "Exit", value: 100 },
    { source: "Cart", target: "Checkout", value: 280 },
    { source: "Cart", target: "Exit", value: 170 },
    { source: "Checkout", target: "Purchase", value: 220 },
    { source: "Checkout", target: "Exit", value: 60 },
  ],
};

export const SankeyDemo = () => {
  return (
    <div className="h-[500px] w-full">
      <SankeyNivo data={data} />
    </div>
  );
};
