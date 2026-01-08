import { randomBytes } from "node:crypto";
import { AnalyticsService, sendEventToPolar } from "@bklit/analytics";
import { prisma } from "@bklit/db/client";
import { type NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, validateApiToken } from "@/lib/api-token-auth";
import { checkEventLimit } from "@/lib/usage-limits";

interface EventTrackingPayload {
  trackingId: string;
  eventType: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  projectId: string;
  sessionId?: string;
}

function createCorsResponse(
  body: Record<string, unknown> | { message: string; error?: string },
  status: number
) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

export async function OPTIONS() {
  return createCorsResponse({ message: "CORS preflight OK" }, 200);
}

export async function POST(request: NextRequest) {
  try {
    const payload: EventTrackingPayload = await request.json();
    console.log("📊 API: Event tracking request received", {
      trackingId: payload.trackingId,
      eventType: payload.eventType,
      projectId: payload.projectId,
      sessionId: payload.sessionId,
      timestamp: payload.timestamp,
    });

    if (!(payload.projectId && payload.trackingId && payload.eventType)) {
      return createCorsResponse(
        { message: "projectId, trackingId, and eventType are required" },
        400
      );
    }

    // Validate API token
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return createCorsResponse(
        { message: "Authorization token is required" },
        401
      );
    }

    const tokenValidation = await validateApiToken(token, payload.projectId);
    if (!tokenValidation.valid) {
      return createCorsResponse(
        { message: tokenValidation.error || "Invalid token" },
        401
      );
    }

    // Validate domain if allowedDomains is specified
    if (
      tokenValidation.allowedDomains &&
      tokenValidation.allowedDomains.length > 0
    ) {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");

      let requestDomain: string | null = null;
      try {
        if (origin) {
          requestDomain = new URL(origin).hostname;
        } else if (referer) {
          requestDomain = new URL(referer).hostname;
        }
      } catch (error) {
        // Malformed header values - treat as absent
        console.warn("Failed to parse origin/referer header:", error);
        requestDomain = null;
      }

      if (!requestDomain) {
        return createCorsResponse(
          { message: "Origin or Referer header required" },
          403
        );
      }

      // Allow localhost in development (for local testing)
      const isLocalhost =
        requestDomain === "localhost" || requestDomain === "127.0.0.1";
      if (isLocalhost && process.env.NODE_ENV === "development") {
        // Skip domain validation for localhost in development
      } else {
        // Check if domain matches any allowed domain (exact match or subdomain)
        const isAllowed = tokenValidation.allowedDomains.some(
          (allowedDomain) => {
            // Exact match
            if (requestDomain === allowedDomain) {
              return true;
            }
            // Subdomain match (e.g., www.example.com matches example.com)
            if (requestDomain.endsWith(`.${allowedDomain}`)) {
              return true;
            }
            return false;
          }
        );

        if (!isAllowed) {
          return createCorsResponse(
            {
              message: `Domain ${requestDomain} is not allowed for this token`,
            },
            403
          );
        }
      }
    }

    // Check usage limits
    if (tokenValidation.organizationId) {
      const usageCheck = await checkEventLimit(tokenValidation.organizationId);

      if (!usageCheck.allowed) {
        return createCorsResponse(
          {
            message: usageCheck.message || "Usage limit exceeded",
            currentUsage: usageCheck.currentUsage,
            limit: usageCheck.limit,
          },
          429
        );
      }
    }

    const eventDefinition = await prisma.eventDefinition.findUnique({
      where: {
        projectId_trackingId: {
          projectId: payload.projectId,
          trackingId: payload.trackingId,
        },
      },
    });

    if (!eventDefinition) {
      console.warn("⚠️ API: Event definition not found", {
        trackingId: payload.trackingId,
        projectId: payload.projectId,
      });
      return createCorsResponse(
        {
          message:
            "Event definition not found. Please create this event in your dashboard first.",
        },
        404
      );
    }

    const metadata = {
      ...payload.metadata,
      eventType: payload.eventType,
    };

    const analytics = new AnalyticsService();
    const eventId = randomBytes(16).toString("hex");

    await analytics.createTrackedEvent({
      id: eventId,
      timestamp: new Date(payload.timestamp),
      metadata,
      eventDefinitionId: eventDefinition.id,
      projectId: payload.projectId,
      sessionId: payload.sessionId || null,
    });

    console.log("✅ API: Event tracked successfully", {
      trackingId: payload.trackingId,
      eventType: payload.eventType,
      eventDefinitionId: eventDefinition.id,
      sessionLinked: !!payload.sessionId,
    });

    const orgId = tokenValidation.organizationId;
    if (orgId) {
      // Fire and forget - send to Polar async without blocking response
      Promise.resolve()
        .then(async () => {
          try {
            const org = await prisma.organization.findUnique({
              where: { id: orgId },
              select: { polarCustomerId: true },
            });

            if (org?.polarCustomerId) {
              await sendEventToPolar({
                organizationId: orgId,
                polarCustomerId: org.polarCustomerId,
                eventType: "custom_event",
                metadata: {
                  trackingId: payload.trackingId,
                  eventType: payload.eventType,
                  projectId: payload.projectId,
                  ...payload.metadata,
                },
              }).catch((err) => {
                console.error("Failed to send custom event to Polar:", err);
              });
            }
          } catch (err) {
            console.error("Failed to fetch organization for Polar:", err);
          }
        })
        .catch(() => {}); // Silently fail
    }

    // Deliver to extensions (fire-and-forget)
    // Skip hover events - they're pseudo events not useful for notifications
    if (payload.eventType !== "hover") {
      Promise.resolve()
        .then(async () => {
          const { deliverToExtensions } = await import(
            "@bklit/extensions/core"
          );
          await deliverToExtensions({
            projectId: payload.projectId,
            eventDefinitionId: eventDefinition.id,
            eventData: {
              trackingId: payload.trackingId,
              eventType: payload.eventType,
              metadata: payload.metadata,
              timestamp: payload.timestamp,
              projectId: payload.projectId,
              sessionId: payload.sessionId,
            },
          });
        })
        .catch((err) => {
          console.error("❌ Extension delivery failed:", err);
        });
    }

    return createCorsResponse({ message: "Event tracked successfully" }, 200);
  } catch (error) {
    console.error("❌ API: Error processing event tracking data:", error);
    let errorMessage = "Error processing request";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return createCorsResponse(
      { message: "Error processing request", error: errorMessage },
      500
    );
  }
}
