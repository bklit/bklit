import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Skeleton } from "@bklit/ui/components/skeleton";
import NumberFlow from "@number-flow/react";
import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  icon: LucideIcon;
  name: string;
  stat: string | number;
  suffix?: string;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  changeLoading?: boolean;
}

interface StatsProps {
  items: StatItem[];
  variant?: "default" | "glass";
}

const getGridColsClass = (count: number): string => {
  const colsMap: Record<number, string> = {
    1: "grid-cols-2 md:grid-cols-1",
    2: "grid-cols-2 md:grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-6",
  };
  return colsMap[count] || "md:grid-cols-4";
};

export const Stats = ({ items, variant = "default" }: StatsProps) => {
  const gridColsClass = getGridColsClass(items.length);

  const getChangeIcon = (changeType?: "increase" | "decrease" | "neutral") => {
    if (changeType === "increase") return ArrowUp;
    if (changeType === "decrease") return ArrowDown;
    return Minus;
  };

  const getChangeColor = (changeType?: "increase" | "decrease" | "neutral") => {
    if (changeType === "increase") return "text-green-600 dark:text-green-500";
    if (changeType === "decrease") return "text-red-600 dark:text-red-500";
    return "text-muted-foreground";
  };

  return (
    <div className={`grid gap-4 ${gridColsClass}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const ChangeIcon = getChangeIcon(item.changeType);
        const changeColor = getChangeColor(item.changeType);

        return (
          <Card
            key={item.name}
            className={cn(
              "gap-0",
              variant === "glass" && "bg-card/80 backdrop-blur-sm",
            )}
          >
            <CardHeader className="pb-1">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <CardTitle className="text-xs sm:text-lg">
                  {item.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <div className="text-4xl font-semibold">
                  <NumberFlow
                    value={Number(item.stat)}
                    suffix={item.suffix || ""}
                  />
                </div>
                {(item.changeLoading || item.change !== undefined) && (
                  <div className="flex items-center gap-1">
                    {item.changeLoading ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-sm font-medium transition-all duration-300",
                          changeColor,
                        )}
                      >
                        <ChangeIcon className="size-3" />
                        <span>
                          {item.change && item.change > 0 ? "+" : ""}
                          {item.change?.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
