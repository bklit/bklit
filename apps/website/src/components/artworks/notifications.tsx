"use client";

import { Slider } from "@bklit/ui/components/slider";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { CircleFlag } from "react-circle-flags";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  countryCode: string;
}

interface NotificationsProps {
  items: NotificationItem[];
  debug?: boolean;
}

interface Position {
  x: number;
  y: number;
  opacity: number;
}

export const Notifications = ({ items, debug = false }: NotificationsProps) => {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [skewY, setSkewY] = useState(5);
  const [rotateX, setRotateX] = useState(15);
  const [rotateY, setRotateY] = useState(20);
  const [rotateZ, setRotateZ] = useState(0);
  const [spacing, setSpacing] = useState(0.8);

  const itemCount = items.length;

  // Dynamically calculate positions based on spacing
  const dynamicPositions: Position[] = [
    { x: -24 * spacing, y: 20 * spacing, opacity: 0 }, // Position 1: FRONT
    { x: -12 * spacing, y: 10 * spacing, opacity: 1 }, // Position 2: Visible
    { x: 0, y: 0, opacity: 1 }, // Position 3: Visible
    { x: 12 * spacing, y: -10 * spacing, opacity: 1 }, // Position 4: Visible
    { x: 24 * spacing, y: -20 * spacing, opacity: 0 }, // Position 5: BACK
    { x: 36 * spacing, y: -30 * spacing, opacity: 0 }, // Position 6: Hidden
  ];

  useEffect(() => {
    if (itemCount === 0) {
      return;
    }
    const interval = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % itemCount);
    }, 3000);
    return () => clearInterval(interval);
  }, [itemCount]);

  if (itemCount === 0) {
    return null;
  }

  return (
    <>
      {debug && (
        <div className="fixed right-8 bottom-8 z-50 flex w-72 flex-col gap-4 rounded-xl border border-border bg-background/80 p-6 shadow-2xl backdrop-blur-md">
          <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
            3D Composition Controls
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between font-medium text-[10px] text-muted-foreground uppercase">
                <span>Skew Y</span>
                <span>{skewY}°</span>
              </div>
              <Slider
                max={20}
                min={-20}
                onValueChange={([v]) => setSkewY(v ?? 0)}
                step={1}
                value={[skewY]}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-medium text-[10px] text-muted-foreground uppercase">
                <span>Rotate X</span>
                <span>{rotateX}°</span>
              </div>
              <Slider
                max={45}
                min={-45}
                onValueChange={([v]) => setRotateX(v ?? 0)}
                step={1}
                value={[rotateX]}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-medium text-[10px] text-muted-foreground uppercase">
                <span>Rotate Y</span>
                <span>{rotateY}°</span>
              </div>
              <Slider
                max={45}
                min={-45}
                onValueChange={([v]) => setRotateY(v ?? 0)}
                step={1}
                value={[rotateY]}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-medium text-[10px] text-muted-foreground uppercase">
                <span>Rotate Z</span>
                <span>{rotateZ}°</span>
              </div>
              <Slider
                max={45}
                min={-45}
                onValueChange={([v]) => setRotateZ(v ?? 0)}
                step={1}
                value={[rotateZ]}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-medium text-[10px] text-muted-foreground uppercase">
                <span>Spacing</span>
                <span>{Math.round(spacing * 100)}%</span>
              </div>
              <Slider
                max={2}
                min={0.1}
                onValueChange={([v]) => setSpacing(v ?? 1)}
                step={0.1}
                value={[spacing]}
              />
            </div>
          </div>
        </div>
      )}

      <div className="md:-ml-12 grid place-items-center opacity-100 [grid-template-areas:'stack']">
        {items.map((n, i) => {
          const posIdx = (i + cycleIndex) % itemCount;
          // We only have 6 visual positions defined
          const pos = dynamicPositions[posIdx] ?? { x: 0, y: 0, opacity: 0 };
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
              <div
                className="relative flex h-auto w-[320px] select-none flex-col rounded-lg border border-border bg-background p-4 shadow-lg"
                style={{
                  transform: `skewY(${skewY}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <CircleFlag
                      className="size-4"
                      countryCode={n.countryCode}
                    />
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
    </>
  );
};
