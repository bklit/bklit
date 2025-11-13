import { prisma } from "@bklit/db/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { PageHeader } from "@/components/page-header";
import { StatusChart } from "@/components/status-chart";

export default async function StatusPage() {
  let statusData = null;

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const healthChecks = await prisma.apiHealthCheck.findMany({
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    // Group by endpoint and date, keeping only the last check for each day
    const lastCheckByDay: Record<
      string,
      Record<string, { isHealthy: boolean; timestamp: Date }>
    > = {};

    for (const check of healthChecks) {
      const dateKey = check.timestamp.toISOString().split("T")[0] as string;
      const endpoint = check.endpoint;

      if (!lastCheckByDay[endpoint]) {
        lastCheckByDay[endpoint] = {};
      }

      // Keep only the last check for each day
      const existing = lastCheckByDay[endpoint][dateKey];
      if (
        !existing ||
        check.timestamp.getTime() > existing.timestamp.getTime()
      ) {
        lastCheckByDay[endpoint][dateKey] = {
          isHealthy: check.isHealthy,
          timestamp: check.timestamp,
        };
      }
    }

    // Generate all dates for the last 30 days
    const allDates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      allDates.push(date.toISOString().split("T")[0] as string);
    }

    const result: Record<
      string,
      {
        endpoint: string;
        uptimePercentage: number;
        totalChecks: number;
        healthyChecks: number;
        unhealthyChecks: number;
        dailyData: Array<{
          date: string;
          isHealthy: boolean;
        }>;
      }
    > = {};

    for (const [endpoint, dayData] of Object.entries(lastCheckByDay)) {
      // Generate daily data for all 30 days
      const dailyData = allDates.map((date) => {
        const lastCheck = dayData[date];
        return {
          date,
          isHealthy: lastCheck ? lastCheck.isHealthy : false, // Default to unhealthy if no data
        };
      });

      const healthyDays = dailyData.filter((day) => day.isHealthy).length;
      const totalDays = dailyData.length;
      const uptimePercentage = (healthyDays / totalDays) * 100;

      // Count total checks for stats
      const totalChecks = healthChecks.filter(
        (c) => c.endpoint === endpoint,
      ).length;
      const healthyChecks = healthChecks.filter(
        (c) => c.endpoint === endpoint && c.isHealthy,
      ).length;
      const unhealthyChecks = totalChecks - healthyChecks;

      result[endpoint] = {
        endpoint,
        uptimePercentage: Math.round(uptimePercentage * 100) / 100,
        totalChecks,
        healthyChecks,
        unhealthyChecks,
        dailyData,
      };
    }

    statusData = result;
  } catch (error) {
    console.error("Failed to fetch status data:", error);
    statusData = {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  return (
    <main className="w-full min-h-screen bklit-hero flex flex-col gap-32">
      <PageHeader />
      <div className="container mx-auto max-w-6xl flex flex-col px-4 py-12 space-y-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">API Status</h1>
          <p className="text-muted-foreground">
            Real-time health monitoring for our tracking APIs
          </p>
        </div>

        {statusData &&
        typeof statusData === "object" &&
        !("error" in statusData) ? (
          Object.entries(statusData).map(([endpoint, data]) => (
            <Card key={endpoint} className="space-y-4">
              <CardHeader>
                <CardTitle>{endpoint}</CardTitle>
                <CardDescription>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Uptime: {data.uptimePercentage}%</span>
                    <span>Total Checks: {data.totalChecks}</span>
                    <span>Healthy: {data.healthyChecks}</span>
                    <span>Unhealthy: {data.unhealthyChecks}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.dailyData.length > 0 && (
                  <StatusChart data={data.dailyData} />
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {statusData &&
              typeof statusData === "object" &&
              "error" in statusData
                ? String(statusData.error)
                : "No health check data available yet"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
