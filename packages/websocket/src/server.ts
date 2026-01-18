import { WebSocketServer, WebSocket } from "ws";
import type { QueuedEvent } from "@bklit/redis";
import {
  publishDebugLog,
  pushToQueue,
  trackSessionStart,
  trackSessionEnd,
  publishLiveEvent,
} from "@bklit/redis";
import { AnalyticsService } from "@bklit/analytics";
import { config } from "dotenv";
import { validateApiToken } from "./validate";
import type { IncomingMessage } from "http";

config();

const PORT = Number(process.env.WEBSOCKET_PORT) || 8080;

interface GeoLocation {
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  mobile?: boolean;
}

interface ConnectionInfo {
  ws: WebSocket;
  sessionId: string;
  projectId: string;
  connectedAt: Date;
  type: "sdk" | "dashboard";
  isAuthenticated: boolean;
}

// Track active connections
const connections = new Map<string, ConnectionInfo>();

// Get geolocation from ip-api.com
async function getLocationFromIP(ip: string): Promise<GeoLocation | null> {
  // Skip private/local IPs (but allow empty string for auto-detection)
  if (
    ip === "127.0.0.1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.") ||
    ip === "::1"
  ) {
    return null;
  }

  try {
    const fields =
      "status,query,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,mobile";
    const url = ip
      ? `http://ip-api.com/json/${ip}?fields=${fields}`
      : `http://ip-api.com/json/?fields=${fields}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === "success") {
      return {
        country: data.country,
        countryCode: data.countryCode,
        region: data.region,
        regionName: data.regionName,
        city: data.city,
        zip: data.zip,
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone,
        isp: data.isp,
        mobile: data.mobile,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function anonymizeIP(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return ip;
}

// Extract client IP from request
function getClientIP(req: IncomingMessage): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIP = req.headers["x-real-ip"];
  const socketIP = req.socket?.remoteAddress?.replace("::ffff:", "") || "";

  return (
    (Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor
    )
      ?.split(",")[0]
      ?.trim() ||
    (realIP as string) ||
    socketIP
  );
}

// Broadcast event to all dashboard connections for a project
function broadcastToProject(projectId: string, event: any) {
  connections.forEach((conn) => {
    if (
      conn.type === "dashboard" &&
      conn.projectId === projectId &&
      conn.ws.readyState === WebSocket.OPEN
    ) {
      conn.ws.send(JSON.stringify(event));
    }
  });
}

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket server starting on ws://localhost:${PORT}`);

wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
  const url = new URL(req.url || "", `ws://localhost:${PORT}`);
  const projectId = url.searchParams.get("projectId");
  const sessionId = url.searchParams.get("sessionId");
  const type = url.pathname.includes("/dashboard") ? "dashboard" : "sdk";
  
  // Verify origin
  const origin = req.headers.origin || "";
  const allowedOrigins = [
    "https://bklit.com",
    "https://www.bklit.com",
    "http://localhost:5173", // playground
    "http://localhost:3000", // dashboard dev
    "http://localhost:3002", // dashboard dev alt
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`[WS] Rejected connection from unauthorized origin: ${origin}`);
    ws.close(1008, "Unauthorized origin");
    return;
  }

  if (!projectId) {
    console.warn("[WS] Rejected connection: missing projectId");
    ws.close(1008, "Missing projectId");
    return;
  }

  if (type === "sdk" && !sessionId) {
    console.warn("[WS] Rejected SDK connection: missing sessionId");
    ws.close(1008, "Missing sessionId");
    return;
  }

  const connId = type === "sdk" 
    ? `sdk:${projectId}:${sessionId}`
    : `dashboard:${projectId}:${Date.now()}`;

  console.log(`[WS] New ${type} connection: ${connId} from ${origin || 'unknown'}`);

  // Store connection
  connections.set(connId, {
    ws,
    sessionId: sessionId || "",
    projectId,
    connectedAt: new Date(),
    type,
    isAuthenticated: false, // Will be set on first message with valid token
  });

  // Send connection confirmation
  ws.send(
    JSON.stringify({
      type: "connected",
      projectId,
      sessionId: type === "sdk" ? sessionId : undefined,
      timestamp: new Date().toISOString(),
    })
  );

  // Handle incoming messages
  ws.on("message", async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      const conn = connections.get(connId);

      if (!conn) {
        console.warn(`[WS] Message from unknown connection: ${connId}`);
        return;
      }

      // Validate API token on first message (or every message for extra security)
      if (message.apiKey) {
        const validation = await validateApiToken(message.apiKey, projectId);
        if (validation.valid) {
          conn.isAuthenticated = true;
        } else {
          console.warn(`[WS] Invalid API key for ${connId}`);
          ws.close(1008, "Invalid API key");
          return;
        }
      }

      // Only process events from authenticated connections
      if (!conn.isAuthenticated && message.type !== "auth") {
        console.warn(`[WS] Unauthenticated message from ${connId}`);
        return;
      }

      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Handle different message types
      if (message.type === "pageview") {
        // Get IP and geolocation
        const clientIP = getClientIP(req);
        const isLocalIP = !clientIP || clientIP === "127.0.0.1" || clientIP === "::1";
        const location = await getLocationFromIP(isLocalIP ? "" : clientIP);

        // Track session start in Redis
        if (sessionId) {
          await trackSessionStart(projectId, sessionId);
        }

        // Build enriched payload
        const enrichedPayload = {
          ...message.data,
          sessionId,
          ip: anonymizeIP(clientIP),
          country: location?.country,
          countryCode: location?.countryCode,
          region: location?.region,
          regionName: location?.regionName,
          city: location?.city,
          zip: location?.zip,
          lat: location?.lat,
          lon: location?.lon,
          timezone: location?.timezone,
          isp: location?.isp,
          mobile: location?.mobile,
        };

        // Queue for worker processing
        const queuedEvent: QueuedEvent = {
          id: eventId,
          type: "pageview",
          payload: enrichedPayload,
          queuedAt: new Date().toISOString(),
          projectId,
        };

        await pushToQueue(queuedEvent);

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "websocket",
          level: "info",
          message: "Pageview received via WebSocket",
          data: { url: message.data?.url, sessionId },
          eventId,
          projectId,
        });

        // Broadcast pageview to dashboards immediately
        broadcastToProject(projectId, {
          type: "pageview",
          data: enrichedPayload,
          timestamp: new Date().toISOString(),
        });

        // Send acknowledgment
        ws.send(JSON.stringify({ type: "ack", eventId, messageType: "pageview" }));
      } else if (message.type === "event") {
        // Queue custom event
        const queuedEvent: QueuedEvent = {
          id: eventId,
          type: "event",
          payload: {
            ...message.data,
            sessionId,
          },
          queuedAt: new Date().toISOString(),
          projectId,
        };

        await pushToQueue(queuedEvent);

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "websocket",
          level: "info",
          message: "Custom event received via WebSocket",
          data: {
            trackingId: message.data?.trackingId,
            eventType: message.data?.eventType,
            sessionId,
          },
          eventId,
          projectId,
        });

        // Broadcast custom event to dashboards immediately
        broadcastToProject(projectId, {
          type: "event",
          data: {
            ...message.data,
            sessionId,
          },
          timestamp: new Date().toISOString(),
        });

        // Send acknowledgment
        ws.send(JSON.stringify({ type: "ack", eventId, messageType: "event" }));
      } else if (message.type === "auth") {
        // Just authentication, already handled above
        ws.send(JSON.stringify({ type: "auth_success" }));
      }
    } catch (error) {
      console.error(`[WS] Error processing message from ${connId}:`, error);
      await publishDebugLog({
        timestamp: new Date().toISOString(),
        stage: "websocket",
        level: "error",
        message: "WebSocket message processing error",
        data: {
          error: error instanceof Error ? error.message : String(error),
          connId,
        },
      });
    }
  });

  // Handle disconnect - INSTANT SESSION END
  ws.on("close", async () => {
    const conn = connections.get(connId);
    if (!conn) return;

    console.log(`[WS] Connection closed: ${connId} (${type})`);
    connections.delete(connId);

    // Only end session for SDK connections (visitor browsers)
    if (type === "sdk" && sessionId) {
      try {
        console.log(`[WS] Ending session ${sessionId} due to disconnect`);

        // End session in ClickHouse
        const analytics = new AnalyticsService();
        await analytics.endTrackedSession(sessionId);

        // Remove from Redis
        await trackSessionEnd(projectId, sessionId);

        // Broadcast session_end to dashboards
        await publishLiveEvent({
          projectId,
          type: "session_end",
          timestamp: new Date().toISOString(),
          data: { sessionId, reason: "disconnect" },
        });

        broadcastToProject(projectId, {
          type: "session_end",
          data: { sessionId },
          timestamp: new Date().toISOString(),
        });

        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "websocket",
          level: "info",
          message: "Session ended via WebSocket disconnect",
          data: { sessionId, projectId },
          projectId,
        });

        console.log(`[WS] ✅ Session ${sessionId} ended successfully`);
      } catch (error) {
        console.error(`[WS] Error ending session ${sessionId}:`, error);
        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "websocket",
          level: "error",
          message: "Session end error",
          data: {
            error: error instanceof Error ? error.message : String(error),
            sessionId,
          },
          projectId,
        });
      }
    }
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error(`[WS] Error on ${connId}:`, error);
  });
});

// Heartbeat to detect broken connections
setInterval(() => {
  connections.forEach((conn, connId) => {
    if (conn.ws.readyState !== WebSocket.OPEN) {
      console.log(`[WS] Removing stale connection: ${connId}`);
      connections.delete(connId);
    }
  });
}, 30000); // Check every 30 seconds

console.log(`🌐 WebSocket server ready on ws://localhost:${PORT}`);
console.log(`📊 Active connections will be tracked and displayed here`);
