import { prisma } from "@bklit/db/client";

/**
 * Webhook helper functions for updating organization plans
 * These functions are used by Polar webhook handlers to sync subscription changes
 */

export type PlanType = "free" | "pro";

// Polar webhook payload types
export interface PolarWebhookPayload {
  type: string;
  data: {
    id?: string;
    reference_id?: string;
    status?: string;
    metadata?: {
      referenceId?: string;
    };
    customer?: {
      id?: string;
      external_id?: string;
      metadata?: {
        referenceId?: string;
      };
    };
  };
}

/**
 * Update an organization's plan
 */
export async function updateOrganizationPlan(
  organizationId: string,
  plan: PlanType
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔥 updateOrganizationPlan called with:", {
      organizationId,
      plan,
    });

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    console.log("🔥 Organization found:", organization);

    if (!organization) {
      console.error(`🔥 Organization ${organizationId} not found`);
      return { success: false, error: "Organization not found" };
    }

    // Update the organization's plan
    console.log(
      `🔥 Updating organization ${organizationId} from ${organization.plan} to ${plan}`
    );

    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: { plan },
    });

    console.log(
      `🔥 Successfully updated organization ${organizationId} plan to ${plan}:`,
      updatedOrg
    );
    return { success: true };
  } catch (error) {
    console.error(
      `🔥 Error updating organization ${organizationId} plan:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get organization from reference ID (used in webhooks)
 */
export async function getOrganizationFromReferenceId(
  referenceId: string
): Promise<{
  success: boolean;
  organization?: { id: string; name: string; plan: string };
  error?: string;
}> {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: referenceId },
    });

    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    return { success: true, organization };
  } catch (error) {
    console.error(`Error fetching organization ${referenceId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Log webhook payload for debugging
 */
export function logWebhookPayload(
  eventType: string,
  payload: Record<string, unknown> | PolarWebhookPayload,
  organizationId?: string
): void {
  console.log(`[Polar Webhook] ${eventType}`, {
    organizationId,
    timestamp: new Date().toISOString(),
    payload: JSON.stringify(payload, null, 2),
  });
}
