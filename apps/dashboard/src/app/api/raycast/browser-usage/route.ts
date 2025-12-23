import { type NextRequest, NextResponse } from "next/server";
import { getBrowserStats } from "@/actions/analytics-actions";
import { extractTokenFromHeader, validateApiToken } from "@/lib/api-token-auth";
import {
  calculateLast24Hours,
  calculatePercentage,
  formatPeriod,
} from "@/lib/raycast-helpers";
import type {
  RaycastBrowserUsageResponse,
  RaycastTopCountriesRequest,
} from "@/types/raycast-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RaycastTopCountriesRequest = await request.json();

    if (!body.projectId) {
      return NextResponse.json<RaycastBrowserUsageResponse>(
        {
          success: false,
          error: "projectId is required",
        },
        { status: 400 },
      );
    }

    // Validate API token
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json<RaycastBrowserUsageResponse>(
        {
          success: false,
          error: "Authorization token is required",
        },
        { status: 401 },
      );
    }

    const tokenValidation = await validateApiToken(token, body.projectId);
    if (!tokenValidation.valid) {
      return NextResponse.json<RaycastBrowserUsageResponse>(
        {
          success: false,
          error: tokenValidation.error || "Invalid token",
        },
        { status: 401 },
      );
    }

    // Calculate last 24 hours
    const { startDate, endDate } = calculateLast24Hours();

    // Fetch browser stats
    const browserStats = await getBrowserStats({
      projectId: body.projectId,
      userId: "raycast-api", // API doesn't need real userId for server actions
      startDate,
      endDate,
    });

    // Calculate total for percentages
    const total = browserStats.reduce((sum, stat) => sum + stat.count, 0);

    // Get top 5 browsers
    const top5Browsers = browserStats.slice(0, 5);

    // Format response
    const response: RaycastBrowserUsageResponse = {
      success: true,
      data: top5Browsers.map((stat) => ({
        browser: stat.browser,
        views: stat.count,
        percentage: calculatePercentage(stat.count, total),
      })),
      period: formatPeriod(startDate, endDate),
    };

    return NextResponse.json<RaycastBrowserUsageResponse>(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in Raycast browser usage API:", error);
    return NextResponse.json<RaycastBrowserUsageResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
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
