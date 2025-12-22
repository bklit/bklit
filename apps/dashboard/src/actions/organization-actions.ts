"use server";

import { prisma } from "@bklit/db/client";
import { sendEmail } from "@bklit/email/client";
import { BklitNewWorkspaceEmail } from "@bklit/email/emails/new-workspace";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth/server";
import { authenticated } from "@/lib/auth";
import { api } from "@/trpc/server";

/**
 * Generate a unique slug by appending -1, -2, -3, etc. if slug already exists
 */
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  // Check if base slug is available
  const existing = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!existing) {
    return slug;
  }

  // Try with incremented suffixes until we find an available one
  while (counter < 100) {
    // Safety limit to prevent infinite loop
    slug = `${baseSlug}-${counter}`;
    const exists = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!exists) {
      return slug;
    }

    counter++;
  }

  // Fallback: add timestamp if we somehow hit the limit
  return `${baseSlug}-${Date.now()}`;
}

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
  formData: FormData
): Promise<OrganizationFormState> {
  const session = await authenticated();

  if (!(session && session.user && session.user.id)) {
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
    // Check if user is super admin (bypasses limits)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const isSuperAdmin = user?.role === "super_admin";

    // Check if user already owns an organization (skip for super admin)
    if (!isSuperAdmin) {
      const existingOrganizations = await api.organization.list();
      const ownedOrganizations = existingOrganizations.filter((org) =>
        org.members.some(
          (member) =>
            member.userId === session.user.id && member.role === "owner"
        )
      );

      if (ownedOrganizations.length >= 1) {
        return {
          success: false,
          message:
            "You can only create one organization. Delete your existing organization to create a new one.",
          newOrganizationId: undefined,
          errors: {},
        };
      }
    }

    // Generate a URL-friendly base slug from the organization name
    const baseSlug = validatedFields.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Generate unique slug with auto-incrementing suffix if needed
    const slug = await generateUniqueSlug(baseSlug);

    // Double-check at database level (race condition protection) - skip for super admin
    if (!isSuperAdmin) {
      const doubleCheck = await api.organization.list();
      const doubleCheckOwned = doubleCheck.filter((org) =>
        org.members.some(
          (member) =>
            member.userId === session.user.id && member.role === "owner"
        )
      );

      if (doubleCheckOwned.length >= 1) {
        return {
          success: false,
          message:
            "You can only create one organization. Delete your existing organization to create a new one.",
          newOrganizationId: undefined,
          errors: {},
        };
      }
    }

    const organization = await auth.api.createOrganization({
      body: {
        name: validatedFields.data.name,
        slug,
        metadata: {
          description: validatedFields.data.description || null,
        },
      },
      headers: await headers(),
    });

    // Send email notification
    const userEmail = session.user.email;
    const userName =
      session.user.name || session.user.email?.split("@")[0] || "there";

    if (userEmail && organization?.id) {
      try {
        await sendEmail({
          to: userEmail,
          from: "noreply@bklit.com",
          subject: `❖ Bklit - Your workspace "${validatedFields.data.name}" is ready to use`,
          react: BklitNewWorkspaceEmail({
            username: userName,
            workspaceName: validatedFields.data.name,
          }),
        });
      } catch (emailError) {
        // Don't fail organization creation if email fails
        console.error("Failed to send workspace creation email:", emailError);
      }
    }

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
  name: string
): Promise<{ success: boolean; message: string }> {
  const session = await authenticated();

  if (!(session && session.user && session.user.id)) {
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
    // Generate a URL-friendly base slug from the organization name
    const baseSlug = nameValidation.data
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // For updates, we need to check if the slug is available (excluding current org)
    const currentOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { slug: true },
    });

    let slug = baseSlug;

    // If the new slug is different from the current one, ensure it's unique
    if (currentOrg?.slug !== baseSlug) {
      slug = await generateUniqueSlug(baseSlug);
    }

    await auth.api.updateOrganization({
      body: {
        organizationId,
        data: {
          name: nameValidation.data,
          slug,
        },
      },
      headers: await headers(),
    });

    revalidatePath("/[organizationId]", "page");
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
  theme: string
): Promise<{ success: boolean; message: string }> {
  const session = await authenticated();

  if (!(session && session.user && session.user.id)) {
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

    revalidatePath("/[organizationId]", "page");
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
  formData: FormData
): Promise<OrganizationFormState> {
  const session = await authenticated();

  if (!(session && session.user && session.user.id)) {
    return {
      success: false,
      message: "User not authenticated.",
    };
  }

  const organizationId = formData.get("organizationId") as string;
  const confirmedOrganizationName = formData.get(
    "confirmedOrganizationName"
  ) as string;

  if (!(organizationId && confirmedOrganizationName)) {
    return {
      success: false,
      message: "Missing organization ID or organization name for confirmation.",
    };
  }

  try {
    await auth.api.deleteOrganization({
      body: {
        organizationId,
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
