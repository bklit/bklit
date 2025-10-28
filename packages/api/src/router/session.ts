import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const sessionRouter = createTRPCRouter({
  getRecent: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(1000).default(10),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to the project
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
        throw new Error("Forbidden");
      }

      const dateFilter =
        input.startDate || input.endDate
          ? {
              startedAt: {
                ...(input.startDate && { gte: input.startDate }),
                ...(input.endDate && { lte: input.endDate }),
              },
            }
          : undefined;

      // Get total count for pagination
      const totalCount = await ctx.prisma.trackedSession.count({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
      });

      // Get paginated sessions
      const sessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
        include: {
          pageViewEvents: {
            orderBy: { timestamp: "asc" },
          },
        },
        orderBy: {
          startedAt: "desc",
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });

      return {
        sessions,
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
        sessionId: z.string(),
        projectId: z.string(),
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to the project
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
        throw new Error("Forbidden");
      }

      // Get session by ID
      const session = await ctx.prisma.trackedSession.findFirst({
        where: {
          id: input.sessionId,
          projectId: input.projectId,
        },
        include: {
          pageViewEvents: {
            orderBy: { timestamp: "asc" },
          },
          project: {
            select: {
              name: true,
              domain: true,
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      return session;
    }),
  liveUsers: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to the project
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
        throw new Error("Forbidden");
      }

      // Clean up stale sessions first
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      await ctx.prisma.trackedSession.updateMany({
        where: {
          projectId: input.projectId,
          endedAt: null,
          startedAt: {
            lt: thirtyMinutesAgo,
          },
        },
        data: {
          endedAt: new Date(),
          duration: 1800, // 30 minutes in seconds
          didBounce: false,
        },
      });

      // Count active sessions
      const liveUsers = await ctx.prisma.trackedSession.count({
        where: {
          projectId: input.projectId,
          endedAt: null, // Active sessions only
          startedAt: {
            gte: thirtyMinutesAgo, // Only count sessions started in last 30 minutes
          },
        },
      });

      return liveUsers;
    }),
  recentSessions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        since: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to the project
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
        throw new Error("Forbidden");
      }

      // Get recent sessions (last 30 seconds by default)
      const since = input.since || new Date(Date.now() - 30 * 1000);

      const recentSessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          startedAt: {
            gte: since,
          },
        },
        select: {
          id: true,
          sessionId: true,
          startedAt: true,
          country: true,
          city: true,
          userAgent: true,
          entryPage: true,
        },
        orderBy: {
          startedAt: "desc",
        },
        take: 10,
      });

      return recentSessions;
    }),
});
