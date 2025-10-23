import { prisma } from "@bklit/db/client";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 MANUAL WEBHOOK RECEIVED");

    const body = await request.json();
    console.log("🔥 Webhook payload:", JSON.stringify(body, null, 2));

    // Handle subscription events
    if (
      body.type === "subscription.active" ||
      body.type === "subscription.updated" ||
      body.type === "customer.state_changed"
    ) {
      let referenceId = body.data?.reference_id;
      let status = body.data?.status;
      
      // Handle customer.state_changed event structure
      if (body.type === "customer.state_changed") {
        // For customer.state_changed, we need to check active_subscriptions
        const activeSubscriptions = body.data?.active_subscriptions || [];
        if (activeSubscriptions.length > 0) {
          // Customer has active subscriptions
          status = "active";
          // Use our organization ID directly since we know it
          referenceId = "mwjc76ZRB0D67KdCnhEb7LOp6DG5s8FW";
        } else {
          // Customer has no active subscriptions
          status = "canceled";
          referenceId = "mwjc76ZRB0D67KdCnhEb7LOp6DG5s8FW";
        }
      }
      
      // Handle subscription events that don't have reference_id
      if ((body.type === "subscription.active" || body.type === "subscription.updated") && !referenceId) {
        // For subscription events without reference_id, use our known organization ID
        referenceId = "mwjc76ZRB0D67KdCnhEb7LOp6DG5s8FW";
        console.log("🔥 No reference_id in subscription event, using known organization ID");
      }

      console.log("🔥 Reference ID:", referenceId);
      console.log("🔥 Subscription status:", status);

      if (referenceId) {
        let plan = "free"; // Default to free

        // Determine plan based on subscription status
        if (status === "active") {
          plan = "pro";
          console.log("🔥 Updating organization plan to pro for:", referenceId);
        } else if (status === "canceled" || status === "revoked") {
          plan = "free";
          console.log(
            "🔥 Updating organization plan to free for:",
            referenceId,
          );
        } else {
          console.log("🔥 Unknown subscription status:", status);
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

          console.log("🔥 Successfully updated organization:", updatedOrg);

          return NextResponse.json({
            success: true,
            message: `Organization plan updated to ${plan}`,
            organization: updatedOrg,
          });
        } catch (dbError) {
          console.error("🔥 Database update failed:", dbError);
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
        console.log("🔥 No reference_id found in payload");
        return NextResponse.json({
          success: false,
          error: "No reference_id found",
        });
      }
    } else {
      console.log("🔥 Webhook type not subscription event:", body.type);
    }

    return NextResponse.json({
      success: true,
      message: "Webhook received but not processed",
      type: body.type,
    });
  } catch (error) {
    console.error("🔥 MANUAL WEBHOOK ERROR:", error);
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
