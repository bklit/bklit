"use client";

import { BklitLogo } from "@bklit/ui/icons/bklit";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const competitors = [
  "Google Analytics",
  "Plausible",
  "Fathom",
  "Umami",
  "PostHog",
];

export const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [widthIndex, setWidthIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % competitors.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setWidthIndex(currentIndex);
    }, 250);

    return () => clearTimeout(timeout);
  }, [currentIndex]);

  return (
    <div className="container mx-auto max-w-6xl flex flex-col px-4">
      <div className="flex flex-col items-center justify-center text-center w-full space-y-4 pt-26 sm:pt-42 pb-4">
        <div className="hidden sm:flex items-center justify-center w-24 aspect-square bg-radial-[at_25%_25%] from-lime-200 to-emerald-500 rounded-4xl sm:rounded-[300px] squircle">
          <BklitLogo size={60} variant="color" />
        </div>
        <h1 className="text-3xl md:text-4xl font-regular leading-tight dark:bg-clip-text dark:text-transparent dark:bg-linear-to-b from-amber-100 to-emerald-100">
          Purpose built Analytics
        </h1>
        <motion.div
          className="flex items-center gap-2 text-base font-medium dark:text-muted-foreground"
          layout="position"
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <div>A replacement for </div>
          <motion.div
            className="relative inline-block"
            layout
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <span className="invisible">{competitors[widthIndex]}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentIndex}
                initial={{ opacity: 0, filter: "blur(10px)", y: -10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 text-card-foreground"
              >
                {competitors[currentIndex]}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
