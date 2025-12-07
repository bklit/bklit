import { cn } from "@bklit/ui/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
  variant?: "light" | "dark";
}

export function BklitLogo({
  className,
  size = 16,
  variant = "light",
}: IconProps) {
  return (
    <div
      className={cn(
        "w-full h-full aspect-square min-w-4 min-h-4 relative",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <div
        className={cn(
          "w-2/3 h-2/3 -rotate-180 bg-conic-180 from-white to-black absolute top-0 left-1/2 -translate-x-1/2 rounded-full",
          variant === "dark" &&
            "bg-conic-180 from-white to-black mix-blend-color-burn",
        )}
      />
      <div
        className={cn(
          "w-2/3 h-2/3 bg-conic-180 from-white to-black absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full mix-blend-color-dodge",
          variant === "dark" && "mix-blend-color-burn",
        )}
      />
    </div>
  );
}
