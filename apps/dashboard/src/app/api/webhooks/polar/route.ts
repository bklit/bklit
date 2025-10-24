import { prisma } from "@bklit/db/client";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

// Simple in-memory cache for webhook deduplication (in production, use Redis)
const processedWebhooks = new Set<string>();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();

    // Create a unique identifier for this webhook
    const webhookId = `${body.type}-${body.data?.id || body.data?.subscription_id || "unknown"}`;

    // Check if we've already processed this webhook
    if (processedWebhooks.has(webhookId)) {
      return NextResponse.json({
        success: true,
        message: "Webhook already processed",
        webhookId,
      });
    }

    // Mark this webhook as processed
    processedWebhooks.add(webhookId);

    // Only process events we care about
    const relevantEvents = [
      "subscription.active",
      "subscription.created",
      "subscription.updated",
      "subscription.canceled",
      "subscription.revoked",
      "checkout.updated",
    ];

    if (relevantEvents.includes(body.type)) {
      let referenceId = body.data?.reference_id;
      let status = body.data?.status;

      // Handle checkout.updated event structure
      if (body.type === "checkout.updated") {
        // For checkout.updated, check if checkout succeeded
        if (body.data?.status === "succeeded") {
          status = "active";
          // Get reference ID from metadata
          referenceId = body.data?.metadata?.referenceId;
        } else {
          status = "failed";
          referenceId = body.data?.metadata?.referenceId;
        }
      }

      // Handle subscription events that don't have reference_id
      if (
        (body.type === "subscription.active" ||
          body.type === "subscription.created" ||
          body.type === "subscription.updated" ||
          body.type === "subscription.canceled" ||
          body.type === "subscription.revoked") &&
        !referenceId
      ) {
        // Try to extract reference_id from subscription metadata or customer data
        const subscription = body.data;
        referenceId =
          subscription?.metadata?.referenceId ||
          subscription?.customer?.metadata?.referenceId ||
          subscription?.customer?.external_id;

        if (!referenceId) {
          // For subscription events without reference_id, we can't update the organization
          // This is normal for some subscription lifecycle events
          return NextResponse.json({
            success: true,
            message:
              "Subscription event without reference_id - no organization update needed",
            eventType: body.type,
          });
        }
      }

      if (referenceId) {
        let plan = "free"; // Default to free

        // Determine plan based on subscription status
        if (status === "active") {
          plan = "pro";
        } else if (status === "canceled" || status === "revoked") {
          plan = "free";
        } else {
          return NextResponse.json({
            success: true,
            message: "Webhook received but status not handled",
            status: status,
          });
        }

        try {
          // Direct database update
          const updatedOrg = await prisma.organization.update({
            where: { id: referenceId },
            data: { plan: plan },
          });

          // Revalidate the organization pages to ensure fresh data
          revalidatePath(`/${referenceId}/settings/billing`);
          revalidatePath(`/${referenceId}`);
          revalidatePath(`/settings/billing`);

          const processingTime = Date.now() - startTime;

          return NextResponse.json({
            success: true,
            message: `Organization plan updated to ${plan}`,
            organization: updatedOrg,
            processingTime: `${processingTime}ms`,
          });
        } catch (dbError) {
          return NextResponse.json(
            {
              success: false,
              error: "Database update failed",
              details:
                dbError instanceof Error
                  ? dbError.message
                  : "Unknown database error",
            },
            { status: 500 },
          );
        }
      } else {
        return NextResponse.json({
          success: false,
          error: "No reference_id found",
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        message: "Webhook received but not processed - event type not relevant",
        type: body.type,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Polar webhook endpoint is working",
    timestamp: new Date().toISOString(),
  });
}
