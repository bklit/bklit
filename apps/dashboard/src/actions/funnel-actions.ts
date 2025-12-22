"use server";

import { prisma } from "@bklit/db/client";
import { hasPermission, MemberRole } from "@bklit/utils/roles";
import { authenticated } from "@/lib/auth";

interface StepData {
  type: "pageview" | "event";
  name: string;
  url?: string;
  eventName?: string;
  eventCode?: string;
  positionX: number;
  positionY: number;
}

export async function createFunnel(data: {
  name: string;
  description?: string;
  projectId: string;
  organizationId: string;
  steps: StepData[];
  endDate?: Date;
}) {
  try {
    const session = await authenticated();

    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        organizationId: data.organizationId,
      },
      include: {
        organization: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (
      !(project && project.organization) ||
      project.organization.members.length === 0
    ) {
      return { success: false, error: "Forbidden" };
    }

    // Check if user is admin or owner
    const userMembership = project.organization.members[0];
    if (
      !(userMembership && hasPermission(userMembership.role, MemberRole.ADMIN))
    ) {
      return {
        success: false,
        error: "Only administrators can create funnels",
      };
    }

    if (data.steps.length === 0) {
      return {
        success: false,
        error: "A funnel must have at least one step",
      };
    }

    // Sort steps by positionX (left to right) to calculate stepOrder
    const sortedSteps = [...data.steps].sort(
      (a, b) => a.positionX - b.positionX
    );

    const funnel = await prisma.funnel.create({
      data: {
        name: data.name,
        description: data.description,
        projectId: data.projectId,
        endDate: data.endDate,
        steps: {
          create: sortedSteps.map((step, index) => ({
            type: step.type,
            name: step.name,
            url: step.url,
            eventName: step.eventName,
            eventCode: step.eventCode,
            positionX: step.positionX,
            positionY: step.positionY,
            stepOrder: index + 1,
          })),
        },
      },
      include: {
        steps: {
          orderBy: {
            stepOrder: "asc",
          },
        },
      },
    });

    return { success: true, data: funnel };
  } catch (error) {
    console.error("Error creating funnel:", error);
    return { success: false, error: "Failed to create funnel" };
  }
}

export async function updateFunnel(data: {
  funnelId: string;
  projectId: string;
  organizationId: string;
  name?: string;
  description?: string;
  steps?: StepData[];
  endDate?: Date | null;
}) {
  try {
    const session = await authenticated();

    const funnel = await prisma.funnel.findFirst({
      where: {
        id: data.funnelId,
        projectId: data.projectId,
      },
      include: {
        project: {
          include: {
            organization: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (
      !(funnel && funnel.project.organization) ||
      funnel.project.organization.members.length === 0
    ) {
      return { success: false, error: "Forbidden" };
    }

    // Check if user is admin or owner
    const userMembership = funnel.project.organization.members[0];
    if (
      !(userMembership && hasPermission(userMembership.role, MemberRole.ADMIN))
    ) {
      return {
        success: false,
        error: "Only administrators can update funnels",
      };
    }

    // If steps are provided, update them
    if (data.steps) {
      if (data.steps.length === 0) {
        return {
          success: false,
          error: "A funnel must have at least one step",
        };
      }

      // Sort steps by positionX to calculate stepOrder
      const sortedSteps = [...data.steps].sort(
        (a, b) => a.positionX - b.positionX
      );

      // Delete all existing steps and create new ones atomically
      await prisma.$transaction(async (tx) => {
        await tx.funnelStep.deleteMany({
          where: {
            funnelId: data.funnelId,
          },
        });

        await tx.funnelStep.createMany({
          data: sortedSteps.map((step, index) => ({
            funnelId: data.funnelId,
            type: step.type,
            name: step.name,
            url: step.url,
            eventName: step.eventName,
            eventCode: step.eventCode,
            positionX: step.positionX,
            positionY: step.positionY,
            stepOrder: index + 1,
          })),
        });
      });
    }

    // Update funnel fields
    const updatedFunnel = await prisma.funnel.update({
      where: {
        id: data.funnelId,
      },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
      },
      include: {
        steps: {
          orderBy: {
            stepOrder: "asc",
          },
        },
      },
    });

    return { success: true, data: updatedFunnel };
  } catch (error) {
    console.error("Error updating funnel:", error);
    return { success: false, error: "Failed to update funnel" };
  }
}

export async function deleteFunnel(data: {
  funnelId: string;
  organizationId: string;
}) {
  try {
    const session = await authenticated();

    const funnel = await prisma.funnel.findFirst({
      where: {
        id: data.funnelId,
        project: {
          organizationId: data.organizationId,
        },
      },
      include: {
        project: {
          include: {
            organization: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (
      !(funnel && funnel.project.organization) ||
      funnel.project.organization.members.length === 0
    ) {
      return { success: false, error: "Forbidden" };
    }

    // Check if user is admin or owner
    const userMembership = funnel.project.organization.members[0];
    if (
      !(userMembership && hasPermission(userMembership.role, MemberRole.ADMIN))
    ) {
      return {
        success: false,
        error: "Only administrators can delete funnels",
      };
    }

    // Delete funnel (steps will be cascade deleted)
    await prisma.funnel.delete({
      where: {
        id: data.funnelId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting funnel:", error);
    return { success: false, error: "Failed to delete funnel" };
  }
}
