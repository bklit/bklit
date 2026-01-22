import { AnalyticsService } from "@bklit/analytics/service";
import { type NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, validateApiToken } from "@/lib/api-token-auth";
import {
  calculateLast24Hours,
  calculatePercentage,
  formatPeriod,
} from "@/lib/raycast-helpers";
import type {
  RaycastDeviceUsageResponse,
  RaycastTopCountriesRequest,
} from "@/types/raycast-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RaycastTopCountriesRequest = await request.json();

    if (!body.projectId) {
      return NextResponse.json<RaycastDeviceUsageResponse>(
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
      return NextResponse.json<RaycastDeviceUsageResponse>(
        {
          success: false,
          error: "Authorization token is required",
        },
        { status: 401 }
      );
    }

    const tokenValidation = await validateApiToken(token, body.projectId);
    if (!tokenValidation.valid) {
      return NextResponse.json<RaycastDeviceUsageResponse>(
        {
          success: false,
          error: tokenValidation.error || "Invalid token",
        },
        { status: 401 }
      );
    }

    // Calculate last 24 hours
    const { startDate, endDate } = calculateLast24Hours();

    // Fetch device usage from analytics (lightweight query)
    const analytics = new AnalyticsService();
    const deviceStats = await analytics.getDeviceBreakdown({
      projectId: body.projectId,
      startDate,
      endDate,
    });

    const mobileViews = deviceStats.mobile_views || 0;
    const desktopViews = deviceStats.desktop_views || 0;
    const total = mobileViews + desktopViews;

    // Format response
    const response: RaycastDeviceUsageResponse = {
      success: true,
      data: {
        mobile: {
          views: mobileViews,
          percentage: calculatePercentage(mobileViews, total),
        },
        desktop: {
          views: desktopViews,
          percentage: calculatePercentage(desktopViews, total),
        },
        total,
      },
      period: formatPeriod(startDate, endDate),
    };

    return NextResponse.json<RaycastDeviceUsageResponse>(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in Raycast device usage API:", error);
    return NextResponse.json<RaycastDeviceUsageResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight (if needed in future)
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
