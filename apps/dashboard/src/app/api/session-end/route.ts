import { publishDebugLog, pushToQueue } from "@bklit/redis";
import { type NextRequest, NextResponse } from "next/server";

interface SessionEndPayload {
  sessionId: string;
  projectId: string;
  environment?: string;
}

function createCorsResponse(
  body: Record<string, unknown>,
  status: number
) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export function OPTIONS() {
  return createCorsResponse({ message: "CORS preflight OK" }, 200);
}

export async function POST(request: NextRequest) {
  const eventId = `sess_end_${Date.now()}`;

  try {
    const payload: SessionEndPayload = await request.json();

    if (!payload.sessionId || !payload.projectId) {
      return createCorsResponse({ message: "sessionId and projectId required" }, 400);
    }

    // Log to terminal - this will show "Session end received"
    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "ingestion",
      level: "info",
      message: "Session end received at /api/session-end",
      data: { sessionId: payload.sessionId, projectId: payload.projectId },
      eventId,
      projectId: payload.projectId,
    });

    // Queue session_end event for worker processing
    await pushToQueue({
      id: eventId,
      type: "session_end",
      projectId: payload.projectId,
      payload: {
        sessionId: payload.sessionId,
        timestamp: new Date().toISOString(),
      },
    });

    // Log queued event
    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "queue",
      level: "info",
      message: "Session end queued for worker",
      data: { sessionId: payload.sessionId },
      eventId,
      projectId: payload.projectId,
    });

    return createCorsResponse({ 
      success: true, 
      eventId,
      message: "Session end queued" 
    }, 200);
  } catch (error) {
    console.error("Session end error:", error);
    return createCorsResponse({ 
      message: "Failed to process session end",
      error: String(error)
    }, 500);
  }
}
