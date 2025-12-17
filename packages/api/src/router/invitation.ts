import { authEnv } from "@bklit/auth";
import { sendEmail } from "@bklit/email/client";
import { BklitInvitationEmail } from "@bklit/email/emails/invitation";
import { render } from "@react-email/render";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure } from "../trpc";

const env = authEnv();

export const invitationRouter = {
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        organizationId: z.string(),
        role: z.enum(["member", "admin", "owner"]).default("member"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is owner or admin of organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.organizationId,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: {
                in: ["owner", "admin"],
              },
            },
          },
        },
        include: {
          members: {
            where: {
              userId: ctx.session.user.id,
            },
            include: {
              user: true,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Organization not found or you don't have permission to invite members",
        });
      }

      // Check if user is already a member
      const existingMember = await ctx.prisma.member.findFirst({
        where: {
          organizationId: input.organizationId,
          user: {
            email: input.email,
          },
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This user is already a member of the organization",
        });
      }

      // Check if there's already a pending invitation
      const existingInvitation = await ctx.prisma.invitation.findFirst({
        where: {
          organizationId: input.organizationId,
          email: input.email,
          status: "pending",
        },
      });

      if (existingInvitation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An invitation has already been sent to this email",
        });
      }

      // Create invitation
      const invitation = await ctx.prisma.invitation.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: input.organizationId,
          email: input.email,
          role: input.role,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          inviterId: ctx.session.user.id,
        },
      });

      // Send invitation email
      const inviterName = organization.members[0]?.user.name || "Someone";
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const inviteLink = `${baseUrl}/signin?invited=true&utm_source=email&utm_medium=email&utm_campaign=invitation&utm_content=cta-button`;

      const emailHtml = await render(
        BklitInvitationEmail({
          inviterName,
          organizationName: organization.name,
          inviteLink,
          role: input.role,
        }),
      );

      try {
        await sendEmail({
          to: input.email,
          subject: `You've been invited to join ${organization.name} on Bklit`,
          html: emailHtml,
        });
      } catch (error) {
        console.error("Failed to send invitation email:", error);
        // Don't throw - invitation is created, email failure shouldn't block
      }

      return {
        success: true,
        message: "Invitation sent successfully",
        invitationId: invitation.id,
      };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    // Get invitations for the current user's email
    const invitations = await ctx.prisma.invitation.findMany({
      where: {
        email: ctx.session.user.email,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        expiresAt: "desc",
      },
    });

    return invitations;
  }),

  accept: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Find the invitation
      const invitation = await ctx.prisma.invitation.findUnique({
        where: {
          id: input.invitationId,
        },
        include: {
          organization: true,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Verify it's for the current user
      if (invitation.email !== ctx.session.user.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation is not for you",
        });
      }

      // Check if expired
      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        });
      }

      // Check if already accepted or declined
      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This invitation has already been ${invitation.status}`,
        });
      }

      // Check if user is already a member
      const existingMember = await ctx.prisma.member.findFirst({
        where: {
          organizationId: invitation.organizationId,
          userId: ctx.session.user.id,
        },
      });

      if (existingMember) {
        // Update invitation status but don't create duplicate member
        await ctx.prisma.invitation.update({
          where: { id: input.invitationId },
          data: { status: "accepted" },
        });

        // Check if this is the demo project's organization
        const demoProjectId = env.BKLIT_DEFAULT_PROJECT;
        let isDemoProject = false;

        if (demoProjectId) {
          const demoProject = await ctx.prisma.project.findUnique({
            where: { id: demoProjectId },
            select: { organizationId: true },
          });

          isDemoProject =
            demoProject?.organizationId === invitation.organizationId;
        }

        return {
          success: true,
          message: "You are already a member of this organization",
          organizationId: invitation.organizationId,
          isDemoProject,
        };
      }

      // Create member and update invitation in a transaction
      await ctx.prisma.$transaction([
        ctx.prisma.member.create({
          data: {
            id: crypto.randomUUID(),
            organizationId: invitation.organizationId,
            userId: ctx.session.user.id,
            role: invitation.role || "member",
            createdAt: new Date(),
          },
        }),
        ctx.prisma.invitation.update({
          where: { id: input.invitationId },
          data: { status: "accepted" },
        }),
      ]);

      // Check if this is the demo project's organization
      const demoProjectId = env.BKLIT_DEFAULT_PROJECT;
      let isDemoProject = false;

      if (demoProjectId) {
        const demoProject = await ctx.prisma.project.findUnique({
          where: { id: demoProjectId },
          select: { organizationId: true },
        });

        isDemoProject =
          demoProject?.organizationId === invitation.organizationId;
      }

      return {
        success: true,
        message: `You've joined ${invitation.organization.name}!`,
        organizationId: invitation.organizationId,
        isDemoProject,
      };
    }),

  decline: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Find the invitation
      const invitation = await ctx.prisma.invitation.findUnique({
        where: {
          id: input.invitationId,
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      // Verify it's for the current user
      if (invitation.email !== ctx.session.user.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation is not for you",
        });
      }

      // Update invitation status to declined (or delete it)
      await ctx.prisma.invitation.delete({
        where: { id: input.invitationId },
      });

      return {
        success: true,
        message: "Invitation declined",
      };
    }),
} satisfies TRPCRouterRecord;
