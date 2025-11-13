import { tasks } from "@trigger.dev/sdk/v3";
import type { healthCheckTask } from "../../../../trigger/health-check";

export async function POST() {
  try {
    // Manually trigger the health check task
    const handle = await tasks.trigger<typeof healthCheckTask>("health-check", {});
    
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
      { status: 500 },
    );
  }
}

