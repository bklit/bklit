"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth/server";
import { authenticated } from "@/lib/auth";
import { api } from "@/trpc/server";

const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Organization name must be at least 2 characters long.",
    })
    .max(50, { message: "Organization name must be 50 characters or less." }),
  description: z
    .string()
    .max(200, { message: "Description must be 200 characters or less." })
    .optional(),
});

export interface OrganizationFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  newOrganizationId?: string;
}

export async function createOrganizationAction(
  _prevState: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  const session = await authenticated();

  if (!session || !session.user || !session.user.id) {
    return {
      success: false,
      message: "User not authenticated.",
      newOrganizationId: undefined,
      errors: {},
    };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = createOrganizationSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
      newOrganizationId: undefined,
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
        newOrganizationId: undefined,
        errors: {},
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
      errors: {},
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    return {
      success: false,
      message: "Failed to create organization. Please try again.",
      newOrganizationId: undefined,
      errors: {},
    };
  }
}

// Action to update organization name
export async function updateOrganizationNameAction(
  organizationId: string,
  name: string,
): Promise<{ success: boolean; message: string }> {
  const session = await authenticated();

  if (!session || !session.user || !session.user.id) {
    return {
      success: false,
      message: "User not authenticated.",
    };
  }

  // Validate the name
  const nameValidation = z
    .string()
    .min(2, {
      message: "Organization name must be at least 2 characters long.",
    })
    .max(50, { message: "Organization name must be 50 characters or less." })
    .safeParse(name);

  if (!nameValidation.success) {
    return {
      success: false,
      message:
        nameValidation.error.errors[0]?.message || "Invalid name format.",
    };
  }

  try {
    // Generate a URL-friendly slug from the organization name
    const slug = nameValidation.data
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists (excluding current organization)
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

    await auth.api.updateOrganization({
      body: {
        organizationId,
        data: {
          name: nameValidation.data,
          slug: slug,
        },
      },
      headers: await headers(),
    });

    revalidatePath(`/[organizationId]`, "page");
    return {
      success: true,
      message: "Organization name updated successfully!",
    };
  } catch (error) {
    console.error("Error updating organization name:", error);
    return {
      success: false,
      message: "Failed to update organization name. Please try again.",
    };
  }
}

// Action to update organization theme
export async function updateOrganizationThemeAction(
  organizationId: string,
  theme: string,
): Promise<{ success: boolean; message: string }> {
  const session = await authenticated();

  if (!session || !session.user || !session.user.id) {
    return {
      success: false,
      message: "User not authenticated.",
    };
  }

  // Validate the theme
  const validThemes = ["spring", "summer", "autumn", "winter"];
  if (!validThemes.includes(theme)) {
    return {
      success: false,
      message: "Invalid theme selection.",
    };
  }

  try {
    // Use the tRPC server caller directly
    await api.organization.update({
      id: organizationId,
      theme,
    });

    revalidatePath(`/[organizationId]`, "page");
    return {
      success: true,
      message: "Organization theme updated successfully!",
    };
  } catch (error) {
    console.error("Error updating organization theme:", error);
    return {
      success: false,
      message: "Failed to update organization theme. Please try again.",
    };
  }
}

// Action to delete an organization
export async function deleteOrganizationAction(
  _prevState: OrganizationFormState,
  formData: FormData,
): Promise<OrganizationFormState> {
  const session = await authenticated();

  if (!session || !session.user || !session.user.id) {
    return {
      success: false,
      message: "User not authenticated.",
    };
  }

  const organizationId = formData.get("organizationId") as string;
  const confirmedOrganizationName = formData.get(
    "confirmedOrganizationName",
  ) as string;

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
