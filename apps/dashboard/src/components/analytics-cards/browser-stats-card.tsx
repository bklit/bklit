"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { PieDonut } from "@bklit/ui/components/charts/pie-donut";

import { Compass } from "lucide-react";
import { useEffect, useState } from "react";
import { getBrowserStats } from "@/actions/analytics-actions";
import { NoDataCard } from "./no-data-card";

interface BrowserStatsCardProps {
  projectId: string;
  userId: string;
}

export function BrowserStatsCard({ projectId, userId }: BrowserStatsCardProps) {
  const [browserStats, setBrowserStats] = useState<
    { browser: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  // no local hover needed when using PieDonut

  useEffect(() => {
    const fetchBrowserStats = async () => {
      try {
        const stats = await getBrowserStats({
          projectId,
          userId,
        });
        setBrowserStats(stats);
      } catch (error) {
        console.error("Failed to fetch browser stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrowserStats();
  }, [projectId, userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Browser Usage</CardTitle>
          <CardDescription>Loading browser statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

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

  // Create chart config for browsers

  // Prepare chart data
  const chartData = browserStats.map((stat) => ({
    name: stat.browser.toLowerCase().replace(/\s+/g, "_"),
    value: stat.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Browser Usage</CardTitle>
        <CardDescription>
          Page visits by browser ({totalVisits} total visits).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PieDonut
          data={chartData}
          centerLabel={{ showTotal: true, suffix: "hello" }}
          className="min-h-[200px] w-full"
        />
      </CardContent>
    </Card>
  );
}
