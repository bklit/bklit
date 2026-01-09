import { AnalyticsService } from "@bklit/analytics/service";
import { type NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, validateApiToken } from "@/lib/api-token-auth";
import type {
  RaycastTopCountriesRequest,
  RaycastTopCountriesResponse,
} from "@/types/raycast-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RaycastTopCountriesRequest = await request.json();

    if (!body.projectId) {
      return NextResponse.json<RaycastTopCountriesResponse>(
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
      return NextResponse.json<RaycastTopCountriesResponse>(
        {
          success: false,
          error: "Authorization token is required",
        },
        { status: 401 }
      );
    }

    const tokenValidation = await validateApiToken(token, body.projectId);
    if (!tokenValidation.valid) {
      return NextResponse.json<RaycastTopCountriesResponse>(
        {
          success: false,
          error: tokenValidation.error || "Invalid token",
        },
        { status: 401 }
      );
    }

    // Calculate last 24 hours
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24);

    // Fetch top countries from analytics
    const analytics = new AnalyticsService();
    const topCountries = await analytics.getTopCountries({
      projectId: body.projectId,
      startDate,
      endDate,
      limit: 5,
    });

    // Format response
    const response: RaycastTopCountriesResponse = {
      success: true,
      data: topCountries.map((country) => ({
        country: country.country || "Unknown",
        countryCode: country.country_code || "",
        views: country.visits || 0,
        uniqueVisitors: country.unique_visitors || 0,
      })),
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };

    return NextResponse.json<RaycastTopCountriesResponse>(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in Raycast top countries API:", error);
    return NextResponse.json<RaycastTopCountriesResponse>(
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
