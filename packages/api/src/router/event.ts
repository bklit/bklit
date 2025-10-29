import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure } from "../trpc";

// @ts-expect-error - Complex Prisma types cause inference issues
export const eventRouter = {
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        trackingId: z.string().min(1),
        projectId: z.string(),
        organizationId: z.string(),
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

      const existingEventByTrackingId =
        await ctx.prisma.eventDefinition.findUnique({
          where: {
            projectId_trackingId: {
              projectId: input.projectId,
              trackingId: input.trackingId,
            },
          },
        });

      if (existingEventByTrackingId) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "An event with this tracking ID already exists for this project",
        });
      }

      const existingEventByName = await ctx.prisma.eventDefinition.findUnique({
        where: {
          projectId_name: {
            projectId: input.projectId,
            name: input.name,
          },
        },
      });

      if (existingEventByName) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An event with this name already exists for this project",
        });
      }

      return ctx.prisma.eventDefinition.create({
        data: {
          name: input.name,
          description: input.description,
          trackingId: input.trackingId,
          projectId: input.projectId,
        },
      });
    }),

  list: protectedProcedure
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

      const dateFilter =
        input.startDate || input.endDate
          ? {
              timestamp: {
                ...(input.startDate && { gte: input.startDate }),
                ...(input.endDate && { lte: input.endDate }),
              },
            }
          : undefined;

      const events = await ctx.prisma.eventDefinition.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          trackedEvents: {
            ...(dateFilter && { where: dateFilter }),
            select: {
              id: true,
              timestamp: true,
              metadata: true,
              sessionId: true,
            },
            orderBy: {
              timestamp: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return events
        .map((event) => {
          const eventTypeCounts: Record<string, number> = {};

          for (const trackedEvent of event.trackedEvents) {
            const metadata = trackedEvent.metadata as {
              eventType?: string;
            } | null;
            const eventType = metadata?.eventType || "unknown";
            eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1;
          }

          return {
            id: event.id,
            name: event.name,
            description: event.description,
            trackingId: event.trackingId,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
            totalCount: event.trackedEvents.length,
            eventTypeCounts,
            recentEvents: event.trackedEvents.slice(0, 5),
          };
        })
        .filter((event) => {
          // When date filters are applied, only show events with tracked events in that range
          if (input.startDate || input.endDate) {
            return event.totalCount > 0;
          }
          // When no date filters, show all event definitions
          return true;
        });
    }),

  listBySession: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        trackingId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(1000).default(10),
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

      const dateFilter =
        input.startDate || input.endDate
          ? {
              timestamp: {
                ...(input.startDate && { gte: input.startDate }),
                ...(input.endDate && { lte: input.endDate }),
              },
            }
          : undefined;

      // Get the event definition
      const eventDefinition = await ctx.prisma.eventDefinition.findFirst({
        where: {
          projectId: input.projectId,
          trackingId: input.trackingId,
        },
      });

      if (!eventDefinition) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get events grouped by session
      const sessionEvents = await ctx.prisma.trackedEvent.findMany({
        where: {
          eventDefinitionId: eventDefinition.id,
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
        include: {
          session: true,
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      // Group events by session
      const sessionGroups = sessionEvents.reduce(
        (acc, event) => {
          const sessionId = event.sessionId || "no-session";
          if (!acc[sessionId]) {
            acc[sessionId] = {
              sessionId,
              session: event.session,
              events: [],
              firstEvent: event,
              lastEvent: event,
            };
          }
          acc[sessionId].events.push(event);
          // Update first and last events based on timestamp
          if (event.timestamp < acc[sessionId].firstEvent.timestamp) {
            acc[sessionId].firstEvent = event;
          }
          if (event.timestamp > acc[sessionId].lastEvent.timestamp) {
            acc[sessionId].lastEvent = event;
          }
          return acc;
        },
        {} as Record<
          string,
          {
            sessionId: string;
            session: (typeof sessionEvents)[0]["session"];
            events: typeof sessionEvents;
            firstEvent: (typeof sessionEvents)[0];
            lastEvent: (typeof sessionEvents)[0];
          }
        >,
      );

      // Convert to array and sort by last event timestamp
      const sessionGroupsArray = Object.values(sessionGroups).sort(
        (a, b) =>
          new Date(b.lastEvent.timestamp).getTime() -
          new Date(a.lastEvent.timestamp).getTime(),
      );

      // Apply pagination
      const totalCount = sessionGroupsArray.length;
      const paginatedGroups = sessionGroupsArray.slice(
        (input.page - 1) * input.limit,
        input.page * input.limit,
      );

      // Transform data for display
      const result = paginatedGroups.map((group) => {
        const hasClick = group.events.some((event) => {
          const metadata = event.metadata as { eventType?: string } | null;
          return metadata?.eventType === "click";
        });

        const hasView = group.events.some((event) => {
          const metadata = event.metadata as { eventType?: string } | null;
          return metadata?.eventType === "view";
        });

        const hasHover = group.events.some((event) => {
          const metadata = event.metadata as { eventType?: string } | null;
          return metadata?.eventType === "hover";
        });

        // Get the trigger method from the first event
        const firstEventMetadata = group.firstEvent.metadata as {
          triggerMethod?: string;
        } | null;
        const triggerMethod = firstEventMetadata?.triggerMethod || "automatic";

        return {
          sessionId: group.sessionId,
          session: group.session,
          firstEvent: group.firstEvent,
          lastEvent: group.lastEvent,
          hasClick,
          hasView,
          hasHover,
          triggerMethod,
          totalInteractions: group.events.length,
          events: group.events,
        };
      });

      return {
        sessions: result,
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        trackingId: z.string().min(1).optional(),
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const event = await ctx.prisma.eventDefinition.findUnique({
        where: { id: input.id },
        include: {
          project: {
            include: {
              organization: {
                include: {
                  members: {
                    where: { userId: ctx.session.user.id },
                  },
                },
              },
            },
          },
        },
      });

      if (
        !event ||
        !event.project.organization ||
        event.project.organization.members.length === 0
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.trackingId && input.trackingId !== event.trackingId) {
        const existingEvent = await ctx.prisma.eventDefinition.findUnique({
          where: {
            projectId_trackingId: {
              projectId: event.projectId,
              trackingId: input.trackingId,
            },
          },
        });

        if (existingEvent) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "An event with this tracking ID already exists for this project",
          });
        }
      }

      if (input.name && input.name !== event.name) {
        const existingEventByName = await ctx.prisma.eventDefinition.findUnique(
          {
            where: {
              projectId_name: {
                projectId: event.projectId,
                name: input.name,
              },
            },
          },
        );

        if (existingEventByName) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An event with this name already exists for this project",
          });
        }
      }

      return ctx.prisma.eventDefinition.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          trackingId: input.trackingId,
        },
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const event = await ctx.prisma.eventDefinition.findUnique({
        where: { id: input.id },
        include: {
          project: {
            include: {
              organization: {
                include: {
                  members: {
                    where: { userId: ctx.session.user.id },
                  },
                },
              },
            },
          },
        },
      });

      if (
        !event ||
        !event.project.organization ||
        event.project.organization.members.length === 0
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.prisma.eventDefinition.delete({
        where: { id: input.id },
      });
    }),

  getByTrackingId: protectedProcedure
    .input(
      z.object({
        trackingId: z.string(),
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
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

      const event = await ctx.prisma.eventDefinition.findUnique({
        where: {
          projectId_trackingId: {
            projectId: input.projectId,
            trackingId: input.trackingId,
          },
        },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      const dateFilter =
        input.startDate || input.endDate
          ? {
              timestamp: {
                ...(input.startDate && { gte: input.startDate }),
                ...(input.endDate && { lte: input.endDate }),
              },
            }
          : undefined;

      // Get total count for pagination
      const totalCount = await ctx.prisma.trackedEvent.count({
        where: {
          eventDefinitionId: event.id,
          ...(dateFilter && dateFilter),
        },
      });

      // Get paginated events
      const trackedEvents = await ctx.prisma.trackedEvent.findMany({
        where: {
          eventDefinitionId: event.id,
          ...(dateFilter && dateFilter),
        },
        select: {
          id: true,
          timestamp: true,
          metadata: true,
          createdAt: true,
          session: {
            select: {
              id: true,
              sessionId: true,
              userAgent: true,
              country: true,
              city: true,
              startedAt: true,
              entryPage: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });

      const eventTypeCounts: Record<string, number> = {};
      const timeSeriesData: Record<string, { views: number; clicks: number }> =
        {};

      // Separate automatic (DOM-triggered) vs manual events
      // Note: Events without triggerMethod are treated as automatic for backward compatibility
      const automaticEvents = trackedEvents.filter((e) => {
        const metadata = e.metadata as { triggerMethod?: string } | null;
        return metadata?.triggerMethod !== "manual"; // Include automatic and legacy events (undefined/null)
      });

      for (const trackedEvent of trackedEvents) {
        const metadata = trackedEvent.metadata as {
          eventType?: string;
          triggerMethod?: string;
        } | null;
        const eventType = metadata?.eventType || "unknown";
        eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1;

        const dateKey = trackedEvent.timestamp.toISOString().split("T")[0];
        if (dateKey) {
          if (!timeSeriesData[dateKey]) {
            timeSeriesData[dateKey] = { views: 0, clicks: 0 };
          }

          if (eventType === "view") {
            timeSeriesData[dateKey].views += 1;
          } else if (eventType === "click") {
            timeSeriesData[dateKey].clicks += 1;
          }
        }
      }

      const totalSessions = await ctx.prisma.trackedSession.count({
        where: {
          projectId: input.projectId,
          ...(dateFilter && {
            startedAt: dateFilter.timestamp,
          }),
        },
      });

      // For conversion rate, only count automatic events (DOM-triggered, user-perceived)
      // Manual JS events may not have been perceived by the user, so they shouldn't count as conversions
      const automaticEventTimestamps = automaticEvents.map((e) => e.timestamp);
      const sessionsWithEvent =
        totalSessions > 0 && automaticEventTimestamps.length > 0
          ? await ctx.prisma.trackedSession.count({
              where: {
                projectId: input.projectId,
                ...(dateFilter && {
                  startedAt: dateFilter.timestamp,
                }),
                OR: automaticEventTimestamps.map((timestamp) => ({
                  startedAt: {
                    gte: new Date(timestamp.getTime() - 5 * 60 * 1000),
                    lte: new Date(timestamp.getTime() + 5 * 60 * 1000),
                  },
                })),
              },
            })
          : 0;

      const conversionRate =
        totalSessions > 0 ? (sessionsWithEvent / totalSessions) * 100 : 0;

      const timeSeriesArray = Object.entries(timeSeriesData)
        .map(([date, data]) => ({
          date,
          views: data.views,
          clicks: data.clicks,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        id: event.id,
        name: event.name,
        description: event.description,
        trackingId: event.trackingId,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        totalCount: totalCount,
        eventTypeCounts,
        recentEvents: trackedEvents,
        timeSeriesData: timeSeriesArray,
        conversionRate: Number(conversionRate.toFixed(2)),
        totalSessions,
        sessionsWithEvent,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(totalCount / input.limit),
          hasNextPage: input.page < Math.ceil(totalCount / input.limit),
          hasPreviousPage: input.page > 1,
        },
      };
    }),

  stats: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const event = await ctx.prisma.eventDefinition.findUnique({
        where: { id: input.eventId },
        include: {
          project: {
            include: {
              organization: {
                include: {
                  members: {
                    where: { userId: ctx.session.user.id },
                  },
                },
              },
            },
          },
          trackedEvents: {
            select: {
              timestamp: true,
              metadata: true,
            },
            orderBy: {
              timestamp: "desc",
            },
          },
        },
      });

      if (
        !event ||
        !event.project.organization ||
        event.project.organization.members.length === 0
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const eventTypeCounts: Record<string, number> = {};

      for (const trackedEvent of event.trackedEvents) {
        const metadata = trackedEvent.metadata as { eventType?: string } | null;
        const eventType = metadata?.eventType || "unknown";
        eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1;
      }

      return {
        totalCount: event.trackedEvents.length,
        eventTypeCounts,
        recentEvents: event.trackedEvents.slice(0, 10),
      };
    }),
} satisfies TRPCRouterRecord;
