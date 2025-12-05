import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { endOfDay, startOfDay } from "../lib/date-utils";
import { protectedProcedure } from "../trpc";

const stepSchema = z.object({
  type: z.enum(["pageview", "event"]),
  name: z.string().min(1),
  url: z.string().optional(),
  eventName: z.string().optional(),
  eventCode: z.string().optional(),
  positionX: z.number(),
  positionY: z.number(),
});

export const funnelRouter = {
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              createdAt: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      // Get total count for pagination
      const totalCount = await ctx.prisma.funnel.count({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
      });

      // Get paginated funnels
      const funnels = await ctx.prisma.funnel.findMany({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
        include: {
          steps: {
            orderBy: {
              stepOrder: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });

      return {
        funnels,
        totalCount,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(totalCount / input.limit),
          hasNextPage: input.page < Math.ceil(totalCount / input.limit),
          hasPreviousPage: input.page > 1,
        },
      };
    }),

  getById: protectedProcedure
    .input(
      z.object({
        funnelId: z.string(),
        projectId: z.string(),
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const funnel = await ctx.prisma.funnel.findFirst({
        where: {
          id: input.funnelId,
          projectId: input.projectId,
        },
        include: {
          steps: {
            orderBy: {
              stepOrder: "asc",
            },
          },
        },
      });

      if (!funnel) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return funnel;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        projectId: z.string(),
        organizationId: z.string(),
        steps: z.array(stepSchema).min(1),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Sort steps by positionX (left to right) to calculate stepOrder
      const sortedSteps = [...input.steps].sort((a, b) => a.positionX - b.positionX);

      return ctx.prisma.funnel.create({
        data: {
          name: input.name,
          description: input.description,
          projectId: input.projectId,
          endDate: input.endDate,
          steps: {
            create: sortedSteps.map((step, index) => ({
              type: step.type,
              name: step.name,
              url: step.url,
              eventName: step.eventName,
              eventCode: step.eventCode,
              positionX: step.positionX,
              positionY: step.positionY,
              stepOrder: index + 1,
            })),
          },
        },
        include: {
          steps: {
            orderBy: {
              stepOrder: "asc",
            },
          },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        funnelId: z.string(),
        projectId: z.string(),
        organizationId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        steps: z.array(stepSchema).optional(),
        endDate: z.date().optional().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const funnel = await ctx.prisma.funnel.findFirst({
        where: {
          id: input.funnelId,
          projectId: input.projectId,
        },
      });

      if (!funnel) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // If steps are provided, update them
      if (input.steps) {
        // Sort steps by positionX to calculate stepOrder
        const sortedSteps = [...input.steps].sort((a, b) => a.positionX - b.positionX);

        // Delete all existing steps and create new ones
        await ctx.prisma.funnelStep.deleteMany({
          where: {
            funnelId: input.funnelId,
          },
        });

        await ctx.prisma.funnelStep.createMany({
          data: sortedSteps.map((step, index) => ({
            funnelId: input.funnelId,
            type: step.type,
            name: step.name,
            url: step.url,
            eventName: step.eventName,
            eventCode: step.eventCode,
            positionX: step.positionX,
            positionY: step.positionY,
            stepOrder: index + 1,
          })),
        });
      }

      // Update funnel fields
      return ctx.prisma.funnel.update({
        where: {
          id: input.funnelId,
        },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.endDate !== undefined && { endDate: input.endDate }),
        },
        include: {
          steps: {
            orderBy: {
              stepOrder: "asc",
            },
          },
        },
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        funnelId: z.string(),
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user has access through organization
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
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const funnel = await ctx.prisma.funnel.findFirst({
        where: {
          id: input.funnelId,
          project: {
            organizationId: input.organizationId,
          },
        },
      });

      if (!funnel) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Delete funnel (steps will be cascade deleted)
      await ctx.prisma.funnel.delete({
        where: {
          id: input.funnelId,
        },
      });

      return { success: true };
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        funnelId: z.string(),
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const funnel = await ctx.prisma.funnel.findFirst({
        where: {
          id: input.funnelId,
          projectId: input.projectId,
        },
        include: {
          steps: {
            orderBy: {
              stepOrder: "asc",
            },
          },
        },
      });

      if (!funnel) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      // Calculate conversions and drop-offs for each step
      // This is a placeholder - actual implementation will query session/pageview/event data
      // For now, return empty stats structure
      const stepStats = funnel.steps.map((step, index) => {
        // TODO: Calculate actual conversions from session/pageview/event data
        return {
          stepId: step.id,
          stepOrder: step.stepOrder,
          conversions: 0,
          dropOffs: 0,
          conversionRate: 0,
        };
      });

      return {
        funnelId: funnel.id,
        totalConversions: 0,
        totalDropOffs: 0,
        overallConversionRate: 0,
        stepStats,
      };
    }),
} satisfies TRPCRouterRecord;

