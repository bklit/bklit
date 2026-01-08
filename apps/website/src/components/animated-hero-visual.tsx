"use client";

import { motion } from "motion/react";

export function AnimatedHeroVisual() {
  return (
    <div className="hidden sm:block perspective-[3000px] col-start-1 row-start-1 overflow-hidden">
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
        <motion.div
          data-name="comp-live-user"
          className="col-start-1 row-start-1 w-full h-auto aspect-1080/714 scale-150 origin-top-right relative"
          initial={{
            opacity: 0,
            filter: "blur(10px)",
            y: -60,
            x: 300,
            rotateX: 40,
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
            duration: 0.66,
            delay: 0.6,
            ease: "easeOut",
          }}
        >
          <div className="absolute top-[1.5%] left-[21.5%] text-[0.93cqw] text-muted-foreground">
            <div className="flex items-center gap-[0.5em]">
              <div className="size-2.5 relative">
                <div className="absolute top-0 left-0 size-full rounded-full bg-red-400 animate-ping" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[66%] rounded-full bg-red-400" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[233%] rounded-full bg-red-400 pointer-events-none blur-xl opacity-80" />
              </div>
              <span className="text-[clamp(8px,0.68vw,11px)]">1 Live user</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
          className="relative col-start-1 row-start-1 w-full h-auto aspect-1080/714 -translate-y-2 translate-x-[440px] rotate-x-45 rotate-y-20 rotate-z-333 border rounded-lg scale-150 origin-top-right"
        />
        <div className="relative col-start-1 row-start-1 w-full h-auto aspect-1080/714 translate-y-0 translate-x-26 rotate-x-45 rotate-y-20 rotate-z-333 scale-150 origin-top-right">
          <div className="absolute top-0 left-0 w-full h-full from-transparent to-background via-transparent via-90% bg-linear-to-b pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full from-transparent to-background to-70% via-transparent via-50% bg-linear-to-r pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
