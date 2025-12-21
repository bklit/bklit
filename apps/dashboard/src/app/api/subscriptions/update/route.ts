import { polarClient } from "@bklit/auth";
import { prisma } from "@bklit/db/client";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, productId, organizationId } = await request.json();

    if (!subscriptionId || !productId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const updated = await polarClient.subscriptions.update({
      id: subscriptionId,
      subscriptionUpdate: {
        productId,
        prorationBehavior: "prorate",
      },
    });

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan: "pro",
      },
    });

    revalidatePath(`/${organizationId}/settings/billing`);
    revalidatePath(`/${organizationId}`);

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error("Subscription update API error:", error);
    return NextResponse.json(
      {
        error: "Failed to update subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
