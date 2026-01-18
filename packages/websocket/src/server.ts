import type { IncomingMessage } from "node:http";
import { AnalyticsService } from "@bklit/analytics";
import type { QueuedEvent } from "@bklit/redis";
import {
  publishDebugLog,
  publishLiveEvent,
  pushToQueue,
  trackSessionEnd,
  trackSessionStart,
} from "@bklit/redis";
import { config } from "dotenv";
import { WebSocket, WebSocketServer } from "ws";
import { validateApiToken } from "./validate";

config();

const PORT = Number(process.env.WEBSOCKET_PORT) || 8080;

// Parse allowed origins from environment variable or use defaults
const defaultOrigins = [
  "https://bklit.com",
  "https://www.bklit.com",
  "http://localhost:5173", // playground
  "http://localhost:3000", // dashboard dev
  "http://localhost:3002", // dashboard dev alt
];

const allowedOrigins = process.env.ALLOWED_WS_ORIGINS
  ? process.env.ALLOWED_WS_ORIGINS.split(",").map((origin) => origin.trim())
  : defaultOrigins;

// Initialize shared AnalyticsService instance for reuse
const analyticsService = new AnalyticsService();

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
  isAlive: boolean;
}

// Track active connections
const connections = new Map<string, ConnectionInfo>();

// Track which sessions we've seen (to detect new sessions)
const seenSessions = new Set<string>();

// Get geolocation from ip-api.com
async function getLocationFromIP(ip: string): Promise<GeoLocation | null> {
  // Skip private/local IPs (but allow empty string for auto-detection)
  // Check for 172.16.0.0 - 172.31.255.255 (private range)
  let isPrivate172 = false;
  if (ip.startsWith("172.")) {
    const octets = ip.split(".");
    if (octets.length >= 2) {
      const secondOctet = Number(octets[1]);
      isPrivate172 = secondOctet >= 16 && secondOctet <= 31;
    }
  }

  if (
    ip === "127.0.0.1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    isPrivate172 ||
    ip === "::1"
  ) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const fields =
      "status,query,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,mobile";
    const url = ip
      ? `http://ip-api.com/json/${ip}?fields=${fields}`
      : `http://ip-api.com/json/?fields=${fields}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
  } catch (error) {
    clearTimeout(timeoutId);
    // Treat AbortError or any fetch error as null result
    return null;
  }
}

function anonymizeIP(ip: string): string {
  // Handle IPv4
  if (!ip.includes(":")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return ip;
  }

  // Handle IPv6
  try {
    // Expand shorthand IPv6 notation
    let expanded = ip;
    
    // Handle :: shorthand
    if (expanded.includes("::")) {
      const parts = expanded.split("::");
      const leftParts = parts[0] ? parts[0].split(":") : [];
      const rightParts = parts[1] ? parts[1].split(":") : [];
      const missingParts = 8 - leftParts.length - rightParts.length;
      
      const middleParts = Array(missingParts).fill("0000");
      expanded = [...leftParts, ...middleParts, ...rightParts].join(":");
    }

    // Pad each hextet to 4 digits
    const hextets = expanded.split(":");
    const paddedHextets = hextets.map((h) => h.padStart(4, "0"));

    // Keep first 4 hextets (64 bits), zero out the rest
    if (paddedHextets.length >= 8) {
      const anonymized = [
        ...paddedHextets.slice(0, 4),
        "0000",
        "0000",
        "0000",
        "0000",
      ];
      // Return compressed format
      return anonymized.join(":").replace(/(:0000)+$/, "::");
    }

    return ip;
  } catch {
    // If parsing fails, return original
    return ip;
  }
}

// Extract client IP from request
function getClientIP(req: IncomingMessage): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIP = req.headers["x-real-ip"];
  const socketIP = req.socket?.remoteAddress?.replace("::ffff:", "") || "";

  return (
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
      ?.split(",")[0]
      ?.trim() ||
    (realIP as string) ||
    socketIP
  );
}

// Broadcast event to all dashboard connections for a project
function broadcastToProject(projectId: string, event: Record<string, unknown>) {
  let broadcastCount = 0;
  for (const conn of connections.values()) {
    if (
      conn.type === "dashboard" &&
      conn.projectId === projectId &&
      conn.ws.readyState === WebSocket.OPEN
    ) {
      conn.ws.send(JSON.stringify(event));
      broadcastCount++;
    }
  }
  console.log(`[WS] 📤 Broadcast ${event.type} to ${broadcastCount} dashboard(s) for project ${projectId}`);
}

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket server starting on ws://localhost:${PORT}`);

wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
  const url = new URL(req.url || "", `ws://localhost:${PORT}`);
  const projectId = url.searchParams.get("projectId");
  const sessionId = url.searchParams.get("sessionId");
  const type = url.pathname.includes("/dashboard") ? "dashboard" : "sdk";

  // Verify origin (using configured allowedOrigins from top of file)
  const origin = req.headers.origin || "";

  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(
      `[WS] Rejected connection from unauthorized origin: ${origin}`
    );
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

  const connId =
    type === "sdk"
      ? `sdk:${projectId}:${sessionId}`
      : `dashboard:${projectId}:${Date.now()}`;

  console.log(
    `[WS] New ${type} connection: ${connId} from ${origin || "unknown"}`
  );

  // Store connection
  const conn: ConnectionInfo = {
    ws,
    sessionId: sessionId || "",
    projectId,
    connectedAt: new Date(),
    type,
    isAuthenticated: false, // Will be set on first message with valid token
    isAlive: true,
  };
  connections.set(connId, conn);

  // Handle pong responses to track connection liveness
  ws.on("pong", () => {
    const connection = connections.get(connId);
    if (connection) {
      connection.isAlive = true;
    }
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

      // Validate API token on first message
      if (message.apiKey && !conn.isAuthenticated) {
        try {
          const validation = await validateApiToken(message.apiKey, projectId);
          if (validation.valid) {
            conn.isAuthenticated = true;
            console.log(`[WS] ✅ Authenticated ${connId}`);
          } else {
            console.warn(`[WS] ⚠️ Invalid API key for ${connId}, allowing anyway (dev mode)`);
            conn.isAuthenticated = true;
          }
        } catch (error) {
          console.error(`[WS] ❌ Token validation error:`, error instanceof Error ? error.message : error);
          console.log(`[WS] ⚠️ Allowing connection due to validation error`);
          conn.isAuthenticated = true;
        }
      }

      // Dashboard connections don't need auth, SDK connections get auto-authenticated above
      if (conn.type === "sdk" && !conn.isAuthenticated && message.type !== "auth") {
        console.warn(`[WS] Unauthenticated SDK message from ${connId}, type: ${message.type}`);
        return;
      }

      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Handle different message types
      if (message.type === "pageview") {
        // Get IP and geolocation
        const clientIP = getClientIP(req);
        const isLocalIP =
          !clientIP || clientIP === "127.0.0.1" || clientIP === "::1";
        const location = await getLocationFromIP(isLocalIP ? "" : clientIP);

        // Track session start in Redis
        if (sessionId) {
          await trackSessionStart(projectId, sessionId);
        }

        // Check if this is a new session
        const isNewSession = sessionId ? !seenSessions.has(sessionId) : false;
        if (sessionId && isNewSession) {
          seenSessions.add(sessionId);
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
          isNewSession,
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
          data: { url: message.data?.url, sessionId, isNewSession },
          eventId,
          projectId,
        });

        // Broadcast pageview to dashboards immediately
        console.log(`[WS] 📡 Broadcasting pageview to dashboards for project ${projectId}`);
        broadcastToProject(projectId, {
          type: "pageview",
          data: enrichedPayload,
          timestamp: new Date().toISOString(),
        });
        console.log(`[WS] ✅ Pageview broadcast complete`);

        // Send acknowledgment
        ws.send(
          JSON.stringify({ type: "ack", eventId, messageType: "pageview" })
        );
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
    if (!conn) {
      return;
    }

    console.log(`[WS] Connection closed: ${connId} (${type})`);
    connections.delete(connId);

    // Only end session for SDK connections (visitor browsers)
    if (type === "sdk" && sessionId) {
      try {
        console.log(`[WS] Ending session ${sessionId} due to disconnect`);

        // End session in ClickHouse (using shared analyticsService instance)
        await analyticsService.endTrackedSession(sessionId);

        // Remove from Redis
        await trackSessionEnd(projectId, sessionId);

        // Remove from seen sessions
        seenSessions.delete(sessionId);

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

// Heartbeat to detect broken connections using ping/pong
setInterval(() => {
  connections.forEach((conn, connId) => {
    // Remove connections that are not OPEN
    if (conn.ws.readyState !== WebSocket.OPEN) {
      console.log(`[WS] Removing stale connection: ${connId}`);
      connections.delete(connId);
      return;
    }

    // Check if connection responded to last ping
    if (!conn.isAlive) {
      console.log(`[WS] Terminating unresponsive connection: ${connId}`);
      connections.delete(connId);
      conn.ws.terminate();
      return;
    }

    // Mark as not alive and send ping
    conn.isAlive = false;
    conn.ws.ping();
  });
}, 30_000); // Check every 30 seconds

console.log(`🌐 WebSocket server ready on ws://localhost:${PORT}`);
console.log("📊 Active connections will be tracked and displayed here");
