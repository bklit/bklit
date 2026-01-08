"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { FakeDashboard } from "@/components/fake-dashboard";
import { Hero } from "@/components/hero";

export function AnimateHeroNew() {
  const [rotationComplete, setRotationComplete] = useState(false);

  return (
    <div className="flex flex-col relative max-h-[1200px] overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4 overflow-visible">
        <div className="w-full h-[1283px] grid grid-cols-1 grid-rows-1">
          <div className="col-start-1 row-start-1 pt-32">
            <div className="w-full h-full perspective-4000 perspective-origin-top-right preserve-3d relative overflow-visible">
              <motion.div
                className="backface-hidden rounded-xl overflow-hidden w-[1942px] h-[1283px] absolute inset-0 mt-24"
                style={{ transformStyle: "preserve-3d" }}
                initial={{
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                  scale: 1,
                  translateZ: 0,
                  y: 300,
                }}
                animate={{
                  rotateX: 35,
                  rotateY: 10,
                  rotateZ: -20,
                  scale: 1,
                  translateZ: 20,
                  y: 0,
                }}
                transition={{
                  duration: 1.2,
                  ease: "easeInOut",
                  delay: 0.1,
                }}
                onAnimationComplete={() => setRotationComplete(true)}
              >
                <FakeDashboard animationStarted={rotationComplete} />
              </motion.div>
            </div>
          </div>
          <div className="col-start-1 row-start-1 relative">
            <Hero />
          </div>
        </div>
      </div>
      <div className="absolute top-0 left-0 w-full h-full from-transparent to-background via-transparent bg-linear-to-b pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full from-transparent to-background via-transparent bg-linear-to-r pointer-events-none" />
    </div>
  );
}
