import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure } from "../trpc";

// Plan limits for usage calculation
enum PlanType {
  FREE = "free",
  PRO = "pro",
}

const PLAN_LIMITS = {
  [PlanType.FREE]: {
    projectLimit: 1,
    teamMemberLimit: 1,
    eventLimit: 4000,
  },
  [PlanType.PRO]: {
    projectLimit: 5,
    teamMemberLimit: 5,
    eventLimit: 10000,
  },
};

function getPlanLimits(planType: PlanType) {
  return PLAN_LIMITS[planType];
}

export const organizationRouter = {
  fetch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          projects: true,
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const userMembership = organization.members.find(
        (member) => member.userId === ctx.session.user.id,
      );

      if (!userMembership) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return {
        ...organization,
        userMembership,
      };
    }),
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        projects: true,
        members: {
          include: {
            user: {
              select: { name: true, email: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        theme: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin or owner of organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: {
                in: ["admin", "owner"],
              },
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Organization not found or you don't have permission to update it",
        });
      }

      return ctx.prisma.organization.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.theme && { theme: input.theme }),
        },
      });
    }),

  updatePlan: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        plan: z.enum(["free", "pro"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin of organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: "admin", // Only admins can change plan
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found or user is not an admin",
        });
      }

      return ctx.prisma.organization.update({
        where: { id: input.id },
        data: { plan: input.plan },
      });
    }),

  getBillingSnapshot: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Verify user has access to this organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.organizationId,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found or you don't have access",
        });
      }

      // Get plan limits
      const planType =
        organization.plan === "pro" ? PlanType.PRO : PlanType.FREE;
      const planLimits = getPlanLimits(planType);

      // Get all projects for this organization
      const projects = await ctx.prisma.project.findMany({
        where: { organizationId: input.organizationId },
        select: { id: true },
      });
      const projectIds = projects.map((p) => p.id);

      // Fetch active subscriptions from Polar
      let billingData = {
        planName: "free" as const,
        status: "none" as const,
        currentPeriodEnd: null as Date | null,
        amount: null as number | null,
        currency: "usd",
        lastInvoiceDate: null as Date | null,
        lastInvoiceAmount: null as number | null,
        periodStart: null as Date | null,
      };

      try {
        const subscriptions = await ctx.authApi.subscriptions({
          query: {
            page: 1,
            limit: 1,
            active: true,
            referenceId: input.organizationId,
          },
          headers: ctx.headers,
        });

        const activeSubscription = subscriptions.result.items[0];

        if (activeSubscription && organization.plan === "pro") {
          // Pro plan with active subscription
          billingData = {
            planName: "pro" as const,
            status: (activeSubscription.status || "active") as
              | "active"
              | "cancelled",
            currentPeriodEnd: activeSubscription.currentPeriodEnd
              ? new Date(activeSubscription.currentPeriodEnd)
              : null,
            amount: activeSubscription.recurringInterval
              ? (activeSubscription.amount ?? null)
              : null,
            currency: activeSubscription.currency || "usd",
            lastInvoiceDate: activeSubscription.startedAt
              ? new Date(activeSubscription.startedAt)
              : null,
            lastInvoiceAmount: activeSubscription.amount ?? null,
            periodStart: activeSubscription.currentPeriodStart
              ? new Date(activeSubscription.currentPeriodStart)
              : activeSubscription.startedAt
                ? new Date(activeSubscription.startedAt)
                : null,
          };
        }
      } catch (error) {
        console.error("Error fetching billing snapshot:", error);
      }

      // Determine billing period start date
      let periodStart: Date;
      if (billingData.periodStart) {
        // Use subscription period start for Pro users
        periodStart = billingData.periodStart;
      } else {
        // Use calendar month for Free users or as fallback
        const now = new Date();
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodStart.setHours(0, 0, 0, 0);
      }

      // Count events since period start across all organization projects
      const [pageViewCount, trackedEventCount] = await Promise.all([
        ctx.prisma.pageViewEvent.count({
          where: {
            projectId: { in: projectIds },
            createdAt: { gte: periodStart },
          },
        }),
        ctx.prisma.trackedEvent.count({
          where: {
            projectId: { in: projectIds },
            createdAt: { gte: periodStart },
          },
        }),
      ]);

      const totalEvents = pageViewCount + trackedEventCount;
      const percentageUsed = (totalEvents / planLimits.eventLimit) * 100;

      return {
        ...billingData,
        usage: {
          pageviews: pageViewCount,
          trackedEvents: trackedEventCount,
          total: totalEvents,
          limit: planLimits.eventLimit,
          periodStart,
          percentageUsed,
        },
      };
    }),
} satisfies TRPCRouterRecord;
