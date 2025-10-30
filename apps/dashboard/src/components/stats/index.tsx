import { Card, CardContent } from "@bklit/ui/components/card";
import NumberFlow from "@number-flow/react";
import type { LucideIcon } from "lucide-react";

interface StatItem {
  icon: LucideIcon;
  name: string;
  stat: string | number;
  suffix?: string;
}

interface StatsProps {
  items: StatItem[];
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

export const Stats = ({ items }: StatsProps) => {
  const gridColsClass = getGridColsClass(items.length);

  return (
    <div className={`grid gap-4 ${gridColsClass}`}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.name}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Icon className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <div className="text-2xl font-bold">
                    <NumberFlow
                      value={Number(item.stat)}
                      suffix={item.suffix || ""}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
