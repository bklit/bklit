import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const sessionRouter = createTRPCRouter({
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
        where: { id: input.projectId, organizationId: input.organizationId },
        include: {
          organization: {
            include: { members: { where: { userId: ctx.session.user.id } } },
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

      const sessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
        select: {
          startedAt: true,
          didBounce: true,
        },
        orderBy: { startedAt: "asc" },
      });

      const sessionCountsByDay = sessions.reduce(
        (acc, s) => {
          const dateKey = s.startedAt.toISOString().split("T")[0] ?? "";
          if (!acc[dateKey]) {
            acc[dateKey] = { total: 0, engaged: 0, bounced: 0 };
          }
          acc[dateKey].total += 1;
          if (s.didBounce) {
            acc[dateKey].bounced += 1;
          } else {
            acc[dateKey].engaged += 1;
          }
          return acc;
        },
        {} as Record<
          string,
          { total: number; engaged: number; bounced: number }
        >,
      );

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

      const timeSeriesData = dateRange.map((date) => ({
        date,
        total: sessionCountsByDay[date]?.total || 0,
        engaged: sessionCountsByDay[date]?.engaged || 0,
        bounced: sessionCountsByDay[date]?.bounced || 0,
      }));

      return { timeSeriesData };
    }),

  getStats: protectedProcedure
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
        where: { id: input.projectId, organizationId: input.organizationId },
        include: {
          organization: {
            include: { members: { where: { userId: ctx.session.user.id } } },
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

      const sessions = await ctx.prisma.trackedSession.findMany({
        where: { projectId: input.projectId, ...(dateFilter && dateFilter) },
        select: {
          id: true,
          startedAt: true,
          userAgent: true,
          pageViewEvents: {
            select: { mobile: true },
            orderBy: { timestamp: "asc" },
          },
        },
      });

      const totalSessions = sessions.length;
      let mobileSessions = 0;
      let desktopSessions = 0;

      for (const s of sessions) {
        const isMobile =
          s.pageViewEvents.some((e) => e.mobile) ||
          (s.userAgent
            ? /Mobile|Android|iPhone|iPad/.test(s.userAgent)
            : false);
        if (isMobile) mobileSessions += 1;
        else desktopSessions += 1;
      }

      return { totalSessions, mobileSessions, desktopSessions };
    }),
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
  getJourneys: protectedProcedure
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
        where: { id: input.projectId, organizationId: input.organizationId },
        include: {
          organization: {
            include: { members: { where: { userId: ctx.session.user.id } } },
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

      const sessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
        include: {
          pageViewEvents: {
            orderBy: { timestamp: "asc" },
            select: {
              url: true,
            },
          },
        },
      });

      function extractPath(url: string): string {
        try {
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          return pathname === "" ? "/" : pathname;
        } catch {
          const match = url.match(/^https?:\/\/[^/]+(\/.*)?$/);
          if (match) {
            return match[1] || "/";
          }
          return url;
        }
      }

      const pageSet = new Set<string>();
      const transitions = new Map<string, Map<string, number>>();

      for (const session of sessions) {
        if (session.pageViewEvents.length === 0) continue;

        const paths = session.pageViewEvents.map((event) =>
          extractPath(event.url),
        );

        const entryPage = paths[0];
        const exitPage = paths[paths.length - 1];

        pageSet.add(entryPage);
        pageSet.add(exitPage);

        for (let i = 0; i < paths.length - 1; i++) {
          const from = paths[i];
          const to = paths[i + 1];
          if (from !== to) {
            pageSet.add(from);
            pageSet.add(to);
            let innerMap = transitions.get(from);
            if (!innerMap) {
              innerMap = new Map<string, number>();
              transitions.set(from, innerMap);
            }
            innerMap.set(to, (innerMap.get(to) || 0) + 1);
          }
        }
      }

      const pages = Array.from(pageSet).sort();
      const nodeMap = new Map<string, number>();
      pages.forEach((page, index) => {
        nodeMap.set(page, index);
      });

      const nodes = pages.map((page) => ({
        name: page === "/" ? "Home" : page,
      }));

      const links: Array<{ source: number; target: number; value: number }> =
        [];
      for (const [from, innerMap] of transitions.entries()) {
        const sourceIndex = nodeMap.get(from);
        if (sourceIndex === undefined) continue;

        for (const [to, value] of innerMap.entries()) {
          const targetIndex = nodeMap.get(to);
          if (
            targetIndex === undefined ||
            sourceIndex === targetIndex
          ) {
            continue;
          }
          links.push({
            source: sourceIndex,
            target: targetIndex,
            value,
          });
        }
      }

      return { nodes, links };
    }),
});
