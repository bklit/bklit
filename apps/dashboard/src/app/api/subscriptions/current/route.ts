import { prisma } from "@bklit/db/client";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found or no access" },
        { status: 403 }
      );
    }

    const subscriptions = await auth.api.subscriptions({
      query: {
        page: 1,
        limit: 1,
        active: true,
        referenceId: organization.id,
      },
      headers: await headers(),
    });

    const activeSubscription = subscriptions.result.items[0] || null;

    return NextResponse.json({ subscription: activeSubscription });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
