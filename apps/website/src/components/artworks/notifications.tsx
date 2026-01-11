"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { CircleFlag } from "react-circle-flags";

interface Position {
  x: number;
  y: number;
  opacity: number;
}

// 6 physical positions to match our 6 items for a seamless loop
const positions: Position[] = [
  { x: -24, y: 20, opacity: 0 }, // Position 1: FRONT (Entrance, Invisible)
  { x: -12, y: 10, opacity: 1 }, // Position 2: Visible (Frontmost)
  { x: 0, y: 0, opacity: 1 }, // Position 3: Visible
  { x: 12, y: -10, opacity: 1 }, // Position 4: Visible
  { x: 24, y: -20, opacity: 0 }, // Position 5: BACK (Exit, Invisible)
  { x: 36, y: -30, opacity: 0 }, // Position 6: Hidden (Transition slot)
];

export const Notifications = () => {
  const [cycleIndex, setCycleIndex] = useState(0);

  const notifications = [
    {
      id: "us-visitor",
      title: "New live visitor from United States, San Francisco.",
      description: "Viewing on desktop",
      countryCode: "us",
    },
    {
      id: "gb-visitor",
      title: "New live visitor from United Kingdom, London.",
      description: "Viewing on mobile",
      countryCode: "gb",
    },
    {
      id: "de-visitor",
      title: "New live visitor from Germany, Berlin.",
      description: "Viewing on desktop",
      countryCode: "de",
    },
    {
      id: "fr-visitor",
      title: "New live visitor from France, Paris.",
      description: "Viewing on mobile",
      countryCode: "fr",
    },
    {
      id: "jp-visitor",
      title: "New live visitor from Japan, Tokyo.",
      description: "Viewing on desktop",
      countryCode: "jp",
    },
    {
      id: "ca-visitor",
      title: "New live visitor from Canada, Toronto.",
      description: "Viewing on mobile",
      countryCode: "ca",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="-ml-12 grid place-items-center opacity-100 [grid-template-areas:'stack']">
      {notifications.map((n, i) => {
        const posIdx = (i + cycleIndex) % 6;
        const pos = positions[posIdx] ?? { x: 0, y: 0, opacity: 0 };
        const zIndex = 50 - posIdx * 10;

        return (
          <motion.div
            animate={{
              x: pos.x * 4,
              y: pos.y * 4,
              opacity: pos.opacity,
            }}
            className="[grid-area:stack]"
            initial={false}
            key={n.id}
            style={{ zIndex }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <div className="-skew-y-4 -rotate-x-14 relative flex h-auto w-[320px] rotate-y-20 select-none flex-col rounded-lg border border-border bg-background p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <CircleFlag className="size-4" countryCode={n.countryCode} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-left font-medium text-foreground text-sm leading-tight">
                    {n.title}
                  </p>
                  <p className="text-left text-muted-foreground text-xs">
                    {n.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
