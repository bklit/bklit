import { AnalyticsService } from "@bklit/analytics/service";
import { type NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, validateApiToken } from "@/lib/api-token-auth";
import {
  calculateLast24Hours,
  calculatePercentage,
  formatPeriod,
} from "@/lib/raycast-helpers";
import type {
  RaycastTopCountriesRequest,
  RaycastTopReferrersResponse,
} from "@/types/raycast-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RaycastTopCountriesRequest = await request.json();

    if (!body.projectId) {
      return NextResponse.json<RaycastTopReferrersResponse>(
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
      return NextResponse.json<RaycastTopReferrersResponse>(
        {
          success: false,
          error: "Authorization token is required",
        },
        { status: 401 }
      );
    }

    const tokenValidation = await validateApiToken(token, body.projectId);
    if (!tokenValidation.valid) {
      return NextResponse.json<RaycastTopReferrersResponse>(
        {
          success: false,
          error: tokenValidation.error || "Invalid token",
        },
        { status: 401 }
      );
    }

    // Calculate last 24 hours
    const { startDate, endDate } = calculateLast24Hours();

    // Fetch top referrers and total pageviews using optimized ClickHouse aggregation
    const analytics = new AnalyticsService();
    const [topReferrers, totalPageviews] = await Promise.all([
      analytics.getTopReferrers({
        projectId: body.projectId,
        startDate,
        endDate,
        limit: 5,
      }),
      analytics.countPageViews(body.projectId, startDate, endDate),
    ]);

    // Format response
    const response: RaycastTopReferrersResponse = {
      success: true,
      data: topReferrers.map((ref) => ({
        referrer: ref.referrer,
        views: ref.count,
        percentage: calculatePercentage(ref.count, totalPageviews),
      })),
      totalPageviews,
      period: formatPeriod(startDate, endDate),
    };

    return NextResponse.json<RaycastTopReferrersResponse>(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in Raycast top referrers API:", error);
    return NextResponse.json<RaycastTopReferrersResponse>(
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
