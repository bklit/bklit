import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const notificationRouter = createTRPCRouter({
  getPreferences: protectedProcedure
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

      // Get or create notification preferences
      let preferences = await ctx.prisma.notificationPreference.findUnique({
        where: {
          userId_projectId: {
            userId: ctx.session.user.id,
            projectId: input.projectId,
          },
        },
      });

      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await ctx.prisma.notificationPreference.create({
          data: {
            userId: ctx.session.user.id,
            projectId: input.projectId,
            liveVisitorToasts: true, // Default to enabled
          },
        });
      }

      return preferences;
    }),
  updatePreferences: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        liveVisitorToasts: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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

      // Upsert notification preferences
      const preferences = await ctx.prisma.notificationPreference.upsert({
        where: {
          userId_projectId: {
            userId: ctx.session.user.id,
            projectId: input.projectId,
          },
        },
        update: {
          liveVisitorToasts: input.liveVisitorToasts,
          updatedAt: new Date(),
        },
        create: {
          userId: ctx.session.user.id,
          projectId: input.projectId,
          liveVisitorToasts: input.liveVisitorToasts,
        },
      });

      return preferences;
    }),
});
