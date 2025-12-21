import { AnalyticsService } from "@bklit/analytics/service";
import { auth } from "@/auth/server";
import { prisma } from "@bklit/db/client";
import { headers } from "next/headers";
import { getPlanLimits, PlanType } from "./plans";

interface UsageCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  message?: string;
}

export async function checkEventLimit(
  organizationId: string,
): Promise<UsageCheckResult> {
  if (process.env.NODE_ENV === "development") {
    return { allowed: true, currentUsage: 0, limit: Infinity };
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      plan: true,
      members: {
        where: { role: "owner" },
        select: {
          user: {
            select: { role: true },
          },
        },
      },
    },
  });

  if (!organization) {
    return {
      allowed: false,
      currentUsage: 0,
      limit: 0,
      message: "Organization not found",
    };
  }

  // Check if any organization owner is super admin (bypasses limits)
  const hasSuperAdmin = organization.members.some(
    (member) => member.user.role === "super_admin",
  );
  if (hasSuperAdmin) {
    return { allowed: true, currentUsage: 0, limit: Infinity };
  }

  // Validate plan type and default to FREE if invalid
  const planValue = organization.plan;
  let validPlan: PlanType;

  if (Object.values(PlanType).includes(planValue as PlanType)) {
    validPlan = planValue as PlanType;
  } else {
    console.error(`Invalid plan type: ${planValue}, defaulting to FREE plan`);
    validPlan = PlanType.FREE;
  }

  const planLimits = getPlanLimits(validPlan);
  const eventLimit = planLimits.eventLimit;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Get all projects for this organization
  const projects = await prisma.project.findMany({
    where: { organizationId },
    select: { id: true },
  });

  // Count events across ALL projects in the organization from ClickHouse
  const analytics = new AnalyticsService();
  const usageResults = await Promise.allSettled(
    projects.map(async (project) => {
      try {
        const [pageviews, trackedEvents] = await Promise.all([
          analytics.countPageViews(project.id, startOfMonth, new Date()),
          analytics.countTrackedEvents(project.id, startOfMonth, new Date()),
        ]);
        return { pageviews, trackedEvents };
      } catch (error) {
        console.error(`Error counting usage for project ${project.id}:`, error);
        return { pageviews: 0, trackedEvents: 0 };
      }
    }),
  );

  // Sum up counts from all projects, handling failures gracefully
  const pageViewCount = usageResults.reduce((sum, result) => {
    if (result.status === "fulfilled") {
      return sum + result.value.pageviews;
    }
    return sum;
  }, 0);

  const trackedEventCount = usageResults.reduce((sum, result) => {
    if (result.status === "fulfilled") {
      return sum + result.value.trackedEvents;
    }
    return sum;
  }, 0);

  const totalEvents = pageViewCount + trackedEventCount;

  if (validPlan === PlanType.PRO) {
    try {
      const subscriptions = await auth.api.subscriptions({
        query: {
          page: 1,
          limit: 1,
          active: true,
          referenceId: organizationId,
        },
        headers: await headers(),
      });

      const activeSubscription = subscriptions?.result?.items?.[0];
      const isCanceled = activeSubscription?.cancelAtPeriodEnd || false;

      if (isCanceled && totalEvents >= eventLimit) {
        return {
          allowed: false,
          currentUsage: totalEvents,
          limit: eventLimit,
          message: `Your Pro subscription is canceled. Event limit of ${eventLimit.toLocaleString()} reached.`,
        };
      }
    } catch {
      // If we can't check subscription status, allow (fail open)
    }
  }

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
