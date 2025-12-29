import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Skeleton } from "@bklit/ui/components/skeleton";
import NumberFlow from "@number-flow/react";
import type { LucideIcon } from "lucide-react";
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

  const getChangeVariant = (
    changeType?: "increase" | "decrease" | "neutral",
  ): "success" | "destructive" | "secondary" => {
    if (changeType === "increase") return "success";
    if (changeType === "decrease") return "destructive";
    return "secondary";
  };

  return (
    <div className={`grid gap-4 ${gridColsClass}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const changeVariant = getChangeVariant(item.changeType);

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
              <div className="flex flex-row gap-3 items-center">
                <div className="text-4xl font-semibold leading-9">
                  <NumberFlow
                    value={Number(item.stat)}
                    suffix={item.suffix || ""}
                  />
                </div>
                {(item.changeLoading || item.change !== undefined) && (
                  <div className="flex items-center">
                    {item.changeLoading ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <Badge variant={changeVariant}>
                        <span>
                          {item.change && item.change > 0
                            ? "+ "
                            : item.change && item.change < 0
                              ? "- "
                              : ""}
                          {Math.abs(item.change ?? 0).toFixed(1)}%
                        </span>
                      </Badge>
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
