"use client";

import { cn } from "@bklit/ui/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface IconProps {
  className?: string;
  size?: number;
  variant?: "mono" | "color";
  theme?: "light" | "dark" | "system";
}

export function BklitLogo({
  className,
  size = 16,
  variant = "mono",
  theme = "system",
}: IconProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  return (
    <div
      className={cn(
        "relative aspect-square h-full min-h-4 w-full min-w-4",
        className
      )}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute top-0 left-1/2 flex h-2/3 w-2/3 -translate-x-1/2 rounded-full"
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
        className="absolute bottom-0 left-1/2 flex h-2/3 w-2/3 -translate-x-1/2 rounded-full"
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
