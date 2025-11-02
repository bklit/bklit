import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure } from "../trpc";

export const organizationRouter = {
  fetch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          projects: true,
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const userMembership = organization.members.find(
        (member) => member.userId === ctx.session.user.id,
      );

      if (!userMembership) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return {
        ...organization,
        userMembership,
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
        members: {
          include: {
            user: {
              select: { name: true, email: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        theme: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.organization.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.theme && { theme: input.theme }),
        },
      });
    }),

  updatePlan: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        plan: z.enum(["free", "pro"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin of organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: "admin", // Only admins can change plan
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found or user is not an admin",
        });
      }

      return ctx.prisma.organization.update({
        where: { id: input.id },
        data: { plan: input.plan },
      });
    }),
} satisfies TRPCRouterRecord;
