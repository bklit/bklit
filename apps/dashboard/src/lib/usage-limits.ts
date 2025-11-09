import { prisma } from "@bklit/db/client";
import { getPlanLimits, type PlanType } from "./plans";

interface UsageCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  message?: string;
}

export async function checkEventLimit(
  organizationId: string,
  projectId: string,
): Promise<UsageCheckResult> {
  if (process.env.NODE_ENV === "development") {
    return { allowed: true, currentUsage: 0, limit: Infinity };
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  });

  if (!organization) {
    return {
      allowed: false,
      currentUsage: 0,
      limit: 0,
      message: "Organization not found",
    };
  }

  const planLimits = getPlanLimits(organization.plan as PlanType);
  const eventLimit = planLimits.eventLimit;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [pageViewCount, trackedEventCount] = await Promise.all([
    prisma.pageViewEvent.count({
      where: {
        projectId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.trackedEvent.count({
      where: {
        projectId,
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  const totalEvents = pageViewCount + trackedEventCount;

  if (totalEvents >= eventLimit) {
    return {
      allowed: false,
      currentUsage: totalEvents,
      limit: eventLimit,
      message: `Monthly event limit of ${eventLimit.toLocaleString()} reached. Upgrade your plan for more events.`,
    };
  }

  return {
    allowed: true,
    currentUsage: totalEvents,
    limit: eventLimit,
  };
}
