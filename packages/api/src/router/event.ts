import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

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

      const existingEvent = await ctx.prisma.eventDefinition.findUnique({
        where: {
          projectId_trackingId: {
            projectId: input.projectId,
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

      const events = await ctx.prisma.eventDefinition.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          trackedEvents: {
            select: {
              id: true,
              timestamp: true,
              metadata: true,
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

      return events.map((event) => {
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
      });
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
