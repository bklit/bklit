"use client";

import { Button } from "@bklit/ui/components/button";
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
    <div className="container mx-auto flex max-w-6xl flex-col px-4">
      <div className="z-10 flex w-full flex-col items-center justify-center space-y-4 pt-32 pb-0 text-center sm:pt-42 md:z-auto">
        <motion.div
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          className="squircle hidden aspect-square w-24 items-center justify-center rounded-4xl bg-radial-[at_25%_25%] from-lime-200 to-emerald-500 sm:flex sm:rounded-[300px]"
          initial={{ opacity: 0, filter: "blur(10px)", y: 15 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <BklitLogo size={60} theme="light" variant="blended" />
        </motion.div>
        <motion.h1
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          className="from-amber-100 to-emerald-100 font-regular text-3xl leading-tight md:text-4xl dark:bg-linear-to-b dark:bg-clip-text dark:text-transparent"
          initial={{ opacity: 0, filter: "blur(10px)", y: 15 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          Beautiful Analytics
        </motion.h1>
        <motion.div
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          className="flex items-center gap-2 font-medium text-base dark:text-muted-foreground"
          initial={{ opacity: 0, filter: "blur(10px)", y: 15 }}
          layout="position"
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
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
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                className="absolute inset-0 text-card-foreground"
                exit={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                initial={{ opacity: 0, filter: "blur(10px)", y: -10 }}
                key={currentIndex}
                transition={{ duration: 0.5 }}
              >
                {competitors[currentIndex]}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </motion.div>
        <motion.div
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0, filter: "blur(10px)", y: 15 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        >
          <Button
            asChild
            data-bklit-event="view-demo-button"
            size="lg"
            variant="default"
          >
            <a
              href="https://app.bklit.com/signup?utm_source=website&utm_medium=homepage&utm_campaign=bklit"
              rel="noopener noreferrer"
              target="_blank"
            >
              View Demo
            </a>
          </Button>
          <Button
            asChild
            data-bklit-event="sign-up-button"
            size="lg"
            variant="ghost"
          >
            <a
              href="https://app.bklit.com/signup?utm_source=website&utm_medium=homepage&utm_campaign=bklit"
              rel="noopener noreferrer"
              target="_blank"
            >
              Sign Up
            </a>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
