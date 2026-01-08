"use server";

import { prisma } from "@bklit/db/client";
import { sendEmail } from "@bklit/email/client";
import { BklitNewProjectEmail } from "@bklit/email/emails/new-project";
import { revalidatePath } from "next/cache";
import { authenticated } from "@/lib/auth";
import { addProjectSchema } from "@/lib/schemas/project-schema";
import type { ProjectFormState } from "@/types/user";

export type FormState = ProjectFormState;

export async function createProjectAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await authenticated();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "User not authenticated.",
    };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = addProjectSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // Verify user is admin or owner of the organization
    const membership = await prisma.member.findFirst({
      where: {
        organizationId: validatedFields.data.organizationId,
        userId: session.user.id,
        role: {
          in: ["admin", "owner"],
        },
      },
    });

    if (!membership) {
      return {
        success: false,
        message:
          "You don't have permission to create projects in this organization.",
      };
    }

    const newSite = await prisma.project.create({
      data: {
        name: validatedFields.data.name,
        domain: validatedFields.data.domain,
        organizationId: validatedFields.data.organizationId,
      },
    });

    // Send email notification
    const userEmail = session.user.email;
    const userName =
      session.user.name || session.user.email?.split("@")[0] || "there";

    if (userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          from: "noreply@bklit.com",
          subject: `❖ Bklit - Your project "${newSite.name}" is ready to use`,
          react: BklitNewProjectEmail({
            username: userName,
            projectName: newSite.name,
            projectId: newSite.id,
          }),
        });
      } catch (emailError) {
        // Don't fail project creation if email fails
        console.error("Failed to send project creation email:", emailError);
      }
    }

    revalidatePath("/");
    return {
      success: true,
      message: "Project created successfully!",
      newprojectId: newSite.id,
    };
  } catch (error) {
    console.error("Error creating project:", error);
    return {
      success: false,
      message: "Failed to create project. Please try again.",
    };
  }
}

// New action to delete a project
export async function deleteProjectAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await authenticated();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "User not authenticated.",
    };
  }

  const projectId = formData.get("projectId") as string;
  const confirmedProjectName = formData.get("confirmedProjectName") as string;

  if (!(projectId && confirmedProjectName)) {
    return {
      success: false,
      message: "Missing site ID or project name for confirmation.",
    };
  }

  try {
    // Fetch project with organization and user membership
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return {
        success: false,
        message: "Project not found.",
      };
    }

    // Check if user is a member of the organization
    const userMembership = project.organization?.members[0];

    if (!userMembership) {
      return {
        success: false,
        message: "You don't have permission to delete this project.",
      };
    }

    // Only owners can delete projects
    if (userMembership.role !== "owner") {
      return {
        success: false,
        message: "Only organization owners can delete projects.",
      };
    }

    // Verify project name matches
    if (project.name !== confirmedProjectName) {
      return {
        success: false,
        message: "The entered project name does not match. Deletion cancelled.",
      };
    }

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    revalidatePath("/");

    return {
      success: true,
      message: `Project "${project.name}" deleted successfully.`,
    };
  } catch (error) {
    console.error("Error deleting project:", error);
    return {
      success: false,
      message: "Failed to delete project. Please try again.",
    };
  }
}
