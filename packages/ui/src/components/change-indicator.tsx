"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ChangeIndicatorProps {
  change: number | null;
  variant?: "default" | "minimal";
  size?: number;
  uniqueKey?: string;
}

export function ChangeIndicator({
  change,
  variant = "default",
  size = 14,
  uniqueKey = "change",
}: ChangeIndicatorProps) {
  if (change === null || change === 0) {
    return null;
  }

  const isPositive = change > 0;
  const Icon = isPositive ? ChevronUp : ChevronDown;
  const colorClass = isPositive ? "text-emerald-500" : "text-rose-500";

  // Animation variants based on direction
  const variants = isPositive
    ? {
        initial: { opacity: 0, y: 10, filter: "blur(2px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -10, filter: "blur(2px)" },
      }
    : {
        initial: { opacity: 0, y: -10, filter: "blur(2px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: 10, filter: "blur(2px)" },
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        animate="animate"
        exit="exit"
        initial="initial"
        key={`${uniqueKey}-${change.toFixed(2)}`}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        variants={variants}
      >
        <Icon className={colorClass} size={size} />
      </motion.div>
    </AnimatePresence>
  );
}
