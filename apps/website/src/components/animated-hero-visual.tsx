"use client";

import { motion } from "motion/react";

export function AnimatedHeroVisual() {
  return (
    <div className="sm:perspective-[3000px] col-start-1 row-start-1 overflow-hidden">
      <div className="grid grid-cols-1 grid-rows-1 w-full h-auto aspect-1080/714 max-w-[1600px] mx-auto overflow-hidden ">
        <motion.div
          data-name="comp-layout"
          className="col-start-1 row-start-1 w-full h-auto aspect-1080/714 scale-150 origin-top-right"
          initial={{
            opacity: 0,
            filter: "blur(10px)",
            y: -60,
            x: 300,
            rotateX: 45,
            rotateY: 20,
            rotateZ: 336,
          }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            x: 300,
            rotateX: 45,
            rotateY: 20,
            rotateZ: 333,
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
        >
          <img src="/Layout.svg" alt="layout" />
        </motion.div>
        <motion.div
          data-name="comp-content"
          className="col-start-1 row-start-1 w-full h-auto aspect-1080/714 pt-[62px] pl-[232px] scale-150 origin-top-right"
          initial={{
            opacity: 0,
            filter: "blur(10px)",
            y: -60,
            x: 300,
            rotateX: 45,
            rotateY: 20,
            rotateZ: 336,
          }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            x: 300,
            rotateX: 45,
            rotateY: 20,
            rotateZ: 333,
          }}
          transition={{
            duration: 0.8,
            delay: 0.3,
            ease: "easeOut",
          }}
        >
          <img src="/Content.svg" alt="layout" />
        </motion.div>

        <div className="relative col-start-1 row-start-1 w-full h-auto aspect-1080/714 sm:-translate-y-2 sm:translate-x-[440px] sm:rotate-x-45 sm:rotate-y-20 sm:rotate-z-333 border rounded-lg scale-150 origin-top-right" />
        <div className="relative col-start-1 row-start-1 w-full h-auto aspect-1080/714 sm:translate-y-0 sm:translate-x-26 sm:rotate-x-45 sm:rotate-y-20 sm:rotate-z-333 scale-150 origin-top-right">
          <div className="absolute top-0 left-0 w-full h-full from-transparent to-background via-transparent via-90% bg-linear-to-b pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full from-transparent to-background to-70% via-transparent via-50% bg-linear-to-r pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
