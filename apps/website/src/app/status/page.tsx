import { prisma } from "@bklit/db/client";
import { Badge } from "@bklit/ui/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { cn } from "@bklit/ui/lib/utils";
import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusChart } from "@/components/status-chart";

export const metadata: Metadata = {
  title: "Bklit API Status",
  description: "Real-time health monitoring for our tracking APIs",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        isCurrentlyHealthy: boolean;
        dailyData: Array<{
          date: string;
          isHealthy: boolean | null; // null means no data
        }>;
      }
    > = {};

    for (const [endpoint, dayData] of Object.entries(lastCheckByDay)) {
      // Generate daily data for all 30 days
      const dailyData = allDates.map((date) => {
        const lastCheck = dayData[date];
        return {
          date,
          isHealthy: lastCheck ? lastCheck.isHealthy : null, // null means no data
        };
      });

      // Only count days with actual data for uptime calculation
      const daysWithData = dailyData.filter((day) => day.isHealthy !== null);
      const healthyDays = dailyData.filter(
        (day) => day.isHealthy === true
      ).length;
      const uptimePercentage =
        daysWithData.length > 0
          ? (healthyDays / daysWithData.length) * 100
          : 100;

      // Count total checks for stats
      const totalChecks = healthChecks.filter(
        (c) => c.endpoint === endpoint
      ).length;
      const healthyChecks = healthChecks.filter(
        (c) => c.endpoint === endpoint && c.isHealthy
      ).length;
      const unhealthyChecks = totalChecks - healthyChecks;

      // Get the most recent check to determine current status
      const endpointChecks = healthChecks
        .filter((c) => c.endpoint === endpoint)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const mostRecentCheck = endpointChecks[0];
      const isCurrentlyHealthy = mostRecentCheck
        ? mostRecentCheck.isHealthy
        : false;

      result[endpoint] = {
        endpoint,
        uptimePercentage: Math.round(uptimePercentage * 100) / 100,
        totalChecks,
        healthyChecks,
        unhealthyChecks,
        isCurrentlyHealthy,
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
    <main className="flex min-h-screen w-full flex-col gap-32">
      <PageHeader />
      <div className="container mx-auto flex max-w-3xl flex-col space-y-12 px-4 py-26">
        <SectionHeader
          description="Real-time health monitoring for our tracking APIs"
          title="API Status"
        >
          <div className="flex w-full items-center justify-center">
            {statusData &&
            typeof statusData === "object" &&
            !("error" in statusData) ? (
              (() => {
                const allHealthy = Object.values(statusData).every(
                  (data) => data.isCurrentlyHealthy
                );
                return (
                  <Badge className="gap-2" size="lg" variant="outline">
                    <span
                      className={cn(
                        "inline-flex size-2 rounded-full",
                        allHealthy ? "bg-teal-700" : "bg-destructive"
                      )}
                    />
                    {allHealthy
                      ? "All systems operational"
                      : "Some systems experiencing issues"}
                  </Badge>
                );
              })()
            ) : (
              <Badge size="lg" variant="secondary">
                Status unknown
              </Badge>
            )}
          </div>
        </SectionHeader>

        {statusData &&
        typeof statusData === "object" &&
        !("error" in statusData) ? (
          Object.entries(statusData).map(([endpoint, data]) => (
            <Card className="space-y-4" key={endpoint}>
              <CardHeader>
                <CardTitle>
                  <code>{endpoint}</code>
                </CardTitle>
                <CardAction>
                  <Badge className="gap-2" size="lg" variant="outline">
                    <span
                      className={cn(
                        "inline-flex size-2 rounded-full",
                        data.isCurrentlyHealthy
                          ? "bg-teal-700"
                          : "bg-destructive"
                      )}
                    />
                    <span className="text-sm">
                      {data.isCurrentlyHealthy ? "Operational" : "Degraded"}
                    </span>
                  </Badge>
                </CardAction>
                <CardDescription>
                  <div className="grid grid-cols-2 gap-4 text-muted-foreground text-sm sm:flex">
                    <Badge
                      variant={
                        data.uptimePercentage >= 90 ? "success" : "destructive"
                      }
                    >
                      Uptime {data.uptimePercentage}%
                    </Badge>
                    <Badge variant="secondary">
                      Total Checks {data.totalChecks}
                    </Badge>
                    <Badge
                      variant={data.healthyChecks > 0 ? "success" : "secondary"}
                    >
                      Healthy {data.healthyChecks}
                    </Badge>
                    <Badge
                      variant={
                        data.unhealthyChecks > 0 ? "destructive" : "success"
                      }
                    >
                      Unhealthy {data.unhealthyChecks}
                    </Badge>
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
          <div className="py-12 text-center">
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
      <Footer />
    </main>
  );
}
