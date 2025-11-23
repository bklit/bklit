import { generateToken, hashToken } from "@bklit/utils/tokens";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure } from "../trpc";

export const apiTokenRouter = {
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Verify user is member of organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.organizationId,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found or user is not a member",
        });
      }

      const tokens = await ctx.prisma.apiToken.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
          projects: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return tokens.map((token) => ({
        id: token.id,
        name: token.name,
        description: token.description,
        tokenPrefix: token.tokenPrefix,
        allowedDomains: token.allowedDomains,
        createdAt: token.createdAt,
        lastUsedAt: token.lastUsedAt,
        expiresAt: token.expiresAt,
        projects: token.projects.map((tp) => ({
          id: tp.project.id,
          name: tp.project.name,
        })),
      }));
    }),

  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        allowedDomains: z.array(z.string()).optional(),
        projectIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin or owner of organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.organizationId,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: {
                in: ["admin", "owner"],
              },
            },
          },
        },
        include: {
          projects: true,
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Organization not found or you don't have permission to create tokens",
        });
      }

      // Verify all projectIds belong to the organization
      const invalidProjectIds = input.projectIds.filter(
        (projectId) => !organization.projects.some((p) => p.id === projectId),
      );

      if (invalidProjectIds.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Projects not found in organization: ${invalidProjectIds.join(", ")}`,
        });
      }

      // Generate token
      const { token, prefix } = generateToken();
      const tokenHash = await hashToken(token);

      // Create token with project assignments
      const createdToken = await ctx.prisma.apiToken.create({
        data: {
          name: input.name,
          description: input.description,
          tokenHash,
          tokenPrefix: prefix,
          organizationId: input.organizationId,
          allowedDomains: input.allowedDomains || [],
          projects: {
            create: input.projectIds.map((projectId) => ({
              projectId,
            })),
          },
        },
        include: {
          projects: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        id: createdToken.id,
        name: createdToken.name,
        description: createdToken.description,
        tokenPrefix: createdToken.tokenPrefix,
        token, // Only returned on create
        createdAt: createdToken.createdAt,
        expiresAt: createdToken.expiresAt,
        projects: createdToken.projects.map((tp) => ({
          id: tp.project.id,
          name: tp.project.name,
        })),
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        organizationId: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional().nullable(),
        allowedDomains: z.array(z.string()).optional(),
        projectIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin or owner of organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.organizationId,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: {
                in: ["admin", "owner"],
              },
            },
          },
        },
        include: {
          projects: true,
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Organization not found or you don't have permission to update tokens",
        });
      }

      // Verify token belongs to organization
      const token = await ctx.prisma.apiToken.findFirst({
        where: {
          id: input.id,
          organizationId: input.organizationId,
        },
      });

      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found",
        });
      }

      // If projectIds provided, verify they belong to organization
      if (input.projectIds) {
        const invalidProjectIds = input.projectIds.filter(
          (projectId) => !organization.projects.some((p) => p.id === projectId),
        );

        if (invalidProjectIds.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Projects not found in organization: ${invalidProjectIds.join(", ")}`,
          });
        }
      }

      // Update token
      const updatedToken = await ctx.prisma.apiToken.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.allowedDomains !== undefined && {
            allowedDomains: input.allowedDomains,
          }),
        },
        include: {
          projects: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update project assignments if provided
      if (input.projectIds) {
        // Delete existing assignments
        await ctx.prisma.apiTokenProject.deleteMany({
          where: { tokenId: input.id },
        });

        // Create new assignments
        await ctx.prisma.apiTokenProject.createMany({
          data: input.projectIds.map((projectId) => ({
            tokenId: input.id,
            projectId,
          })),
        });

        // Fetch updated token with new projects
        const tokenWithProjects = await ctx.prisma.apiToken.findUnique({
          where: { id: input.id },
          include: {
            projects: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (!tokenWithProjects) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Token not found after update",
          });
        }

        return {
          id: tokenWithProjects.id,
          name: tokenWithProjects.name,
          description: tokenWithProjects.description,
          tokenPrefix: tokenWithProjects.tokenPrefix,
          createdAt: tokenWithProjects.createdAt,
          lastUsedAt: tokenWithProjects.lastUsedAt,
          expiresAt: tokenWithProjects.expiresAt,
          projects: tokenWithProjects.projects.map((tp) => ({
            id: tp.project.id,
            name: tp.project.name,
          })),
        };
      }

      return {
        id: updatedToken.id,
        name: updatedToken.name,
        description: updatedToken.description,
        tokenPrefix: updatedToken.tokenPrefix,
        createdAt: updatedToken.createdAt,
        lastUsedAt: updatedToken.lastUsedAt,
        expiresAt: updatedToken.expiresAt,
        projects: updatedToken.projects.map((tp) => ({
          id: tp.project.id,
          name: tp.project.name,
        })),
      };
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin or owner of organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.organizationId,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: {
                in: ["admin", "owner"],
              },
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Organization not found or you don't have permission to delete tokens",
        });
      }

      // Verify token belongs to organization
      const token = await ctx.prisma.apiToken.findFirst({
        where: {
          id: input.id,
          organizationId: input.organizationId,
        },
      });

      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found",
        });
      }

      // Delete token (cascade will delete ApiTokenProject entries)
      await ctx.prisma.apiToken.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
