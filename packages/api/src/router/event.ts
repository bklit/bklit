import { ANALYTICS_UNLIMITED_QUERY_LIMIT } from "@bklit/analytics/constants";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { endOfDay, parseClickHouseDate, startOfDay } from "../lib/date-utils";
import { protectedProcedure } from "../trpc";

export const eventRouter = {
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        trackingId: z.string().min(1),
        projectId: z.string(),
        organizationId: z.string(),
      })
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
        !(project && project.organization) ||
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
      })
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
        !(project && project.organization) ||
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
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      const events = await ctx.prisma.eventDefinition.findMany({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const eventsWithData = await Promise.all(
        events.map(async (event) => {
          const trackedEvents = await ctx.analytics.getTrackedEvents({
            projectId: input.projectId,
            eventDefinitionId: event.id,
            startDate: normalizedStartDate,
            endDate: normalizedEndDate,
            limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
          });

          const eventTypeCounts: Record<string, number> = {};
          const sessionIds = new Set<string>();

          for (const trackedEvent of trackedEvents) {
            const metadata = trackedEvent.metadata as {
              eventType?: string;
            } | null;
            const eventType = metadata?.eventType || "unknown";
            eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1;
            if (trackedEvent.session_id) {
              sessionIds.add(trackedEvent.session_id);
            }
          }

          return {
            id: event.id,
            name: event.name,
            description: event.description,
            trackingId: event.trackingId,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
            totalCount: trackedEvents.length,
            uniqueSessionsCount: sessionIds.size,
            eventTypeCounts,
            recentEvents: trackedEvents.slice(0, 5).map((ev) => ({
              id: ev.id,
              timestamp: parseClickHouseDate(ev.timestamp),
              metadata: ev.metadata,
              sessionId: ev.session_id,
            })),
          };
        })
      );

      return eventsWithData.filter((event) => {
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
      })
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
        !(project && project.organization) ||
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
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
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

      // Get events from ClickHouse
      const trackedEvents = await ctx.analytics.getEventsByDefinition(
        eventDefinition.id,
        {
          projectId: input.projectId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
        }
      );

      // Get unique session IDs
      const sessionIds = new Set<string>();
      for (const event of trackedEvents) {
        if (event.session_id) {
          sessionIds.add(event.session_id);
        }
      }

      // Get sessions from ClickHouse
      const sessions = await Promise.all(
        Array.from(sessionIds).map(async (sessionId) => {
          const session = await ctx.analytics.getSessionById(
            sessionId,
            input.projectId
          );
          return session ? { sessionId, session } : null;
        })
      );

      const sessionMap = new Map(
        sessions
          .filter((s): s is NonNullable<typeof s> => s !== null)
          .map((s) => [s.sessionId, s.session])
      );

      // Group events by session
      type SessionGroup = {
        sessionId: string;
        session: Awaited<
          ReturnType<typeof ctx.analytics.getSessionById>
        > | null;
        events: Array<{
          id: string;
          timestamp: Date;
          metadata: Record<string, unknown> | null;
          createdAt: Date;
          eventDefinitionId: string;
          projectId: string;
          sessionId: string | null;
        }>;
        firstEvent: (typeof trackedEvents)[0];
        lastEvent: (typeof trackedEvents)[0];
      };

      const sessionGroups = trackedEvents.reduce(
        (acc, event) => {
          const sessionId = event.session_id || "no-session";
          const session = sessionMap.get(sessionId) || null;

          if (!acc[sessionId]) {
            acc[sessionId] = {
              sessionId,
              session,
              events: [],
              firstEvent: event,
              lastEvent: event,
            };
          }
          acc[sessionId].events.push({
            id: event.id,
            timestamp: parseClickHouseDate(event.timestamp),
            metadata: event.metadata,
            createdAt: parseClickHouseDate(event.created_at),
            eventDefinitionId: event.event_definition_id,
            projectId: event.project_id,
            sessionId: event.session_id,
          });
          // Update first and last events based on timestamp
          if (
            parseClickHouseDate(event.timestamp).getTime() <
            parseClickHouseDate(acc[sessionId].firstEvent.timestamp).getTime()
          ) {
            acc[sessionId].firstEvent = event;
          }
          if (
            parseClickHouseDate(event.timestamp).getTime() >
            parseClickHouseDate(acc[sessionId].lastEvent.timestamp).getTime()
          ) {
            acc[sessionId].lastEvent = event;
          }
          return acc;
        },
        {} as Record<string, SessionGroup>
      );

      // Convert to array and sort by last event timestamp
      const sessionGroupsArray = Object.values(sessionGroups).sort(
        (a, b) =>
          parseClickHouseDate(b.lastEvent.timestamp).getTime() -
          parseClickHouseDate(a.lastEvent.timestamp).getTime()
      );

      // Apply pagination
      const totalCount = sessionGroupsArray.length;
      const paginatedGroups = sessionGroupsArray.slice(
        (input.page - 1) * input.limit,
        input.page * input.limit
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
          selectorType?: string;
          source?: string;
        } | null;
        let triggerType: "data-attr" | "id" | "programmatic" = "programmatic";
        if (
          firstEventMetadata?.selectorType === "data-attr" ||
          firstEventMetadata?.selectorType === "dataAttr"
        ) {
          triggerType = "data-attr";
        } else if (firstEventMetadata?.selectorType === "id") {
          triggerType = "id";
        } else if (
          firstEventMetadata?.triggerMethod === "manual" ||
          firstEventMetadata?.source === "sdk"
        ) {
          triggerType = "programmatic";
        } else if (firstEventMetadata?.triggerMethod === "automatic") {
          triggerType = "data-attr";
        } else {
          triggerType = "programmatic";
        }

        return {
          sessionId: group.sessionId,
          session: group.session,
          firstEvent: {
            id: group.firstEvent.id,
            timestamp: parseClickHouseDate(group.firstEvent.timestamp),
            metadata: group.firstEvent.metadata,
            createdAt: parseClickHouseDate(group.firstEvent.created_at),
            eventDefinitionId: group.firstEvent.event_definition_id,
            projectId: group.firstEvent.project_id,
            sessionId: group.firstEvent.session_id,
          },
          lastEvent: {
            id: group.lastEvent.id,
            timestamp: parseClickHouseDate(group.lastEvent.timestamp),
            metadata: group.lastEvent.metadata,
            createdAt: parseClickHouseDate(group.lastEvent.created_at),
            eventDefinitionId: group.lastEvent.event_definition_id,
            projectId: group.lastEvent.project_id,
            sessionId: group.lastEvent.session_id,
          },
          hasClick,
          hasView,
          hasHover,
          triggerType,
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
      })
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
        !(event && event.project.organization) ||
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
          }
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
      })
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
        !(event && event.project.organization) ||
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
      })
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
        !(project && project.organization) ||
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

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      // Get all events from ClickHouse
      const allTrackedEvents = await ctx.analytics.getEventsByDefinition(
        event.id,
        {
          projectId: input.projectId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
        }
      );

      const totalCount = allTrackedEvents.length;

      // Apply pagination
      const trackedEvents = allTrackedEvents.slice(
        (input.page - 1) * input.limit,
        input.page * input.limit
      );

      // Get sessions for these events
      const sessionIds = new Set<string>();
      for (const ev of trackedEvents) {
        if (ev.session_id) {
          sessionIds.add(ev.session_id);
        }
      }

      const sessions = await Promise.all(
        Array.from(sessionIds).map(async (sessionId) => {
          const session = await ctx.analytics.getSessionById(
            sessionId,
            input.projectId
          );
          return session ? { sessionId, session } : null;
        })
      );

      const sessionMap = new Map(
        sessions
          .filter((s): s is NonNullable<typeof s> => s !== null)
          .map((s) => [s.sessionId, s.session])
      );

      const eventTypeCounts: Record<string, number> = {};
      const timeSeriesData: Record<string, { views: number; clicks: number }> =
        {};
      const typeSeries: Record<
        string,
        { dataAttr: number; id: number; programmatic: number }
      > = {};

      // Build time series and type series (data-attr, id, programmatic)
      for (const trackedEvent of trackedEvents) {
        const metadata = trackedEvent.metadata as {
          eventType?: string;
          triggerMethod?: string;
          selectorType?: string;
          source?: string;
        } | null;
        const eventType = metadata?.eventType || "unknown";
        eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1;

        const dateKey = parseClickHouseDate(trackedEvent.timestamp)
          .toISOString()
          .split("T")[0];
        if (dateKey) {
          if (!timeSeriesData[dateKey]) {
            timeSeriesData[dateKey] = { views: 0, clicks: 0 };
          }

          if (eventType === "view") {
            timeSeriesData[dateKey].views += 1;
          } else if (eventType === "click") {
            timeSeriesData[dateKey].clicks += 1;
          }

          // classify trigger type
          let triggerType: "dataAttr" | "id" | "programmatic" = "programmatic";
          if (
            metadata?.selectorType === "data-attr" ||
            metadata?.selectorType === "dataAttr"
          ) {
            triggerType = "dataAttr";
          } else if (metadata?.selectorType === "id") {
            triggerType = "id";
          } else if (
            metadata?.triggerMethod === "manual" ||
            metadata?.source === "sdk"
          ) {
            triggerType = "programmatic";
          } else if (metadata?.triggerMethod === "automatic") {
            // Default automatic to data-attr when selectorType is not provided
            triggerType = "dataAttr";
          }

          if (!typeSeries[dateKey]) {
            typeSeries[dateKey] = { dataAttr: 0, id: 0, programmatic: 0 };
          }
          typeSeries[dateKey][triggerType] += 1;
        }
      }

      // Get total sessions count
      const sessionStats = await ctx.analytics.getSessionStats({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
      });
      const totalSessions = sessionStats.total_sessions;

      // Count ALL unique sessions that triggered this event (not just paginated results)
      const allSessionIds = new Set<string>();
      for (const trackedEvent of allTrackedEvents) {
        if (trackedEvent.session_id) {
          allSessionIds.add(trackedEvent.session_id);
        }
      }
      const sessionsWithEvent = allSessionIds.size;

      const conversionRate =
        totalSessions > 0 ? (sessionsWithEvent / totalSessions) * 100 : 0;

      const timeSeriesArray = Object.entries(timeSeriesData)
        .map(([date, data]) => ({
          date,
          views: data.views,
          clicks: data.clicks,
          dataAttr: typeSeries[date]?.dataAttr || 0,
          id: typeSeries[date]?.id || 0,
          programmatic: typeSeries[date]?.programmatic || 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        id: event.id,
        name: event.name,
        description: event.description,
        trackingId: event.trackingId,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        totalCount,
        eventTypeCounts,
        recentEvents: trackedEvents.map((ev) => ({
          id: ev.id,
          timestamp: parseClickHouseDate(ev.timestamp),
          metadata: ev.metadata,
          createdAt: parseClickHouseDate(ev.created_at),
          session: ev.session_id ? sessionMap.get(ev.session_id) || null : null,
        })),
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
      })
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
        },
      });

      if (
        !(event && event.project.organization) ||
        event.project.organization.members.length === 0
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const trackedEvents = await ctx.analytics.getTrackedEvents({
        projectId: event.projectId,
        eventDefinitionId: input.eventId,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const eventTypeCounts: Record<string, number> = {};

      for (const trackedEvent of trackedEvents) {
        const metadata = trackedEvent.metadata as { eventType?: string } | null;
        const eventType = metadata?.eventType || "unknown";
        eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1;
      }

      return {
        totalCount: trackedEvents.length,
        eventTypeCounts,
        recentEvents: trackedEvents.slice(0, 10).map((ev) => ({
          timestamp: parseClickHouseDate(ev.timestamp),
          metadata: ev.metadata,
        })),
      };
    }),

  getTimeSeries: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
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
        !(project && project.organization) ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
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
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      const rawTimeSeriesData = await ctx.analytics.getEventsTimeSeries({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
      });

      const eventCountsByDay = rawTimeSeriesData.reduce(
        (acc, row) => {
          acc[row.date] = {
            total: row.total,
            views: row.views,
            clicks: row.clicks,
          };
          return acc;
        },
        {} as Record<string, { total: number; views: number; clicks: number }>
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
        total: eventCountsByDay[date]?.total || 0,
        views: eventCountsByDay[date]?.views || 0,
        clicks: eventCountsByDay[date]?.clicks || 0,
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
      })
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
        !(project && project.organization) ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
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
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      const trackedEvents = await ctx.analytics.getTrackedEvents({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const totalEvents = trackedEvents.length;
      let automaticEvents = 0;
      let manualEvents = 0;
      let mobileEvents = 0;
      let desktopEvents = 0;

      // Get unique session IDs
      const sessionIds = new Set<string>();
      for (const event of trackedEvents) {
        if (event.session_id) {
          sessionIds.add(event.session_id);
        }
      }

      // Get sessions to check mobile/desktop
      const sessions = await Promise.all(
        Array.from(sessionIds).map(async (sessionId) => {
          return await ctx.analytics.getSessionById(sessionId, input.projectId);
        })
      );

      const sessionMap = new Map(
        sessions
          .filter((s): s is NonNullable<typeof s> => s !== null)
          .map((s) => [s.session_id, s])
      );

      // Get pageviews for mobile detection
      const pageviews = await ctx.analytics.getPageViews({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const pageviewsBySession = pageviews.reduce(
        (acc, pv) => {
          if (pv.session_id) {
            if (!acc[pv.session_id]) {
              acc[pv.session_id] = [];
            }
            acc[pv.session_id].push({ mobile: pv.mobile });
          }
          return acc;
        },
        {} as Record<string, Array<{ mobile: boolean | null }>>
      );

      for (const event of trackedEvents) {
        const metadata = event.metadata as { triggerMethod?: string } | null;
        if (metadata?.triggerMethod === "manual") {
          manualEvents += 1;
        } else {
          automaticEvents += 1;
        }

        const session = event.session_id
          ? sessionMap.get(event.session_id)
          : null;
        const sessionPageviews = event.session_id
          ? pageviewsBySession[event.session_id] || []
          : [];
        const isMobile =
          sessionPageviews.some((pv) => pv.mobile) ||
          (session?.user_agent
            ? /Mobile|Android|iPhone|iPad/.test(session.user_agent)
            : false);
        if (isMobile) mobileEvents += 1;
        else desktopEvents += 1;
      }

      return {
        totalEvents,
        automaticEvents,
        manualEvents,
        mobileEvents,
        desktopEvents,
      };
    }),

  getConversions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
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
        !(project && project.organization) ||
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
              timestamp: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      const trackedEvents = await ctx.analytics.getTrackedEvents({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const uniqueSessionIds = new Set<string>();
      for (const event of trackedEvents) {
        if (event.session_id) {
          uniqueSessionIds.add(event.session_id);
        }
      }

      return {
        conversions: uniqueSessionIds.size,
      };
    }),
} satisfies TRPCRouterRecord;
