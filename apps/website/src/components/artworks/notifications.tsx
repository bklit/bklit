"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface Position {
  x: number;
  y: number;
  opacity: number;
}

// 6 physical positions to match our 6 items for a seamless loop
const positions: Position[] = [
  { x: 0, y: 0, opacity: 0 }, // Position 1: FRONT (Entrance, Invisible)
  { x: 12, y: 10, opacity: 1 }, // Position 2: Visible
  { x: 24, y: 20, opacity: 1 }, // Position 3: Visible
  { x: 36, y: 30, opacity: 1 }, // Position 4: Visible
  { x: 48, y: 40, opacity: 0 }, // Position 5: BACK (Exit, Invisible)
  { x: 60, y: 50, opacity: 0 }, // Position 6: Hidden (Transition slot)
];

export const Notifications = () => {
  const [cycleIndex, setCycleIndex] = useState(0);

  const notifications = [
    { id: "item-1" },
    { id: "item-2" },
    { id: "item-3" },
    { id: "item-4" },
    { id: "item-5" },
    { id: "item-6" },
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
            <div className="-skew-y-4 -rotate-x-14 relative flex h-32 w-[320px] rotate-y-20 select-none items-center justify-center rounded-lg border border-border bg-background shadow-lg backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <span className="font-mono text-muted-foreground text-xs uppercase">
                  {n.id}
                </span>
                <div className="h-2 w-24 rounded-full bg-muted" />
                <div className="h-2 w-16 rounded-full bg-muted/50" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
