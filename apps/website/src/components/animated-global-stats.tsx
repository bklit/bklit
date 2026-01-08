"use client";

import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { GlobalStats } from "@/types/global-stats";

export function AnimatedGlobalStats() {
  const [stats, setStats] = useState<GlobalStats>({
    totalSessions: 0,
    totalPageviews: 0,
    totalUniqueUsers: 0,
    totalConversions: 0,
  });

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated) {
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/global-stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching global stats:", error);
      }
    };

    fetchStats();
  }, [hasAnimated]);

  return (
    <div className="flex flex-col gap-4 pt-8 sm:pt-0">
      <div className="grid grid-cols-4 grid-rows-1 gap-0">
        <motion.div
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="flex flex-col gap-1 p-4 sm:border-r sm:p-12"
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          onAnimationComplete={() => setHasAnimated(true)}
          transition={{
            duration: 0.8,
            delay: 0.8,
            ease: "easeOut",
          }}
        >
          <h3 className="text-xs sm:text-lg">Sessions recorded</h3>
          <div className="font-bold text-xl sm:text-2xl">
            <NumberFlow value={stats.totalSessions} />
          </div>
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="flex flex-col gap-1 p-4 sm:border-r sm:p-12"
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          transition={{
            duration: 0.8,
            delay: 1.0,
            ease: "easeOut",
          }}
        >
          <h3 className="text-xs sm:text-lg">Pageviews recorded</h3>
          <div className="font-bold text-xl sm:text-2xl">
            <NumberFlow value={stats.totalPageviews} />
          </div>
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="flex flex-col gap-1 p-4 sm:border-r sm:p-12"
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          transition={{
            duration: 0.8,
            delay: 1.2,
            ease: "easeOut",
          }}
        >
          <h3 className="text-xs sm:text-lg">Unique users</h3>
          <div className="font-bold text-xl sm:text-2xl">
            <NumberFlow value={stats.totalUniqueUsers} />
          </div>
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          className="flex flex-col gap-1 p-4 sm:p-12"
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          transition={{
            duration: 0.8,
            delay: 1.4,
            ease: "easeOut",
          }}
        >
          <h3 className="text-xs sm:text-lg">Conversions recorded</h3>
          <div className="font-bold text-xl sm:text-2xl">
            <NumberFlow value={stats.totalConversions} />
          </div>
        </motion.div>
      </div>
      <div className="text-center text-muted-foreground text-sm">
        <motion.p
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          transition={{
            duration: 0.8,
            delay: 2.6,
            ease: "easeOut",
          }}
        >
          We're live in 100+ countries
        </motion.p>
      </div>
    </div>
  );
}
