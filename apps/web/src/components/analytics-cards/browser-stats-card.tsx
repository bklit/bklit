"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/auth/client";
import { getBrowserStats } from "@/actions/analytics-actions";
import { BrowserIcon } from "@/components/icons/browser";
import { ChromeIcon } from "@/components/icons/chrome";
import { EdgeIcon } from "@/components/icons/edge";
import { FirefoxIcon } from "@/components/icons/firefox";
import { SafariIcon } from "@/components/icons/safari";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/contexts/project-context";
import type { BrowserStats } from "@/types/analytics";

// Function to get the appropriate icon for each browser
function getBrowserIcon(browser: string) {
  switch (browser.toLowerCase()) {
    case "chrome":
      return <ChromeIcon size={16} />;
    case "firefox":
      return <FirefoxIcon size={16} />;
    case "safari":
      return <SafariIcon size={16} />;
    case "edge":
      return <EdgeIcon size={16} />;
    default:
      return <BrowserIcon size={16} />;
  }
}

export function BrowserStatsCard() {
  const { currentSiteId } = useProject();
  const { data: session } = authClient.useSession();

  const { data: browserStats, isLoading } = useQuery<BrowserStats[]>({
    queryKey: ["browser-stats", currentSiteId],
    queryFn: () =>
      getBrowserStats({
        siteId: currentSiteId || "",
        userId: session?.user?.id || "",
      }),
    enabled: !!currentSiteId && !!session?.user?.id,
  });

  if (isLoading || !browserStats) {
    return <BrowserStatsCardSkeleton />;
  }

  const totalVisits = browserStats.reduce((sum, stat) => sum + stat.count, 0);

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

export function BrowserStatsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
