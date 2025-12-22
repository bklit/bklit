import { tasks } from "@trigger.dev/sdk/v3";
import type { NextRequest } from "next/server";
import { env } from "@/env";
import type { healthCheckTask } from "../../../../trigger/health-check";

/**
 * Validates the health check secret from the request
 * Accepts secret from Authorization header (Bearer token) or X-Health-Check-Secret header
 */
function validateHealthCheckSecret(request: NextRequest): boolean {
  const expectedSecret = env.HEALTH_CHECK_SECRET;

  if (!expectedSecret || expectedSecret.trim() === "") {
    console.error(
      "HEALTH_CHECK_SECRET is not configured. Health check endpoint is disabled."
    );
    return false;
  }

  // Check Authorization header (Bearer token format)
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === expectedSecret) {
      return true;
    }
  }

  // Check custom header
  const customHeader = request.headers.get("x-health-check-secret");
  if (customHeader && customHeader === expectedSecret) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  // Validate authentication
  if (!validateHealthCheckSecret(request)) {
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    console.warn("Unauthorized health check trigger attempt", {
      ip: clientIP,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return Response.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    // Manually trigger the health check task
    const handle = await tasks.trigger<typeof healthCheckTask>(
      "health-check",
      {}
    );

    console.log("Health check task triggered manually", {
      runId: handle.id,
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      runId: handle.id,
      message: "Health check task triggered",
    });
  } catch (error) {
    console.error("Failed to trigger health check:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
