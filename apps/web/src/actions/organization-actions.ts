"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authenticated } from "@/lib/auth";
import type { OrganizationFormState } from "@/types/user";
import { auth } from "@/auth/server";
import { headers } from "next/headers";

const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Organization name must be at least 2 characters long." })
    .max(50, { message: "Organization name must be 50 characters or less." }),
  description: z
    .string()
    .max(200, { message: "Description must be 200 characters or less." })
    .optional(),
});

export type { OrganizationFormState };

export async function createOrganizationAction(
  _prevState: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  const session = await authenticated({ redirect: false });

  if (!session || !session.user || !session.user.id) {
    return {
      success: false,
      message: "User not authenticated.",
    };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = createOrganizationSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // Generate a URL-friendly slug from the organization name
    const slug = validatedFields.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const data = await auth.api.checkOrganizationSlug({
      body: {
        slug,
      },
    });

    if (data.status === false) {
      return {
        success: false,
        message:
          "An organization with this name already exists. Please choose a different name.",
      };
    }

    const organization = await auth.api.createOrganization({
      body: {
        name: validatedFields.data.name,
        slug: slug,
        metadata: {
          description: validatedFields.data.description || null,
        },
      },
      headers: await headers(),
    });

    revalidatePath("/");
    return {
      success: true,
      message: "Organization created successfully!",
      newOrganizationId: organization?.id,
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    return {
      success: false,
      message: "Failed to create organization. Please try again.",
    };
  }
}

// Action to delete an organization
export async function deleteOrganizationAction(
  _prevState: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  const session = await authenticated({ redirect: false });

  if (!session || !session.user || !session.user.id) {
    return {
      success: false,
      message: "User not authenticated.",
    };
  }

  const organizationId = formData.get("organizationId") as string;
  const confirmedOrganizationName = formData.get("confirmedOrganizationName") as string;

  if (!organizationId || !confirmedOrganizationName) {
    return {
      success: false,
      message: "Missing organization ID or organization name for confirmation.",
    };
  }

  try {
    await auth.api.deleteOrganization({
      body: {
        organizationId: organizationId,
      },
      headers: await headers(),
    });

    return {
      success: true,
      message: `Organization "${confirmedOrganizationName}" deleted successfully.`,
    };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return {
      success: false,
      message: "Failed to delete organization. Please try again.", 
    };
  }
}
