import { prisma } from "@bklit/db/client";
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
  const projectIds = projects.map((p) => p.id);

  // Count events across ALL projects in the organization
  const [pageViewCount, trackedEventCount] = await Promise.all([
    prisma.pageViewEvent.count({
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.trackedEvent.count({
      where: {
        projectId: { in: projectIds },
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
