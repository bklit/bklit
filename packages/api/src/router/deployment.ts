import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@bklit/db/client";

export const deploymentRouter = createTRPCRouter({
  listForProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input }) => {
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
          deploymentUrl: true,
        },
      });
    }),

  getStats: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
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
