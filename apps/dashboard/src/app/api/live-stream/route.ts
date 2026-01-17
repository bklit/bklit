import {
  getRedisClient,
  LIVE_EVENTS_CHANNEL,
  type LiveEvent,
} from "@bklit/redis";
import Redis from "ioredis";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return new Response(JSON.stringify({ error: "projectId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initMessage = `data: ${JSON.stringify({
        type: "connected",
        projectId,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      // Check Redis availability
      const baseClient = getRedisClient();
      if (!baseClient) {
        const errorMsg = `data: ${JSON.stringify({
          type: "error",
          message: "Redis not available",
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(encoder.encode(errorMsg));
        controller.close();
        return;
      }

      // Create subscriber client
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        const errorMsg = `data: ${JSON.stringify({
          type: "error",
          message: "REDIS_URL not configured",
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(encoder.encode(errorMsg));
        controller.close();
        return;
      }

      const subscriber = new Redis(redisUrl, {
        enableOfflineQueue: true,
        lazyConnect: false,
      });

      subscriber.subscribe(LIVE_EVENTS_CHANNEL, (err) => {
        if (err) {
          console.error("Failed to subscribe to live-events:", err);
          const errorData = `data: ${JSON.stringify({
            type: "error",
            message: "Subscription failed",
            error: err.message,
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        }
      });

      subscriber.on("message", (channel, message) => {
        if (channel !== LIVE_EVENTS_CHANNEL) {
          return;
        }

        try {
          const event = JSON.parse(message) as LiveEvent;

          // Filter by projectId
          if (event.projectId !== projectId) {
            return;
          }

          // Forward the event as SSE
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error("Failed to parse live event:", error);
        }
      });

      subscriber.on("error", (error) => {
        console.error("Redis subscriber error:", error);
      });

      // Cleanup on abort
      request.signal.addEventListener("abort", async () => {
        try {
          await subscriber.unsubscribe(LIVE_EVENTS_CHANNEL);
          await subscriber.quit();
        } catch {
          // Ignore cleanup errors
        }
      });

      // Send heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const ping = `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`;
          controller.enqueue(encoder.encode(ping));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
