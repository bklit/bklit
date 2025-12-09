"use client";

import { cn } from "@bklit/ui/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface IconProps {
  className?: string;
  size?: number;
  variant?: "mono" | "color";
}

export function BklitLogo({
  className,
  size = 16,
  variant = "mono",
}: IconProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "w-full h-full aspect-square min-w-4 min-h-4 relative",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <div
        className="flex w-2/3 h-2/3 absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, #D9D9D9, #000000)",
          ...(variant === "color" && { mixBlendMode: "color-burn" }),
          ...(variant === "mono" &&
            isDark && {
              mixBlendMode: "plus-lighter",
              background: "conic-gradient(from 0deg, #000000, #D9D9D9)",
            }),
          transform: "translate3d(0,0,0)",
        }}
      />
      <div
        className="flex w-2/3 h-2/3 absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          background: "conic-gradient(from 180deg, #D9D9D9, #000000)",
          transform: "translate3d(0,0,0)",
          ...(variant === "color" && { mixBlendMode: "color-burn" }),
          ...(variant === "mono" &&
            isDark && {
              mixBlendMode: "plus-lighter",
              background: "conic-gradient(from 180deg, #000000, #D9D9D9)",
            }),
          ...(variant === "mono" && !isDark && { mixBlendMode: "multiply" }),
        }}
      />
    </div>
  );
}
