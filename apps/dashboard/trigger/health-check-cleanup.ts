import { prisma } from "@bklit/db/client";
import { task } from "@trigger.dev/sdk/v3";

// Data retention: Keep health check data for 90 days
const RETENTION_DAYS = 90;

export const healthCheckCleanupTask = task({
  id: "health-check-cleanup",
  trigger: {
    type: "scheduled",
    cron: "0 2 * * *", // Daily at 2:00 AM UTC
  },
  retry: {
    maxAttempts: 3,
  },
  run: async (payload, { ctx }) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    console.log(
      `Starting health check cleanup: deleting records older than ${cutoffDate.toISOString()}`,
    );

    // Delete old health check records
    const result = await prisma.apiHealthCheck.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    console.log(
      `Health check cleanup completed: deleted ${result.count} records`,
    );

    return {
      success: true,
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
    };
  },
});
