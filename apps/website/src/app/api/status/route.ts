import { prisma } from "@bklit/db/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all health checks from the last 30 days
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

    // Group by endpoint and date
    const groupedData: Record<
      string,
      Record<
        string,
        {
          date: string;
          totalChecks: number;
          healthyChecks: number;
          unhealthyChecks: number;
          avgResponseTime: number;
          statusCodes: Record<number, number>;
          incidents: Array<{
            startTime: string;
            endTime: string;
            duration: number;
            errorMessage?: string;
          }>;
        }
      >
    > = {};

    // Initialize structure
    for (const check of healthChecks) {
      const dateKey = check.timestamp.toISOString().split("T")[0];
      if (!groupedData[check.endpoint]) {
        groupedData[check.endpoint] = {};
      }
      if (!groupedData[check.endpoint][dateKey]) {
        groupedData[check.endpoint][dateKey] = {
          date: dateKey,
          totalChecks: 0,
          healthyChecks: 0,
          unhealthyChecks: 0,
          avgResponseTime: 0,
          statusCodes: {},
          incidents: [],
        };
      }
    }

    // Process checks
    for (const check of healthChecks) {
      const dateKey = check.timestamp.toISOString().split("T")[0];
      const dayData = groupedData[check.endpoint][dateKey];

      dayData.totalChecks++;
      if (check.isHealthy) {
        dayData.healthyChecks++;
      } else {
        dayData.unhealthyChecks++;
      }

      // Track status codes
      dayData.statusCodes[check.statusCode] =
        (dayData.statusCodes[check.statusCode] || 0) + 1;

      // Calculate average response time
      dayData.avgResponseTime =
        (dayData.avgResponseTime * (dayData.totalChecks - 1) +
          check.responseTimeMs) /
        dayData.totalChecks;
    }

    // Calculate uptime percentage and identify incidents
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
          totalChecks: number;
          healthyChecks: number;
          unhealthyChecks: number;
          uptimePercentage: number;
          avgResponseTime: number;
          statusCodes: Record<number, number>;
        }>;
        recentIncidents: Array<{
          startTime: string;
          endTime: string;
          duration: number;
          errorMessage?: string;
        }>;
      }
    > = {};

    // Detect incidents (consecutive unhealthy checks)
    const incidents: Record<
      string,
      Array<{ start: Date; end?: Date; error?: string }>
    > = {};
    
    // Track last timestamp per endpoint for closing open incidents
    const lastTimestampByEndpoint: Record<string, Date> = {};

    for (const check of healthChecks) {
      if (!incidents[check.endpoint]) {
        incidents[check.endpoint] = [];
      }

      // Track the last timestamp for each endpoint
      lastTimestampByEndpoint[check.endpoint] = check.timestamp;

      if (!check.isHealthy) {
        const lastIncident =
          incidents[check.endpoint][incidents[check.endpoint].length - 1];
        if (!lastIncident || lastIncident.end) {
          // Start new incident
          incidents[check.endpoint].push({
            start: check.timestamp,
            error: check.errorMessage || undefined,
          });
        } else {
          // Continue existing incident - don't set end, just update error if needed
          if (check.errorMessage && !lastIncident.error) {
            lastIncident.error = check.errorMessage;
          }
        }
      } else {
        // Health recovered - close any open incident
        const lastIncident =
          incidents[check.endpoint][incidents[check.endpoint].length - 1];
        if (lastIncident && !lastIncident.end) {
          lastIncident.end = check.timestamp;
        }
      }
    }

    // Close any open incidents with the last known timestamp for that endpoint
    for (const [endpoint, endpointIncidents] of Object.entries(incidents)) {
      const lastIncident = endpointIncidents[endpointIncidents.length - 1];
      if (lastIncident && !lastIncident.end) {
        const lastTimestamp = lastTimestampByEndpoint[endpoint];
        if (lastTimestamp) {
          lastIncident.end = lastTimestamp;
        }
      }
    }

    // Build final result
    for (const [endpoint, dailyData] of Object.entries(groupedData)) {
      const allDays = Object.values(dailyData);
      const totalChecks = allDays.reduce(
        (sum, day) => sum + day.totalChecks,
        0,
      );
      const healthyChecks = allDays.reduce(
        (sum, day) => sum + day.healthyChecks,
        0,
      );
      const unhealthyChecks = allDays.reduce(
        (sum, day) => sum + day.unhealthyChecks,
        0,
      );
      const uptimePercentage =
        totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 100;

      const endpointIncidents = incidents[endpoint] || [];
      const recentIncidents = endpointIncidents
        .filter((inc) => inc.end)
        .map((inc) => ({
          startTime: inc.start.toISOString(),
          endTime: inc.end!.toISOString(),
          duration: inc.end!.getTime() - inc.start.getTime(),
          errorMessage: inc.error,
        }))
        .slice(-10); // Last 10 incidents

      result[endpoint] = {
        endpoint,
        uptimePercentage: Math.round(uptimePercentage * 100) / 100,
        totalChecks,
        healthyChecks,
        unhealthyChecks,
        dailyData: allDays.map((day) => ({
          date: day.date,
          totalChecks: day.totalChecks,
          healthyChecks: day.healthyChecks,
          unhealthyChecks: day.unhealthyChecks,
          uptimePercentage:
            day.totalChecks > 0
              ? Math.round((day.healthyChecks / day.totalChecks) * 100 * 100) /
                100
              : 100,
          avgResponseTime: Math.round(day.avgResponseTime),
          statusCodes: day.statusCodes,
        })),
        recentIncidents,
      };
    }

    return NextResponse.json(result, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching status data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch status data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
