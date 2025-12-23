import { prisma } from "@bklit/db/client";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

const processedWebhooks = new Set<string>();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();

    const webhookId = `${body.type}-${body.data?.id || body.data?.subscription_id || "unknown"}`;

    if (processedWebhooks.has(webhookId)) {
      return NextResponse.json({
        success: true,
        message: "Webhook already processed",
        webhookId,
      });
    }

    processedWebhooks.add(webhookId);

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

      if (body.type === "checkout.updated") {
        if (body.data?.status === "succeeded") {
          status = "active";
          referenceId = body.data?.metadata?.referenceId;
        } else {
          status = "failed";
          referenceId = body.data?.metadata?.referenceId;
        }
      }

      if (
        (body.type === "subscription.active" ||
          body.type === "subscription.created" ||
          body.type === "subscription.updated" ||
          body.type === "subscription.canceled" ||
          body.type === "subscription.revoked") &&
        !referenceId
      ) {
        const subscription = body.data;
        referenceId =
          subscription?.metadata?.referenceId ||
          subscription?.customer?.metadata?.referenceId ||
          subscription?.customer?.external_id;

        if (!referenceId) {
          return NextResponse.json({
            success: true,
            message:
              "Subscription event without reference_id - no organization update needed",
            eventType: body.type,
          });
        }
      }

      if (referenceId) {
        try {
          let plan = "free";
          let polarCustomerId: string | null = null;
          let billingInterval: string | null = null;

          if (
            body.type === "subscription.active" ||
            body.type === "subscription.created" ||
            body.type === "subscription.updated"
          ) {
            const subscription = body.data;
            plan = "pro";
            polarCustomerId = subscription.customer_id;
            billingInterval = "monthly";
          } else if (
            body.type === "subscription.canceled" ||
            body.type === "subscription.revoked"
          ) {
            const existingOrg = await prisma.organization.findUnique({
              where: { id: referenceId },
              select: { polarCustomerId: true },
            });
            plan = "free";
            polarCustomerId = existingOrg?.polarCustomerId ?? null;
            billingInterval = null;
          } else {
            return NextResponse.json({
              success: true,
              message: "Webhook received but status not handled",
              status: status,
            });
          }

          const updatedOrg = await prisma.organization.update({
            where: { id: referenceId },
            data: {
              plan: plan,
              polarCustomerId: polarCustomerId,
              billingInterval: billingInterval,
            },
          });

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
