import type { QueuedEvent } from "@bklit/redis";
import { publishDebugLog, pushToQueue, trackSessionStart } from "@bklit/redis";
import { config } from "dotenv";
import { validateApiToken } from "./validate";

config();

const PORT = Number(process.env.INGESTION_PORT) || 3001;

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

// Get geolocation from ip-api.com
// If ip is empty, ip-api will use the calling server's public IP (great for local dev!)
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
    // If ip is empty, don't include it in URL - ip-api will auto-detect
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

        // Extract client IP from headers (production) or socket (fallback)
        const forwardedFor = req.headers["x-forwarded-for"];
        const realIP = req.headers["x-real-ip"];
        const socketIP = req.socket?.remoteAddress?.replace("::ffff:", "") || "";

        const clientIP =
          (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",")[0]?.trim() ||
          (realIP as string) ||
          socketIP;

        // Get geolocation from ip-api.com
        // If no valid IP (local dev), pass empty string - ip-api will use server's public IP
        const isLocalIP = !clientIP || clientIP === "127.0.0.1" || clientIP === "::1";
        const location = await getLocationFromIP(isLocalIP ? "" : clientIP);

        // Track session start in Redis for real-time live count
        if (payload.sessionId) {
          await trackSessionStart(payload.projectId, payload.sessionId);
        }

        // Build payload with geolocation data
        const enrichedPayload = {
          ...payload,
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

        // Create queued event
        const queuedEvent: QueuedEvent = {
          id: eventId,
          type: "pageview",
          payload: enrichedPayload,
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
  if (url.pathname === "/session-end") {
    // Get origin from request for CORS (sendBeacon requires specific origin, not wildcard)
    const origin = req.headers.origin || "http://localhost:5173";
    
    console.log(`[session-end] Request received: method=${req.method}, origin=${origin}`);
    
    // Handle CORS preflight for session-end
    if (req.method === "OPTIONS") {
      console.log(`[session-end] Handling OPTIONS preflight with origin: ${origin}`);
      res.writeHead(200, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      });
      res.end();
      return;
    }

    if (req.method === "POST") {
      // #region agent log
      const fs = require("fs");
      fs.appendFileSync("/Users/matt/Bklit/bklit/.cursor/debug.log", JSON.stringify({location:"ingestion/server.ts:session-end:RECEIVED",message:"Session end endpoint hit",data:{method:req.method,pathname:url.pathname},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H1C"})+"\n");
      // #endregion

      let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // #region agent log
        fs.appendFileSync("/Users/matt/Bklit/bklit/.cursor/debug.log", JSON.stringify({location:"ingestion/server.ts:session-end:PARSED",message:"Session end payload parsed",data:{sessionId:payload.sessionId,projectId:payload.projectId,eventId},timestamp:Date.now(),sessionId:"debug-session",hypothesisId:"H1C"})+"\n");
        // #endregion

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
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
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
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        });
        res.end(JSON.stringify({ error: "Processing error" }));
      }
    });
      return;
    }

    // If not POST, return 405 Method Not Allowed
    res.writeHead(405, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
    });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`🚀 Ingestion service running on http://localhost:${PORT}`);
});
