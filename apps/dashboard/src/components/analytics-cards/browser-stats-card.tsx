import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Compass } from "lucide-react";
import { getBrowserStats } from "@/actions/analytics-actions";
import { getBrowserIcon } from "@/lib/utils/get-browser-icon";
import { NoDataCard } from "./no-data-card";

interface BrowserStatsCardProps {
  projectId: string;
  userId: string;
}

export async function BrowserStatsCard({
  projectId,
  userId,
}: BrowserStatsCardProps) {
  const browserStats = await getBrowserStats({
    projectId,
    userId,
  });

  const totalVisits = browserStats.reduce((sum, stat) => sum + stat.count, 0);

  if (totalVisits === 0) {
    return (
      <NoDataCard
        title="Browser Usage"
        description="Page visits by browser"
        icon={<Compass size={16} />}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Browser Usage</CardTitle>
        <CardDescription>
          Page visits by browser ({totalVisits} total visits).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {browserStats.map((stat) => {
            const percentage = ((stat.count / totalVisits) * 100).toFixed(1);
            return (
              <div
                key={stat.browser}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  {getBrowserIcon(stat.browser)}
                  <span className="text-sm font-medium">{stat.browser}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {stat.count} visits
                  </span>
                  <span className="text-sm font-medium">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
