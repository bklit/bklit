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
  status: number,
) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
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

    if (!payload.projectId || !payload.trackingId || !payload.eventType) {
      return createCorsResponse(
        { message: "projectId, trackingId, and eventType are required" },
        400,
      );
    }

    // Validate API token
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return createCorsResponse(
        { message: "Authorization token is required" },
        401,
      );
    }

    const tokenValidation = await validateApiToken(token, payload.projectId);
    if (!tokenValidation.valid) {
      return createCorsResponse(
        { message: tokenValidation.error || "Invalid token" },
        401,
      );
    }

    // Check usage limits
    if (tokenValidation.organizationId) {
      const usageCheck = await checkEventLimit(
        tokenValidation.organizationId,
      );

      if (!usageCheck.allowed) {
        return createCorsResponse(
          {
            message: usageCheck.message || "Usage limit exceeded",
            currentUsage: usageCheck.currentUsage,
            limit: usageCheck.limit,
          },
          429,
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
        404,
      );
    }

    const metadata = {
      ...payload.metadata,
      eventType: payload.eventType,
    };

    // Look up the internal session ID if a client sessionId was provided
    let internalSessionId: string | undefined;
    if (payload.sessionId) {
      const session = await prisma.trackedSession.findUnique({
        where: {
          sessionId: payload.sessionId,
        },
        select: {
          id: true,
        },
      });
      internalSessionId = session?.id;

      if (session) {
        console.log("🔗 API: Session found for event", {
          clientSessionId: payload.sessionId,
          internalSessionId: session.id,
        });
      }
    }

    await prisma.trackedEvent.create({
      data: {
        timestamp: new Date(payload.timestamp),
        metadata,
        eventDefinitionId: eventDefinition.id,
        projectId: payload.projectId,
        sessionId: internalSessionId, // Link to TrackedSession if available
      },
    });

    console.log("✅ API: Event tracked successfully", {
      trackingId: payload.trackingId,
      eventType: payload.eventType,
      eventDefinitionId: eventDefinition.id,
      sessionLinked: !!internalSessionId,
    });

    return createCorsResponse({ message: "Event tracked successfully" }, 200);
  } catch (error) {
    console.error("❌ API: Error processing event tracking data:", error);
    let errorMessage = "Error processing request";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return createCorsResponse(
      { message: "Error processing request", error: errorMessage },
      500,
    );
  }
}
