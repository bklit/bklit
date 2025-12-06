import { cn } from "@bklit/ui/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { Badge } from "./badge";

interface ProgressRowProps {
  label: string;
  value?: number;
  percentage?: number;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary";
  color?: string;
  asChild?: boolean;
}

export const ProgressRow = ({
  label,
  value,
  percentage = 0,
  icon,
  className,
  variant = "default",
  color,
  asChild = false,
}: ProgressRowProps) => {
  if (percentage < 0) {
    percentage = 0;
  }
  if (percentage > 100) {
    percentage = 100;
  }
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={cn("flex flex-col group", className)}
      data-percentage={percentage.toFixed(2)}
    >
      <div className="flex flex-row justify-between items-center py-1 px-1.5 group-hover:bg-muted">
        <div className="flex items-center gap-2">
          {icon && icon}
          <span
            className={cn(
              "font-medium text-sm",
              variant === "secondary" &&
                "font-mono text-xs text-muted-foreground",
            )}
          >
            {label}
          </span>
        </div>
        {value && <Badge variant="secondary">{value}</Badge>}
      </div>
      {percentage && (
        <div className="flex h-0.5 bg-muted">
          <div
            className={cn(
              "flex h-full rounded-full transition-all",
              !color && "bg-primary",
            )}
            style={{
              width: `${percentage}%`,
              ...(color && { backgroundColor: color }),
            }}
          />
        </div>
      )}
    </Comp>
  );
};
