"use server";

// import { z } from 'zod'; // Unused, schema is imported directly
import { prisma } from "@bklit/db/client";
import { revalidatePath } from "next/cache";
import { authenticated } from "@/lib/auth";

import { addProjectSchema } from "@/lib/schemas/project-schema";
import type { ProjectFormState } from "@/types/user";

export type FormState = ProjectFormState;

export async function createProjectAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await authenticated();

  if (!session || !session.user || !session.user.id) {
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
    const newSite = await prisma.project.create({
      data: {
        name: validatedFields.data.name,
        domain: validatedFields.data.domain || null,
        organizationId: validatedFields.data.organizationId,
        // userId: session.user.id,
      },
    });

    revalidatePath("/"); // Revalidates all pages, good for dynamic content
    // Consider more specific revalidation if needed, e.g., revalidatePath(`/${newSite.id}`)
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
  formData: FormData,
): Promise<FormState> {
  const session = await authenticated();

  if (!session || !session.user || !session.user.id) {
    return {
      success: false,
      message: "User not authenticated.",
    };
  }

  const projectId = formData.get("projectId") as string;
  const confirmedProjectName = formData.get("confirmedProjectName") as string;

  if (!projectId || !confirmedProjectName) {
    return {
      success: false,
      message: "Missing site ID or project name for confirmation.",
    };
  }

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return {
        success: false,
        message:
          "Project not found or you do not have permission to delete it.",
      };
    }

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

    revalidatePath("/"); // Revalidate paths after deletion
    // Consider revalidating specific paths if more targeted revalidation is beneficial
    // e.g., revalidatePath('/dashboard') or a user-specific projects list page.

    return {
      success: true,
      message: `Project "${project.name}" deleted successfully.`,
      // newprojectId is not relevant here, but FormState includes it as optional
    };
  } catch (error) {
    console.error("Error deleting project:", error);
    return {
      success: false,
      message: "Failed to delete project. Please try again.",
    };
  }
}
