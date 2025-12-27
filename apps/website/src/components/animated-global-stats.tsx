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
    if (!hasAnimated) return;

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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 grid-rows-1 gap-0">
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.8,
            delay: 0.8,
            ease: "easeOut",
          }}
          onAnimationComplete={() => setHasAnimated(true)}
          className="flex flex-col gap-1 border-r p-12"
        >
          <h3>Sessions recorded</h3>
          <div className="text-2xl font-bold">
            <NumberFlow value={stats.totalSessions} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.8,
            delay: 1.0,
            ease: "easeOut",
          }}
          className="flex flex-col gap-1 border-r p-12"
        >
          <h3>Pageviews recorded</h3>
          <div className="text-2xl font-bold">
            <NumberFlow value={stats.totalPageviews} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.8,
            delay: 1.2,
            ease: "easeOut",
          }}
          className="flex flex-col gap-1 border-r p-12"
        >
          <h3>Unique users recorded</h3>
          <div className="text-2xl font-bold">
            <NumberFlow value={stats.totalUniqueUsers} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.8,
            delay: 1.4,
            ease: "easeOut",
          }}
          className="flex flex-col gap-1 p-12"
        >
          <h3>Conversions recorded</h3>
          <div className="text-2xl font-bold">
            <NumberFlow value={stats.totalConversions} />
          </div>
        </motion.div>
      </div>
      <div className="text-center text-sm text-muted-foreground">
        <motion.p
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
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
