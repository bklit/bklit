import { cn } from "@bklit/ui/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { Badge } from "./badge";
import { ChangeIndicator } from "./change-indicator";

interface ProgressRowProps {
  label: string;
  value?: number;
  percentage?: number;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary";
  color?: string;
  asChild?: boolean;
  change?: number | null;
  changeUniqueKey?: string;
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
  change,
  changeUniqueKey,
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
        <div className="flex items-center gap-2">
          {value && <Badge variant="secondary">{value}</Badge>}
          {change !== undefined && (
            <ChangeIndicator
              change={change}
              uniqueKey={changeUniqueKey || label}
              size={12}
            />
          )}
        </div>
      </div>
      {percentage !== undefined && (
        <div className="flex h-0.5 bg-muted dark:bg-bklit-600">
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
