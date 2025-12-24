import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";
import { protectedProcedure } from "../trpc";

const ipOrCidrSchema = z.string().refine(
  (val) => {
    const trimmed = val.trim();
    const ipv4 =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const cidrV4 =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;
    return ipv4.test(trimmed) || cidrV4.test(trimmed);
  },
  { message: "Invalid IP address or CIDR notation" },
);

export const ipBlacklistRouter = {
  // Get blacklisted IPs for a project
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
          organization: {
            members: {
              some: { userId: ctx.session.user.id },
            },
          },
        },
        select: { blacklistedIps: true },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return project.blacklistedIps;
    }),

  // Add IP or CIDR to blacklist
  add: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        ip: ipOrCidrSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify admin/owner access
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
          organization: {
            members: {
              some: {
                userId: ctx.session.user.id,
                role: { in: ["admin", "owner"] },
              },
            },
          },
        },
        select: { blacklistedIps: true },
      });

      if (!project) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const trimmedIp = input.ip.trim();

      // Check for duplicates
      if (project.blacklistedIps.includes(trimmedIp)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "IP is already blacklisted",
        });
      }

      // Add to blacklist
      const updated = await ctx.prisma.project.update({
        where: { id: input.projectId },
        data: {
          blacklistedIps: {
            push: trimmedIp,
          },
        },
        select: { blacklistedIps: true },
      });

      return updated.blacklistedIps;
    }),

  // Remove IP from blacklist
  remove: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        ip: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify admin/owner access
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
          organization: {
            members: {
              some: {
                userId: ctx.session.user.id,
                role: { in: ["admin", "owner"] },
              },
            },
          },
        },
        select: { blacklistedIps: true },
      });

      if (!project) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Remove from blacklist
      const updated = await ctx.prisma.project.update({
        where: { id: input.projectId },
        data: {
          blacklistedIps: project.blacklistedIps.filter(
            (ip) => ip !== input.ip,
          ),
        },
        select: { blacklistedIps: true },
      });

      return updated.blacklistedIps;
    }),
} satisfies TRPCRouterRecord;
