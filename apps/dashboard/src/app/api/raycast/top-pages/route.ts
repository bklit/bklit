import { type NextRequest, NextResponse } from "next/server";
import { getTopPages } from "@/actions/analytics-actions";
import { extractTokenFromHeader, validateApiToken } from "@/lib/api-token-auth";
import { calculateLast24Hours, formatPeriod } from "@/lib/raycast-helpers";
import type {
  RaycastTopCountriesRequest,
  RaycastTopPagesResponse,
} from "@/types/raycast-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RaycastTopCountriesRequest = await request.json();

    if (!body.projectId) {
      return NextResponse.json<RaycastTopPagesResponse>(
        {
          success: false,
          error: "projectId is required",
        },
        { status: 400 }
      );
    }

    // Validate API token
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json<RaycastTopPagesResponse>(
        {
          success: false,
          error: "Authorization token is required",
        },
        { status: 401 }
      );
    }

    const tokenValidation = await validateApiToken(token, body.projectId);
    if (!tokenValidation.valid) {
      return NextResponse.json<RaycastTopPagesResponse>(
        {
          success: false,
          error: tokenValidation.error || "Invalid token",
        },
        { status: 401 }
      );
    }

    // Calculate last 24 hours
    const { startDate, endDate } = calculateLast24Hours();

    // Fetch top pages
    const topPages = await getTopPages({
      projectId: body.projectId,
      userId: "raycast-api", // API doesn't need real userId for server actions
      limit: 5,
      startDate,
      endDate,
    });

    // Format response
    const response: RaycastTopPagesResponse = {
      success: true,
      data: topPages.map((page) => ({
        path: page.path,
        views: page.count,
      })),
      period: formatPeriod(startDate, endDate),
    };

    return NextResponse.json<RaycastTopPagesResponse>(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in Raycast top pages API:", error);
    return NextResponse.json<RaycastTopPagesResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight (if needed in future)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
