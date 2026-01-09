import { prisma } from "@bklit/db/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const deploymentRouter = createTRPCRouter({
  listForProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to this project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organization: {
            members: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this project",
        });
      }

      return await prisma.deployment.findMany({
        where: {
          projectId: input.projectId,
          status: "success",
          // Don't filter by environment - accept all production-like environments
          // (Vercel sends "Production – dashboard", GitHub Actions might send "production")
          ...(input.startDate &&
            input.endDate && {
              deployedAt: {
                gte: input.startDate,
                lte: input.endDate,
              },
            }),
        },
        orderBy: { deployedAt: "asc" },
        select: {
          id: true,
          deployedAt: true,
          commitSha: true,
          commitMessage: true,
          branch: true,
          author: true,
          authorAvatar: true,
          platform: true,
          status: true,
          deploymentUrl: true,
          githubRepository: true,
        },
      });
    }),

  getStats: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if user has access to this project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organization: {
            members: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this project",
        });
      }

      const [total, recent] = await Promise.all([
        prisma.deployment.count({
          where: { projectId: input.projectId },
        }),
        prisma.deployment.count({
          where: {
            projectId: input.projectId,
            deployedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      return { total, recent };
    }),
});
