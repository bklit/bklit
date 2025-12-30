import { TRPCError } from "@trpc/server";
import "@bklit/extensions"; // Import to register all extensions
import { extensionRegistry } from "@bklit/extensions/core";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const extensionRouter = createTRPCRouter({
  // List all available extensions
  listAvailable: protectedProcedure.query(async () => {
    return extensionRegistry.getAllMetadata();
  }),

  // Get extension details
  get: protectedProcedure
    .input(z.object({ extensionId: z.string() }))
    .query(async ({ input }) => {
      const extension = extensionRegistry.get(input.extensionId);
      if (!extension) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Extension ${input.extensionId} not found`,
        });
      }
      return {
        ...extension.metadata,
        id: input.extensionId,
      };
    }),

  // Activate extension to projects
  activate: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        extensionId: z.string(),
        projectIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user has access to organization
      const member = await ctx.prisma.member.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: { in: ["owner", "admin"] },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage extensions",
        });
      }

      // Verify extension exists
      const extension = extensionRegistry.get(input.extensionId);
      if (!extension) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Extension ${input.extensionId} not found`,
        });
      }

      // Verify all projects belong to the organization
      const projects = await ctx.prisma.project.findMany({
        where: {
          id: { in: input.projectIds },
          organizationId: input.organizationId,
        },
      });

      if (projects.length !== input.projectIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some projects do not belong to this organization",
        });
      }

      // Create ProjectExtension records with default config
      const results = await Promise.all(
        input.projectIds.map((projectId) =>
          ctx.prisma.projectExtension.upsert({
            where: {
              projectId_extensionId: {
                projectId,
                extensionId: input.extensionId,
              },
            },
            create: {
              projectId,
              extensionId: input.extensionId,
              enabled: false, // Disabled by default, user configures in project settings
              config: {}, // Empty config, user fills in project settings
            },
            update: {}, // If already exists, do nothing
          }),
        ),
      );

      return { success: true, count: results.length };
    }),

  // List extensions for a project
  listForProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const extensions = await ctx.prisma.projectExtension.findMany({
        where: { projectId: input.projectId },
        include: {
          eventDefinitions: {
            include: {
              eventDefinition: true,
            },
          },
        },
      });

      return extensions.map((ext) => {
        const metadata = extensionRegistry.get(ext.extensionId)?.metadata;
        return {
          ...ext,
          metadata,
          eventDefinitions: ext.eventDefinitions.map(
            (ed) => ed.eventDefinition,
          ),
        };
      });
    }),

  // List projects in an organization that have a specific extension activated
  listForOrganization: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        extensionId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Get all projects in the organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.organizationId,
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

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const projectIds = organization.projects.map((p) => p.id);

      // Find which projects have this extension
      const extensions = await ctx.prisma.projectExtension.findMany({
        where: {
          projectId: { in: projectIds },
          extensionId: input.extensionId,
        },
      });

      return extensions;
    }),

  // Update extension configuration
  updateConfig: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        extensionId: z.string(),
        config: z.record(z.unknown()),
        eventDefinitionIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user has access to project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organization: {
            members: {
              some: {
                userId: ctx.session.user.id,
                role: { in: ["owner", "admin", "member"] },
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

      // Validate config against extension schema
      const validatedConfig = extensionRegistry.validateConfig(
        input.extensionId,
        input.config,
      );

      // Find the project extension
      const projectExtension = await ctx.prisma.projectExtension.findUnique({
        where: {
          projectId_extensionId: {
            projectId: input.projectId,
            extensionId: input.extensionId,
          },
        },
      });

      if (!projectExtension) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Extension not activated for this project",
        });
      }

      // Update config
      const updated = await ctx.prisma.projectExtension.update({
        where: { id: projectExtension.id },
        data: {
          config: validatedConfig as object,
        },
      });

      // Update event definitions (M2M)
      // Delete existing relations
      await ctx.prisma.projectExtensionEvent.deleteMany({
        where: { projectExtensionId: projectExtension.id },
      });

      // Create new relations
      if (input.eventDefinitionIds.length > 0) {
        await ctx.prisma.projectExtensionEvent.createMany({
          data: input.eventDefinitionIds.map((eventDefinitionId) => ({
            projectExtensionId: projectExtension.id,
            eventDefinitionId,
          })),
        });
      }

      return updated;
    }),

  // Toggle extension on/off
  toggle: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        extensionId: z.string(),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify access
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organization: {
            members: {
              some: {
                userId: ctx.session.user.id,
                role: { in: ["owner", "admin", "member"] },
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

      const updated = await ctx.prisma.projectExtension.update({
        where: {
          projectId_extensionId: {
            projectId: input.projectId,
            extensionId: input.extensionId,
          },
        },
        data: { enabled: input.enabled },
      });

      return updated;
    }),

  // Remove extension from project(s)
  remove: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        extensionId: z.string(),
        projectIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user has access to organization
      const member = await ctx.prisma.member.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
          role: { in: ["owner", "admin"] },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage extensions",
        });
      }

      // Verify all projects belong to the organization
      const projects = await ctx.prisma.project.findMany({
        where: {
          id: { in: input.projectIds },
          organizationId: input.organizationId,
        },
      });

      if (projects.length !== input.projectIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some projects do not belong to this organization",
        });
      }

      // Remove from all specified projects
      await ctx.prisma.projectExtension.deleteMany({
        where: {
          projectId: { in: input.projectIds },
          extensionId: input.extensionId,
        },
      });

      return { success: true, count: input.projectIds.length };
    }),

  // Test extension (send test message)
  test: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        extensionId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const projectExtension = await ctx.prisma.projectExtension.findUnique({
        where: {
          projectId_extensionId: {
            projectId: input.projectId,
            extensionId: input.extensionId,
          },
        },
      });

      if (!projectExtension) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Extension not found for this project",
        });
      }

      const handler = extensionRegistry.getHandler(input.extensionId);
      const config = extensionRegistry.validateConfig(
        input.extensionId,
        projectExtension.config,
      );

      const testEvent = {
        trackingId: "test-event",
        eventType: "test",
        metadata: {
          message: "This is a test event from Bklit",
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        projectId: input.projectId,
      };

      try {
        await handler(config, testEvent);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Test failed",
        });
      }
    }),
});
