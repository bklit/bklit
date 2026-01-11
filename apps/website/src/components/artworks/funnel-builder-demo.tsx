"use client";

import { Badge } from "@bklit/ui/components/badge";
import { cn } from "@bklit/ui/lib/utils";
import { Eye, MousePointerClick } from "lucide-react";
import { motion } from "motion/react";

interface NodeProps {
  title: string;
  icon: React.ReactNode;
  className?: string;
  handlePosition?: "left" | "right";
}

const Node = ({ title, icon, className, handlePosition }: NodeProps) => (
  <div
    className={cn(
      "relative flex h-32 w-40 flex-col items-center justify-center gap-2 rounded-xl border border-bklit-500 bg-bklit-800 px-4 py-3 shadow-lg",
      className
    )}
  >
    {handlePosition === "left" && (
      <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-0 size-2 rounded-full border border-bklit-500 bg-background" />
    )}
    <div className="flex size-7 items-center justify-center rounded-lg bg-bklit-500/20 text-bklit-500">
      {icon}
    </div>
    <span className="font-medium text-slate-200 text-xs">{title}</span>
    <Badge className="px-1.5 py-0 text-[10px]" variant="code">
      /foobar
    </Badge>
    {handlePosition === "right" && (
      <div className="-translate-y-1/2 absolute top-1/2 right-0 size-2 translate-x-1/2 rounded-full border border-bklit-500 bg-background" />
    )}
  </div>
);

export const FunnelBuilderDemo = () => {
  return (
    <div className="relative flex h-[350px] w-full items-center justify-center overflow-hidden">
      {/* Dot grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.05]" />

      <div className="relative z-10 flex h-full w-full max-w-2xl items-center justify-between px-12">
        {/* Node 1: Landing Page */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="-translate-y-12 z-20"
          initial={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
        >
          <Node
            handlePosition="right"
            icon={<Eye size={16} />}
            title="Landing page"
          />
        </motion.div>

        {/* Animated Connection Path (S-curve) */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-12">
          <div className="relative h-full w-full max-w-2xl">
            <svg
              className="h-full w-full overflow-visible"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 576 350"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Animated connection path between nodes</title>
              {/* 
                Coordinates calculation:
                The SVG container width is max-w-2xl minus the px-12 on both sides.
                672 - 48 - 48 = 576px.
                
                Node 1 (Left):
                Handle Right is at the right edge of the node.
                Node width is 160px.
                Handle Right: x = 160, y = 175 - 48 = 127
                
                Node 2 (Right):
                Handle Left is at the left edge of the node.
                Node width is 160px.
                SVG width is 576. 
                Left edge of Node 2 starts at 576 - 160 = 416.
                Handle Left: x = 416, y = 175 + 48 = 223
              */}

              {/* Background static path (dimmed) */}
              <path
                d="M 160 127 C 288 127, 288 223, 416 223"
                stroke="var(--bklit-500)"
                strokeDasharray="6 4"
                strokeOpacity="0.1"
                strokeWidth="2"
              />

              {/* Animated dashed path */}
              <motion.path
                animate={{ strokeDashoffset: 0 }}
                d="M 160 127 C 288 127, 288 223, 416 223"
                initial={{ strokeDashoffset: 24 }}
                stroke="var(--bklit-500)"
                strokeDasharray="6 4"
                strokeWidth="2"
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />
            </svg>
          </div>
        </div>

        {/* Node 2: Add to cart */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="z-20 translate-y-12"
          initial={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Node
            handlePosition="left"
            icon={<MousePointerClick size={16} />}
            title="Add to cart"
          />
        </motion.div>
      </div>
    </div>
  );
};
