import { prisma } from "@bklit/db/client";
import { type NextRequest, NextResponse } from "next/server";
import { endSession } from "@/actions/session-actions";
import { extractTokenFromHeader, validateApiToken } from "@/lib/api-token-auth";

// Helper function to create a response with CORS headers
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

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return createCorsResponse({ message: "CORS preflight OK" }, 200);
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, projectId } = await request.json();

    if (!sessionId || !projectId) {
      return createCorsResponse(
        { message: "sessionId and projectId are required" },
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

    const tokenValidation = await validateApiToken(token, projectId);
    if (!tokenValidation.valid) {
      return createCorsResponse(
        { message: tokenValidation.error || "Invalid token" },
        401,
      );
    }

    // Verify session belongs to project
    const session = await prisma.trackedSession.findFirst({
      where: {
        sessionId,
        projectId,
      },
    });

    if (!session) {
      return createCorsResponse(
        { message: "Session not found for this project" },
        404,
      );
    }

    // Use the shared endSession logic
    const updatedSession = await endSession(sessionId);

    return createCorsResponse(
      {
        message: "Session ended",
        endedAt: updatedSession.endedAt,
        duration: updatedSession.duration,
        didBounce: updatedSession.didBounce,
      },
      200,
    );
  } catch (error) {
    console.error("Error ending session:", error);
    return createCorsResponse(
      {
        message: "Error ending session",
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
}
