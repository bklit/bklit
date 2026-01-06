import { prisma } from "@bklit/db/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const deploymentRouter = createTRPCRouter({
  getWebhook: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.deploymentWebhook.findUnique({
        where: { projectId: input.projectId },
      });
    }),

  saveWebhook: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        platform: z.string(),
        platformProjectId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.deploymentWebhook.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          platform: input.platform,
          platformProjectId: input.platformProjectId,
        },
        update: {
          platform: input.platform,
          platformProjectId: input.platformProjectId,
        },
      });
    }),

  toggleWebhook: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      return await prisma.deploymentWebhook.update({
        where: { projectId: input.projectId },
        data: { enabled: input.enabled },
      });
    }),
});
