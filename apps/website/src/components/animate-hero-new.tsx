"use client";

import { cn } from "@bklit/ui/lib/utils";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Hero } from "@/components/hero";

const FakeDashboard = dynamic(
  () => import("@/components/fake-dashboard").then((mod) => mod.FakeDashboard),
  { ssr: false }
);

export function AnimateHeroNew() {
  const [rotationComplete, setRotationComplete] = useState(false);

  return (
    <div className="relative flex max-h-[600px] flex-col overflow-hidden md:max-h-[1200px]">
      <div className="container mx-auto max-w-4xl overflow-visible px-4 md:max-w-6xl">
        <div className="grid h-[700px] w-full grid-cols-1 grid-rows-1 md:h-[1283px]">
          <div className="col-start-1 row-start-1 pt-16 md:pt-32">
            <div className="perspective-4000 perspective-origin-top-right preserve-3d relative h-full w-full overflow-visible">
              <motion.div
                animate={{
                  rotateX: 35,
                  rotateY: 10,
                  rotateZ: -20,
                  scale: 1,
                  translateZ: 20,
                  y: 0,
                }}
                className={cn(
                  "backface-hidden absolute inset-0 overflow-hidden rounded-xl",
                  "mt-48 aspect-1942/1283 w-full md:mt-24 md:h-[1283px] md:w-[1942px]"
                )}
                initial={{
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                  scale: 1,
                  translateZ: 0,
                  y: 300,
                }}
                onAnimationComplete={() => setRotationComplete(true)}
                style={{ transformStyle: "preserve-3d" }}
                transition={{
                  duration: 1.2,
                  ease: "easeInOut",
                  delay: 0.1,
                }}
              >
                <FakeDashboard animationStarted={rotationComplete} />
              </motion.div>
            </div>
          </div>
          <div className="relative col-start-1 row-start-1">
            <Hero />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-linear-to-b from-transparent via-transparent to-background" />
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-linear-to-r from-transparent via-transparent to-background" />
    </div>
  );
}
