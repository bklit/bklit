import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure } from "../trpc";

export const projectRouter = {
  fetch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        organizationId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.id,
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
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return {
        ...project,
        userMembership: project.organization.members[0],
      };
    }),

  list: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        projects: true,
      },
    });
  }),
} satisfies TRPCRouterRecord;
