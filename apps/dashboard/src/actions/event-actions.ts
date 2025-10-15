"use server";

import { prisma } from "@bklit/db/client";
import { authenticated } from "@/lib/auth";

export async function createEvent(data: {
  name: string;
  description?: string;
  trackingId: string;
  projectId: string;
  organizationId: string;
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
      !project ||
      !project.organization ||
      project.organization.members.length === 0
    ) {
      return { success: false, error: "Forbidden" };
    }

    const existingEvent = await prisma.eventDefinition.findUnique({
      where: {
        projectId_trackingId: {
          projectId: data.projectId,
          trackingId: data.trackingId,
        },
      },
    });

    if (existingEvent) {
      return {
        success: false,
        error: "An event with this tracking ID already exists for this project",
      };
    }

    const event = await prisma.eventDefinition.create({
      data: {
        name: data.name,
        description: data.description,
        trackingId: data.trackingId,
        projectId: data.projectId,
      },
    });

    return { success: true, data: event };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(data: {
  id: string;
  name?: string;
  description?: string;
  trackingId?: string;
  organizationId: string;
}) {
  try {
    const session = await authenticated();

    const event = await prisma.eventDefinition.findUnique({
      where: { id: data.id },
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
      !event ||
      !event.project.organization ||
      event.project.organization.members.length === 0
    ) {
      return { success: false, error: "Forbidden" };
    }

    if (data.trackingId && data.trackingId !== event.trackingId) {
      const existingEvent = await prisma.eventDefinition.findUnique({
        where: {
          projectId_trackingId: {
            projectId: event.projectId,
            trackingId: data.trackingId,
          },
        },
      });

      if (existingEvent) {
        return {
          success: false,
          error:
            "An event with this tracking ID already exists for this project",
        };
      }
    }

    const updatedEvent = await prisma.eventDefinition.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        trackingId: data.trackingId,
      },
    });

    return { success: true, data: updatedEvent };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteEvent(data: {
  id: string;
  organizationId: string;
}) {
  try {
    const session = await authenticated();

    const event = await prisma.eventDefinition.findUnique({
      where: { id: data.id },
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
      !event ||
      !event.project.organization ||
      event.project.organization.members.length === 0
    ) {
      return { success: false, error: "Forbidden" };
    }

    await prisma.eventDefinition.delete({
      where: { id: data.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
