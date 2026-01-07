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
  if (change === null || change === 0) return null;

  const isPositive = change > 0;
  const Icon = isPositive ? ChevronUp : ChevronDown;
  const colorClass = isPositive ? "text-emerald-500" : "text-rose-500";

  // Animation variants based on direction
  const variants = isPositive
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
      }
    : {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 },
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${uniqueKey}-${change.toFixed(2)}`}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <Icon size={size} className={colorClass} />
      </motion.div>
    </AnimatePresence>
  );
}

