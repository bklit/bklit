import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";
import { endOfDay, startOfDay } from "../lib/date-utils";
import { matchSessionToFunnel } from "../lib/funnel-utils";
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
      const sortedSteps = [...input.steps].sort(
        (a, b) => a.positionX - b.positionX,
      );

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
        const sortedSteps = [...input.steps].sort(
          (a, b) => a.positionX - b.positionX,
        );

        // Delete all existing steps and create new ones atomically
        await ctx.prisma.$transaction(async (tx) => {
          await tx.funnelStep.deleteMany({
            where: {
              funnelId: input.funnelId,
            },
          });

          await tx.funnelStep.createMany({
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
        });
      }

      // Update funnel fields
      return ctx.prisma.funnel.update({
        where: {
          id: input.funnelId,
        },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
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

      // Handle empty funnels (no steps)
      if (funnel.steps.length === 0) {
        return {
          funnelId: funnel.id,
          totalConversions: 0,
          totalDropOffs: 0,
          overallConversionRate: 0,
          stepStats: [],
        };
      }

      // Handle funnel endDate - if set, only count sessions before endDate
      const effectiveEndDate = funnel.endDate
        ? normalizedEndDate
          ? new Date(
              Math.min(funnel.endDate.getTime(), normalizedEndDate.getTime()),
            )
          : funnel.endDate
        : normalizedEndDate;

      // Query sessions with pageviews and events
      const sessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          startedAt: {
            ...(normalizedStartDate && { gte: normalizedStartDate }),
            ...(effectiveEndDate && { lte: effectiveEndDate }),
          },
        },
        select: {
          id: true,
          pageViewEvents: {
            where: {
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(effectiveEndDate && { lte: effectiveEndDate }),
              },
            },
            select: {
              url: true,
              timestamp: true,
            },
            orderBy: {
              timestamp: "asc",
            },
          },
          trackedEvents: {
            where: {
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(effectiveEndDate && { lte: effectiveEndDate }),
              },
            },
            select: {
              timestamp: true,
              eventDefinition: {
                select: {
                  trackingId: true,
                },
              },
            },
            orderBy: {
              timestamp: "asc",
            },
          },
        },
      });

      // Track step completions per session
      const stepCompletionsBySession = new Map<
        string,
        Array<{ stepId: string; stepOrder: number }>
      >();

      for (const session of sessions) {
        const completions = matchSessionToFunnel(session, funnel.steps);
        stepCompletionsBySession.set(
          session.id,
          completions.map((c) => ({
            stepId: c.stepId,
            stepOrder: c.stepOrder,
          })),
        );
      }

      // Calculate step stats
      const stepStats = funnel.steps.map((step, index) => {
        // Count sessions that completed this step
        const conversions = Array.from(
          stepCompletionsBySession.values(),
        ).filter((completions) =>
          completions.some((c) => c.stepId === step.id),
        ).length;

        // Count drop-offs: sessions that completed previous step but not this one
        let dropOffs = 0;
        if (index > 0) {
          const previousStep = funnel.steps[index - 1];
          const previousStepCompletions = Array.from(
            stepCompletionsBySession.values(),
          ).filter((completions) =>
            completions.some((c) => c.stepId === previousStep.id),
          ).length;
          dropOffs = previousStepCompletions - conversions;
        }

        // Calculate conversion rate
        let conversionRate = 0;
        if (index === 0) {
          // First step: conversion rate is 100% (everyone who started)
          conversionRate = conversions > 0 ? 100 : 0;
        } else {
          const previousStep = funnel.steps[index - 1];
          const previousStepConversions = Array.from(
            stepCompletionsBySession.values(),
          ).filter((completions) =>
            completions.some((c) => c.stepId === previousStep.id),
          ).length;
          if (previousStepConversions > 0) {
            conversionRate = (conversions / previousStepConversions) * 100;
          }
        }

        return {
          stepId: step.id,
          stepOrder: step.stepOrder,
          conversions,
          dropOffs,
          conversionRate: Number(conversionRate.toFixed(2)),
        };
      });

      // Calculate overall stats
      const firstStepConversions =
        stepStats.length > 0 ? stepStats[0]!.conversions : 0;
      const lastStepConversions =
        stepStats.length > 0 ? stepStats[stepStats.length - 1]!.conversions : 0;
      const totalDropOffs = stepStats.reduce(
        (sum, stat) => sum + stat.dropOffs,
        0,
      );
      const overallConversionRate =
        firstStepConversions > 0
          ? (lastStepConversions / firstStepConversions) * 100
          : 0;

      // Find last session that matched this funnel
      let lastSessionTimestamp: Date | null = null;
      if (stepCompletionsBySession.size > 0) {
        const sessionIds = Array.from(stepCompletionsBySession.keys());
        const lastSession = await ctx.prisma.trackedSession.findFirst({
          where: {
            id: { in: sessionIds },
          },
          select: {
            startedAt: true,
          },
          orderBy: {
            startedAt: "desc",
          },
        });
        lastSessionTimestamp = lastSession?.startedAt ?? null;
      }

      return {
        funnelId: funnel.id,
        totalConversions: lastStepConversions,
        totalDropOffs,
        overallConversionRate: Number(overallConversionRate.toFixed(2)),
        stepStats,
        lastSessionTimestamp,
      };
    }),

  getTimeSeries: protectedProcedure
    .input(
      z.object({
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

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      // Get all funnels for this project
      const funnels = await ctx.prisma.funnel.findMany({
        where: {
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

      if (funnels.length === 0) {
        const endDate = input.endDate || new Date();
        const startDate =
          input.startDate ||
          (() => {
            const d = new Date(endDate);
            d.setDate(d.getDate() - 30);
            return d;
          })();

        const dateRange: string[] = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          dateRange.push(currentDate.toISOString().split("T")[0] ?? "");
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
          timeSeriesData: dateRange.map((date) => ({
            date,
            sessions: 0,
            conversions: 0,
          })),
        };
      }

      // Query sessions with pageviews and events
      const sessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          startedAt: {
            ...(normalizedStartDate && { gte: normalizedStartDate }),
            ...(normalizedEndDate && { lte: normalizedEndDate }),
          },
        },
        select: {
          id: true,
          startedAt: true,
          pageViewEvents: {
            where: {
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            },
            select: {
              url: true,
              timestamp: true,
            },
            orderBy: {
              timestamp: "asc",
            },
          },
          trackedEvents: {
            where: {
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            },
            select: {
              timestamp: true,
              eventDefinition: {
                select: {
                  trackingId: true,
                },
              },
            },
            orderBy: {
              timestamp: "asc",
            },
          },
        },
      });

      // Track funnel sessions and conversions by date
      const funnelDataByDay = new Map<
        string,
        { sessions: Set<string>; conversions: Set<string> }
      >();

      for (const funnel of funnels) {
        if (funnel.steps.length === 0) continue;

        const firstStep = funnel.steps[0];
        const lastStep = funnel.steps[funnel.steps.length - 1];

        for (const session of sessions) {
          const completions = matchSessionToFunnel(session, funnel.steps);

          // Check if session matched first step (funnel session)
          const matchedFirstStep = completions.some(
            (c) => c.stepId === firstStep.id,
          );
          // Check if session completed last step (conversion)
          const matchedLastStep = completions.some(
            (c) => c.stepId === lastStep.id,
          );

          if (matchedFirstStep) {
            const dateKey = session.startedAt.toISOString().split("T")[0] ?? "";
            if (!funnelDataByDay.has(dateKey)) {
              funnelDataByDay.set(dateKey, {
                sessions: new Set(),
                conversions: new Set(),
              });
            }
            const dayData = funnelDataByDay.get(dateKey)!;
            dayData.sessions.add(session.id);
            if (matchedLastStep) {
              dayData.conversions.add(session.id);
            }
          }
        }
      }

      const endDate = input.endDate || new Date();
      const startDate =
        input.startDate ||
        (() => {
          const d = new Date(endDate);
          d.setDate(d.getDate() - 30);
          return d;
        })();

      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dateRange.push(currentDate.toISOString().split("T")[0] ?? "");
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const timeSeriesData = dateRange.map((date) => {
        const dayData = funnelDataByDay.get(date);
        return {
          date,
          sessions: dayData?.sessions.size || 0,
          conversions: dayData?.conversions.size || 0,
        };
      });

      return { timeSeriesData };
    }),
} satisfies TRPCRouterRecord;
