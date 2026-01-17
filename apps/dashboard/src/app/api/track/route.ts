import { randomBytes } from "node:crypto";
import { sendEventToPolar } from "@bklit/analytics";
import { prisma } from "@bklit/db/client";
import "@bklit/redis"; // Initialize Redis on first import
import {
  publishDebugLog,
  pushToQueue,
  type QueuedEvent,
  trackSessionStart,
} from "@bklit/redis";
import { type NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, validateApiToken } from "@/lib/api-token-auth";
import { extractClientIP, getLocationFromIP } from "@/lib/ip-geolocation";
import { checkEventLimit } from "@/lib/usage-limits";
import { isMobileDevice } from "@/lib/user-agent";
import type { GeoLocation } from "@/types/geo";

interface TrackingPayload {
  url: string;
  timestamp: string;
  projectId: string;
  userAgent?: string;
  sessionId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  // Page metadata
  title?: string;
  description?: string;
  ogImage?: string;
  ogTitle?: string;
  favicon?: string;
  canonicalUrl?: string;
  language?: string;
  robots?: string;
  // Enhanced campaign tracking
  referrerHostname?: string;
  referrerPath?: string;
  referrerType?: string;
  utmId?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  liFatId?: string;
  twclid?: string;
  // Session tracking
  isNewVisitor?: boolean;
  landingPage?: string;
}

// Helper function to create a response with CORS headers
function createCorsResponse(
  body: Record<string, unknown> | { message: string; error?: string },
  status: number
) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

// Handle OPTIONS requests for CORS preflight
export function OPTIONS() {
  return createCorsResponse({ message: "CORS preflight OK" }, 200);
}

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  const eventId = `evt_${Date.now()}_${randomBytes(8).toString("hex")}`;

  try {
    const payload: TrackingPayload = await request.json();
    
    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "ingestion",
      level: "info",
      message: "Event received at /api/track",
      data: { url: payload.url, projectId: payload.projectId },
      eventId,
      projectId: payload.projectId,
    });

    if (!payload.projectId) {
      return createCorsResponse({ message: "projectId is required" }, 400);
    }

    // Validate API token
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return createCorsResponse(
        { message: "Authorization token is required" },
        401
      );
    }

    const tokenValidation = await validateApiToken(token, payload.projectId);
    if (!tokenValidation.valid) {
      return createCorsResponse(
        { message: tokenValidation.error || "Invalid token" },
        401
      );
    }

    // Validate domain if allowedDomains is specified
    if (
      tokenValidation.allowedDomains &&
      tokenValidation.allowedDomains.length > 0
    ) {
      const origin = request.headers.get("origin");
      const referer = request.headers.get("referer");

      let requestDomain: string | null = null;
      try {
        if (origin) {
          requestDomain = new URL(origin).hostname;
        } else if (referer) {
          requestDomain = new URL(referer).hostname;
        }
      } catch (error) {
        // Malformed header values - treat as absent
        console.warn("Failed to parse origin/referer header:", error);
        requestDomain = null;
      }

      if (!requestDomain) {
        return createCorsResponse(
          { message: "Origin or Referer header required" },
          403
        );
      }

      // Allow localhost in development (for local testing)
      const isLocalhost =
        requestDomain === "localhost" || requestDomain === "127.0.0.1";
      if (isLocalhost && process.env.NODE_ENV === "development") {
        // Skip domain validation for localhost in development
      } else {
        // Check if domain matches any allowed domain (exact match or subdomain)
        const isAllowed = tokenValidation.allowedDomains.some(
          (allowedDomain) => {
            // Exact match
            if (requestDomain === allowedDomain) {
              return true;
            }
            // Subdomain match (e.g., www.example.com matches example.com)
            if (requestDomain.endsWith(`.${allowedDomain}`)) {
              return true;
            }
            return false;
          }
        );

        if (!isAllowed) {
          return createCorsResponse(
            {
              message: `Domain ${requestDomain} is not allowed for this token`,
            },
            403
          );
        }
      }
    }

    // Check usage limits
    if (tokenValidation.organizationId) {
      const usageCheck = await checkEventLimit(tokenValidation.organizationId);

      if (!usageCheck.allowed) {
        return createCorsResponse(
          {
            message: usageCheck.message || "Usage limit exceeded",
            currentUsage: usageCheck.currentUsage,
            limit: usageCheck.limit,
          },
          429
        );
      }
    }

    // Extract client IP and get location data
    const clientIP = extractClientIP(request);
    let locationData: GeoLocation | null = null;

    if (clientIP) {
      try {
        // Pass request object to getLocationFromIP so it can read Cloudflare headers
        locationData = await getLocationFromIP(clientIP, request);
        if (locationData) {
          console.log(
            `Location data retrieved for IP ${clientIP}: ${locationData.city}, ${locationData.country}`
          );
        }
      } catch (locationError) {
        console.warn("Error fetching location data:", locationError);
        // Continue without location data
      }
    }

    // Generate unique IDs for tracking
    const pageViewId = randomBytes(16).toString("hex");

    // Track session in Redis for real-time live count
    if (payload.sessionId) {
      await trackSessionStart(payload.projectId, payload.sessionId);
    }

    // Queue event for background worker processing
    try {
      const queuedEvent: QueuedEvent = {
        id: eventId,
        type: "pageview",
        payload: {
          id: pageViewId,
          url: payload.url,
          timestamp: payload.timestamp,
          projectId: payload.projectId,
          userAgent: payload.userAgent,
          ip: locationData?.ip,
          country: locationData?.country,
          countryCode: locationData?.countryCode,
          region: locationData?.region,
          regionName: locationData?.regionName,
          city: locationData?.city,
          zip: locationData?.zip,
          lat: locationData?.lat,
          lon: locationData?.lon,
          timezone: locationData?.timezone,
          isp: locationData?.isp,
          mobile: isMobileDevice(payload.userAgent),
          sessionId: payload.sessionId,
          referrer: payload.referrer,
          utmSource: payload.utmSource,
          utmMedium: payload.utmMedium,
          utmCampaign: payload.utmCampaign,
          utmTerm: payload.utmTerm,
          utmContent: payload.utmContent,
          title: payload.title,
          description: payload.description,
          ogImage: payload.ogImage,
          ogTitle: payload.ogTitle,
          favicon: payload.favicon,
          canonicalUrl: payload.canonicalUrl,
          language: payload.language,
          robots: payload.robots,
          referrerHostname: payload.referrerHostname,
          referrerPath: payload.referrerPath,
          referrerType: payload.referrerType,
          utmId: payload.utmId,
          gclid: payload.gclid,
          fbclid: payload.fbclid,
          msclkid: payload.msclkid,
          ttclid: payload.ttclid,
          liFatId: payload.liFatId,
          twclid: payload.twclid,
          isNewVisitor: payload.isNewVisitor,
          landingPage: payload.landingPage,
        },
        queuedAt: new Date().toISOString(),
        projectId: payload.projectId,
      };

      await pushToQueue(queuedEvent);
      
      await publishDebugLog({
        timestamp: new Date().toISOString(),
        stage: "queue",
        level: "info",
        message: "Event queued for worker processing",
        data: { eventId, pageViewId },
        eventId,
        projectId: payload.projectId,
      });
    } catch (queueError) {
      // Don't fail the request if queue push fails
      console.error("Failed to push to queue:", queueError);
      await publishDebugLog({
        timestamp: new Date().toISOString(),
        stage: "queue",
        level: "error",
        message: "Failed to queue event",
        data: {
          error:
            queueError instanceof Error
              ? queueError.message
              : String(queueError),
        },
        eventId,
        projectId: payload.projectId,
      });
    }

    const orgId = tokenValidation.organizationId;
    if (orgId) {
      // Fire and forget - send to Polar async without blocking response
      Promise.resolve()
        .then(async () => {
          try {
            const org = await prisma.organization.findUnique({
              where: { id: orgId },
              select: { polarCustomerId: true },
            });

            if (org?.polarCustomerId) {
              await sendEventToPolar({
                organizationId: orgId,
                polarCustomerId: org.polarCustomerId,
                eventType: "pageview",
                metadata: {
                  url: payload.url,
                  projectId: payload.projectId,
                },
              }).catch((err) => {
                console.error("Failed to send pageview to Polar:", err);
              });
            }
          } catch (err) {
            console.error("Failed to fetch organization for Polar:", err);
          }
        })
        .catch(() => {
          // Silently fail - sending to Polar is non-critical
        });
    }

    const totalDuration = Date.now() - requestStartTime;
    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "ingestion",
      level: "info",
      message: "Request completed successfully",
      data: { eventId, pageViewId },
      eventId,
      projectId: payload.projectId,
      duration: totalDuration,
    });

    return createCorsResponse(
      { message: "Data received and stored", eventId },
      200
    );
  } catch (error) {
    console.error("❌ API: Error processing tracking data:", error);

    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "ingestion",
      level: "error",
      message: "Request failed",
      data: { error: error instanceof Error ? error.message : String(error) },
      eventId,
    });
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
    }
    // Return error response
    return createCorsResponse(
      {
        message: "Error processing request",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
}
