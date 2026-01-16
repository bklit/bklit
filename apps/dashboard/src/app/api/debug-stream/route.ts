import { getRedisClient, type DebugLog } from "@bklit/redis";
import { type NextRequest } from "next/server";
import Redis from "ioredis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEBUG_CHANNEL = "debug-logs";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initMessage = `data: ${JSON.stringify({
        timestamp: new Date().toISOString(),
        stage: "websocket",
        level: "info",
        message: "Debug stream connected",
        data: { projectId: projectId || "all" },
      })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      // Create a separate Redis client for subscribing (with offline queue enabled)
      const baseClient = getRedisClient();
      if (!baseClient) {
        const errorMsg = `data: ${JSON.stringify({
          timestamp: new Date().toISOString(),
          stage: "websocket",
          level: "error",
          message: "Redis not available",
          data: {},
        })}\n\n`;
        controller.enqueue(encoder.encode(errorMsg));
        controller.close();
        return;
      }

      // Duplicate the client for subscribing
      const subscriber = new Redis(process.env.REDIS_URL!, {
        enableOfflineQueue: true, // Required for pub/sub
        lazyConnect: false,
      });

      subscriber.subscribe(DEBUG_CHANNEL, (err) => {
        if (err) {
          console.error("Failed to subscribe to debug logs:", err);
          const errorData = `data: ${JSON.stringify({
            timestamp: new Date().toISOString(),
            stage: "websocket",
            level: "error",
            message: "Subscriber error",
            data: { error: err.message },
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        }
      });

      subscriber.on("message", (channel, message) => {
        if (channel !== DEBUG_CHANNEL) return;

        try {
          const log = JSON.parse(message) as DebugLog;
          
          // Filter by projectId if specified
          if (projectId && log.projectId !== projectId) {
            return;
          }

          // Format as Server-Sent Event
          const data = `data: ${JSON.stringify(log)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error("Failed to parse debug log:", error);
        }
      });

      subscriber.on("error", (error) => {
        console.error("Redis subscriber error:", error);
      });

      // Cleanup on abort
      request.signal.addEventListener("abort", async () => {
        await subscriber.unsubscribe(DEBUG_CHANNEL);
        await subscriber.quit();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}

