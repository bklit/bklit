import { prisma } from "@bklit/db/client";
import { type NextRequest, NextResponse } from "next/server";

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
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
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

    await prisma.trackedEvent.create({
      data: {
        timestamp: new Date(payload.timestamp),
        metadata,
        eventDefinitionId: eventDefinition.id,
        projectId: payload.projectId,
      },
    });

    console.log("✅ API: Event tracked successfully", {
      trackingId: payload.trackingId,
      eventType: payload.eventType,
      eventDefinitionId: eventDefinition.id,
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
