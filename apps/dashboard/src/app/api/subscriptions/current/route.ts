import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json(
      { error: "Missing organizationId" },
      { status: 400 },
    );
  }

  try {
    const subscriptions = await auth.api.subscriptions({
      query: {
        page: 1,
        limit: 1,
        active: true,
        referenceId: organizationId,
      },
      headers: request.headers,
    });

    const activeSubscription = subscriptions.result.items[0] || null;

    return NextResponse.json({ subscription: activeSubscription });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 },
    );
  }
}
