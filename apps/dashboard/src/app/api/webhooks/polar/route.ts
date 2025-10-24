import { prisma } from "@bklit/db/client";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 MANUAL WEBHOOK RECEIVED");

    const body = await request.json();
    console.log("🔥 Webhook payload:", JSON.stringify(body, null, 2));

    // Handle subscription and checkout events
    if (
      body.type === "subscription.active" ||
      body.type === "subscription.updated" ||
      body.type === "customer.state_changed" ||
      body.type === "checkout.updated"
    ) {
      let referenceId = body.data?.reference_id;
      let status = body.data?.status;

      // Handle checkout.updated event structure
      if (body.type === "checkout.updated") {
        // For checkout.updated, check if checkout succeeded
        if (body.data?.status === "succeeded") {
          status = "active";
          // Get reference ID from metadata
          referenceId = body.data?.metadata?.referenceId;
          console.log("🔥 Checkout succeeded, reference ID:", referenceId);
        } else {
          status = "failed";
          referenceId = body.data?.metadata?.referenceId;
        }
      }

      // Handle customer.state_changed event structure
      if (body.type === "customer.state_changed") {
        // For customer.state_changed, we need to check active_subscriptions
        const activeSubscriptions = body.data?.active_subscriptions || [];
        if (activeSubscriptions.length > 0) {
          // Customer has active subscriptions - we need to find the organization
          // by looking up the customer in our database
          status = "active";
          // TODO: Implement customer lookup to find organization
          console.error(
            "🔥 customer.state_changed with active subscriptions - need to implement customer lookup",
          );
          return NextResponse.json(
            {
              success: false,
              error:
                "customer.state_changed with active subscriptions not yet implemented",
            },
            { status: 501 },
          );
        } else {
          // Customer has no active subscriptions - we need to find the organization
          status = "canceled";
          // TODO: Implement customer lookup to find organization
          console.error(
            "🔥 customer.state_changed with no active subscriptions - need to implement customer lookup",
          );
          return NextResponse.json(
            {
              success: false,
              error:
                "customer.state_changed with no active subscriptions not yet implemented",
            },
            { status: 501 },
          );
        }
      }

      // Handle subscription events that don't have reference_id
      if (
        (body.type === "subscription.active" ||
          body.type === "subscription.updated") &&
        !referenceId
      ) {
        console.error("🔥 No reference_id found in subscription event");
        return NextResponse.json(
          {
            success: false,
            error: "No reference_id found in subscription event",
            eventType: body.type,
          },
          { status: 400 },
        );
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

          // Revalidate the organization pages to ensure fresh data
          revalidatePath(`/${referenceId}/settings/billing`);
          revalidatePath(`/${referenceId}`);
          revalidatePath(`/settings/billing`);

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
