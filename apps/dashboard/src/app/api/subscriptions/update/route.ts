import { polarClient } from "@bklit/auth";
import { prisma } from "@bklit/db/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionId, productId, organizationId } = await request.json();

    if (!(subscriptionId && productId && organizationId)) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId: session.user.id,
            role: {
              in: ["owner", "admin"],
            },
          },
        },
      },
      select: {
        id: true,
        polarCustomerId: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found or insufficient permissions" },
        { status: 403 }
      );
    }

    const subscriptions = await auth.api.subscriptions({
      query: {
        page: 1,
        limit: 10,
        active: true,
        referenceId: organizationId,
      },
      headers: await headers(),
    });

    const subscription = subscriptions?.result?.items?.find(
      (sub) => sub.id === subscriptionId
    );

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found for this organization" },
        { status: 404 }
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
      where: { id: organization.id },
      data: {
        plan: "pro",
      },
    });

    revalidatePath(`/${organization.id}/settings/billing`);
    revalidatePath(`/${organization.id}`);

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error("Subscription update API error:", error);
    return NextResponse.json(
      {
        error: "Failed to update subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
