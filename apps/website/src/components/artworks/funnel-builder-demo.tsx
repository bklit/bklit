"use client";

import { Badge } from "@bklit/ui/components/badge";
import { cn } from "@bklit/ui/lib/utils";
import { Eye, MousePointerClick } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";

interface NodeProps {
  title: string;
  icon: React.ReactNode;
  className?: string;
  handlePosition?: "left" | "right";
  handleRef?: React.RefObject<HTMLDivElement | null>;
}

const Node = ({
  title,
  icon,
  className,
  handlePosition,
  handleRef,
}: NodeProps) => (
  <div
    className={cn(
      "relative flex h-32 w-40 flex-col items-center justify-center gap-2 rounded-xl border border-bklit-500 bg-bklit-800 px-4 py-3 shadow-lg",
      className
    )}
  >
    {handlePosition === "left" && (
      <div
        className="absolute top-1/2 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bklit-200 bg-background"
        ref={handleRef}
      />
    )}
    <div
      className={cn(
        "flex size-7 items-center justify-center rounded-lg bg-bklit-500/20 text-bklit-500",
        handlePosition === "left" ? "text-emerald-500" : "text-purple-500"
      )}
    >
      {icon}
    </div>
    <span className="font-medium text-slate-200 text-xs">{title}</span>
    <Badge className="px-1.5 py-0 text-[10px]" variant="code">
      {handlePosition === "left" ? "event" : "pageview"}
    </Badge>
    {handlePosition === "right" && (
      <div
        className="absolute top-1/2 right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full border border-bklit-200 bg-bklit-200"
        ref={handleRef}
      />
    )}
  </div>
);

export const FunnelBuilderDemo = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState("");

  useLayoutEffect(() => {
    let animationFrameId: number;

    const updatePath = () => {
      if (!(wrapperRef.current && sourceRef.current && targetRef.current)) {
        return;
      }

      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const sourceRect = sourceRef.current.getBoundingClientRect();
      const targetRect = targetRef.current.getBoundingClientRect();

      // Get exact visual center of the handles relative to the wrapper (outside transform)
      const startX = sourceRect.left + sourceRect.width / 2 - wrapperRect.left;
      const startY = sourceRect.top + sourceRect.height / 2 - wrapperRect.top;
      const endX = targetRect.left + targetRect.width / 2 - wrapperRect.left;
      const endY = targetRect.top + targetRect.height / 2 - wrapperRect.top;

      // Calculate S-curve (Cubic Bezier) with slight smoothing
      const midX = (startX + endX) / 2;
      const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
      setPath(d);

      animationFrameId = requestAnimationFrame(updatePath);
    };

    // Start tracking
    updatePath();

    window.addEventListener("resize", updatePath);
    return () => {
      window.removeEventListener("resize", updatePath);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const transformStyle = {
    transform: "rotateY(20deg) skewY(-10deg)",
    transformOrigin: "50% 50%",
  };

  return (
    <div className="relative h-[350px] w-full overflow-hidden" ref={wrapperRef}>
      {/* SVG path layer - outside 3D transform so it follows screen positions */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <svg
          className="h-full w-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Animated connection path between nodes</title>
          {path && (
            <>
              {/* Background static path (dimmed) */}
              <path
                d={path}
                stroke="var(--bklit-500)"
                strokeDasharray="6 4"
                strokeOpacity="0.1"
                strokeWidth="2"
              />

              {/* Animated dashed path */}
              <motion.path
                animate={{ strokeDashoffset: 0 }}
                d={path}
                initial={{ strokeDashoffset: 24 }}
                stroke="var(--bklit-200)"
                strokeDasharray="6 4"
                strokeWidth="2"
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />
            </>
          )}
        </svg>
      </div>

      {/* Perspective wrapper */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: "2000px" }}
      >
        <div
          className="relative flex h-full w-full items-center justify-center"
          style={transformStyle}
        >
          {/* Dot grid effect */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.05]" />

          <div className="relative z-10 flex h-full w-full max-w-2xl items-center justify-between px-12">
            {/* Node 1: Landing Page */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="z-20 -translate-x-12 -translate-y-12 md:-translate-x-0"
              initial={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Node
                handlePosition="right"
                handleRef={sourceRef}
                icon={<Eye size={16} />}
                title="Landing page"
              />
            </motion.div>

            {/* Node 2: Add to cart */}
            <motion.div
              animate={{
                opacity: 1,
                x: 0,
                y: [48, 48, 88, 8, 48, 48], // Looping drag movement
              }}
              className="z-20 -translate-x-4 md:translate-x-0"
              initial={{ opacity: 0, x: 20, y: 48 }}
              transition={{
                opacity: { duration: 0.5, delay: 0.2 },
                x: { duration: 0.5, delay: 0.2 },
                y: {
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  times: [0, 0.3, 0.45, 0.65, 0.8, 1],
                  ease: "easeInOut",
                },
              }}
            >
              <Node
                handlePosition="left"
                handleRef={targetRef}
                icon={<MousePointerClick size={16} />}
                title="Add to cart"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
