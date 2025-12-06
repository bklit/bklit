import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import NumberFlow from "@number-flow/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  icon: LucideIcon;
  name: string;
  stat: string | number;
  suffix?: string;
}

interface StatsProps {
  items: StatItem[];
  variant?: "default" | "glass";
}

const getGridColsClass = (count: number): string => {
  const colsMap: Record<number, string> = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  };
  return colsMap[count] || "md:grid-cols-4";
};

export const Stats = ({ items, variant = "default" }: StatsProps) => {
  const gridColsClass = getGridColsClass(items.length);

  return (
    <div className={`grid gap-4 ${gridColsClass}`}>
      {items.map((item) => {
        const Icon = item.icon;
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
                <CardTitle> {item.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold">
                <NumberFlow
                  value={Number(item.stat)}
                  suffix={item.suffix || ""}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
