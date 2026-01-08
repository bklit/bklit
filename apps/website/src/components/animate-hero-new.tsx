"use client";

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
    <div className="relative flex max-h-[1200px] flex-col overflow-hidden">
      <div className="container mx-auto max-w-6xl overflow-visible px-4">
        <div className="grid h-[1283px] w-full grid-cols-1 grid-rows-1">
          <div className="col-start-1 row-start-1 pt-32">
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
                className="backface-hidden absolute inset-0 mt-24 h-[1283px] w-[1942px] overflow-hidden rounded-xl"
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
