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

        // Defensive checks for API response structure
        if (
          !subscriptions ||
          typeof subscriptions !== "object" ||
          !subscriptions.result ||
          typeof subscriptions.result !== "object" ||
          !Array.isArray(subscriptions.result.items) ||
          subscriptions.result.items.length === 0
        ) {
          console.warn(
            `[Billing] Malformed or empty subscriptions response for org ${input.organizationId}`,
          );
        } else {
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

      // Count events since period start across all organization projects from ClickHouse
      const usageCounts = await Promise.all(
        projects.map(async (project) => {
          const [pageviews, trackedEvents] = await Promise.all([
            ctx.analytics.countPageViews(project.id, periodStart, new Date()),
            ctx.analytics.countTrackedEvents(
              project.id,
              periodStart,
              new Date(),
            ),
          ]);
          return { pageviews, trackedEvents };
        }),
      );

      // Sum up counts from all projects
      const pageViewCount = usageCounts.reduce(
        (sum, count) => sum + count.pageviews,
        0,
      );
      const trackedEventCount = usageCounts.reduce(
        (sum, count) => sum + count.trackedEvents,
        0,
      );

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

  members: {
    list: protectedProcedure
      .input(
        z.object({
          organizationId: z.string(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(15),
        }),
      )
      .query(async ({ input, ctx }) => {
        // Verify user is member of organization
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

        // Get total count
        const totalCount = await ctx.prisma.member.count({
          where: {
            organizationId: input.organizationId,
          },
        });

        // Get paginated members
        const members = await ctx.prisma.member.findMany({
          where: {
            organizationId: input.organizationId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        });

        const totalPages = Math.ceil(totalCount / input.limit);

        return {
          members,
          totalCount,
          totalPages,
          currentPage: input.page,
        };
      }),

    updateRole: protectedProcedure
      .input(
        z.object({
          organizationId: z.string(),
          memberId: z.string(),
          role: z.enum(["owner", "admin", "member"]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        // Verify user is admin or owner of organization
        const organization = await ctx.prisma.organization.findFirst({
          where: {
            id: input.organizationId,
            members: {
              some: {
                userId: ctx.session.user.id,
                role: {
                  in: ["admin", "owner"],
                },
              },
            },
          },
          include: {
            members: true,
          },
        });

        if (!organization) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Organization not found or you don't have permission to update roles",
          });
        }

        // Check if the member being updated exists
        const memberToUpdate = organization.members.find(
          (m) => m.id === input.memberId,
        );

        if (!memberToUpdate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Member not found",
          });
        }

        // Prevent changing the role of the last owner
        if (memberToUpdate.role === "owner") {
          const ownerCount = organization.members.filter(
            (m) => m.role === "owner",
          ).length;

          if (ownerCount === 1 && input.role !== "owner") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot change the role of the last owner",
            });
          }
        }

        // Update member role
        return ctx.prisma.member.update({
          where: { id: input.memberId },
          data: { role: input.role },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });
      }),

    remove: protectedProcedure
      .input(
        z.object({
          organizationId: z.string(),
          memberId: z.string(),
          confirmEmail: z.string().email(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        // Verify user is admin or owner of organization
        const organization = await ctx.prisma.organization.findFirst({
          where: {
            id: input.organizationId,
            members: {
              some: {
                userId: ctx.session.user.id,
                role: {
                  in: ["admin", "owner"],
                },
              },
            },
          },
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        });

        if (!organization) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Organization not found or you don't have permission to remove members",
          });
        }

        // Find the member to remove
        const memberToRemove = organization.members.find(
          (m) => m.id === input.memberId,
        );

        if (!memberToRemove) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Member not found",
          });
        }

        // Prevent removing yourself
        if (memberToRemove.userId === ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot remove yourself from the organization",
          });
        }

        // Verify email matches
        if (memberToRemove.user.email !== input.confirmEmail) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email does not match",
          });
        }

        // Prevent removing the last owner
        if (memberToRemove.role === "owner") {
          const ownerCount = organization.members.filter(
            (m) => m.role === "owner",
          ).length;

          if (ownerCount === 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot remove the last owner",
            });
          }
        }

        // Delete the member
        await ctx.prisma.member.delete({
          where: { id: input.memberId },
        });

        return { success: true };
      }),
  },
} satisfies TRPCRouterRecord;
