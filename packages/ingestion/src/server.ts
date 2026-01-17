import type { QueuedEvent } from "@bklit/redis";
import { publishDebugLog, pushToQueue } from "@bklit/redis";
import { config } from "dotenv";
import { validateApiToken } from "./validate";

config();

const PORT = Number(process.env.INGESTION_PORT) || 3001;

function anonymizeIP(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return ip;
}

import { createServer } from "http";

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "ingestion" }));
    return;
  }

  // Track pageview endpoint
  if (req.method === "POST" && url.pathname === "/track") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const startTime = Date.now();

      try {
        const payload = JSON.parse(body);
        const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "ingestion",
          level: "info",
          message: "Event received",
          data: { url: payload.url, projectId: payload.projectId },
          eventId,
          projectId: payload.projectId,
        });

        // Extract and validate token
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
          res.writeHead(401, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify({ error: "Missing authorization" }));
          return;
        }

        const validation = await validateApiToken(token, payload.projectId);
        if (!validation.valid) {
          res.writeHead(401, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify({ error: "Invalid token" }));
          return;
        }

        // Anonymize sensitive data
        const clientIP =
          (req.headers["x-forwarded-for"] as string) ||
          (req.headers["x-real-ip"] as string) ||
          "";
        const anonymizedPayload = {
          ...payload,
          ip: anonymizeIP(clientIP),
        };

        // Create queued event
        const queuedEvent: QueuedEvent = {
          id: eventId,
          type: "pageview",
          payload: anonymizedPayload,
          queuedAt: new Date().toISOString(),
          projectId: payload.projectId,
        };

        // Push to Redis queue
        await pushToQueue(queuedEvent);

        const duration = Date.now() - startTime;

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "ingestion",
          level: "info",
          message: "Event queued successfully",
          data: { eventId, duration },
          eventId,
          projectId: payload.projectId,
          duration,
        });

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ message: "Event queued", eventId }));
      } catch (error) {
        const duration = Date.now() - startTime;

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "ingestion",
          level: "error",
          message: "Ingestion error",
          data: {
            error: error instanceof Error ? error.message : String(error),
            duration,
          },
        });

        res.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ error: "Processing error" }));
      }
    });
    return;
  }

  // Track event endpoint (custom events like click, add-to-cart, etc.)
  if (req.method === "POST" && url.pathname === "/track-event") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const startTime = Date.now();

      try {
        const payload = JSON.parse(body);
        const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "ingestion",
          level: "info",
          message: "Custom event received",
          data: {
            trackingId: payload.trackingId,
            eventType: payload.eventType,
            projectId: payload.projectId,
          },
          eventId,
          projectId: payload.projectId,
        });

        // Extract and validate token
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
          res.writeHead(401, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify({ error: "Missing authorization" }));
          return;
        }

        const validation = await validateApiToken(token, payload.projectId);
        if (!validation.valid) {
          res.writeHead(401, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify({ error: "Invalid token" }));
          return;
        }

        // Create queued event
        const queuedEvent: QueuedEvent = {
          id: eventId,
          type: "event",
          payload,
          queuedAt: new Date().toISOString(),
          projectId: payload.projectId,
        };

        // Push to Redis queue
        await pushToQueue(queuedEvent);

        const duration = Date.now() - startTime;

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "ingestion",
          level: "info",
          message: "Custom event queued successfully",
          data: {
            eventId,
            trackingId: payload.trackingId,
            eventType: payload.eventType,
            duration,
          },
          eventId,
          projectId: payload.projectId,
          duration,
        });

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ message: "Event queued", eventId }));
      } catch (error) {
        const duration = Date.now() - startTime;

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "ingestion",
          level: "error",
          message: "Custom event ingestion error",
          data: {
            error: error instanceof Error ? error.message : String(error),
            duration,
          },
        });

        res.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ error: "Processing error" }));
      }
    });
    return;
  }

  // Session end endpoint (called when user closes tab)
  if (req.method === "POST" && url.pathname === "/session-end") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "ingestion",
          level: "info",
          message: "Session end received",
          data: { sessionId: payload.sessionId, projectId: payload.projectId },
          eventId,
          projectId: payload.projectId,
        });

        // Push session_end event to queue
        const queuedEvent: QueuedEvent = {
          id: eventId,
          type: "session_end" as any,
          payload: {
            sessionId: payload.sessionId,
            timestamp: new Date().toISOString(),
          },
          queuedAt: new Date().toISOString(),
          projectId: payload.projectId,
        };

        await pushToQueue(queuedEvent);

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "ingestion",
          level: "info",
          message: "Session end queued",
          data: { sessionId: payload.sessionId },
          eventId,
          projectId: payload.projectId,
        });

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ message: "Session end queued", eventId }));
      } catch (error) {
        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "ingestion",
          level: "error",
          message: "Session end error",
          data: {
            error: error instanceof Error ? error.message : String(error),
          },
        });

        res.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ error: "Processing error" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`🚀 Ingestion service running on http://localhost:${PORT}`);
});
