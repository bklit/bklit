import { randomBytes } from "node:crypto";
import { AnalyticsService, sendEventToPolar } from "@bklit/analytics";
import { prisma } from "@bklit/db/client";
import "@bklit/redis"; // Initialize Redis on first import
import { trackSessionStart } from "@bklit/redis";
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
  try {
    const payload: TrackingPayload = await request.json();
    console.log("📊 API: Page view tracking request received", {
      url: payload.url,
      projectId: payload.projectId,
      sessionId: payload.sessionId,
      timestamp: payload.timestamp,
      userAgent: payload.userAgent,
    });
    console.log("🔍 API: Starting processing...");

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

    const analytics = new AnalyticsService();
    const pageViewId = randomBytes(16).toString("hex");

    // Check if this is a new session BEFORE saving (for toast notification)
    let isNewSession = false;
    if (payload.sessionId) {
      isNewSession = !(await analytics.sessionExists(
        payload.sessionId,
        payload.projectId
      ));
    }

    if (payload.sessionId) {
      try {
        console.log("🔄 API: Processing session and saving page view...", {
          sessionId: payload.sessionId,
          projectId: payload.projectId,
          url: payload.url,
          isNewSession,
        });

        const sessionId = payload.sessionId;

        // Generate visitor ID from user agent (simple hash)
        const generateVisitorId = (userAgent: string): string => {
          let hash = 0;
          for (let i = 0; i < userAgent.length; i++) {
            const char = userAgent.charCodeAt(i);
            // biome-ignore lint/suspicious/noBitwiseOperators: Intentional use for hash generation
            hash = (hash << 5) - hash + char;
            // biome-ignore lint/suspicious/noBitwiseOperators: Intentional use for hash generation
            hash &= hash;
          }
          return Math.abs(hash).toString(36);
        };

        // Save page view first
        console.log("💾 API: About to save page view to ClickHouse...");
        await analytics.createPageView({
          id: pageViewId,
          url: payload.url,
          timestamp: new Date(payload.timestamp),
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
          sessionId,
          referrer: payload.referrer,
          utmSource: payload.utmSource,
          utmMedium: payload.utmMedium,
          utmCampaign: payload.utmCampaign,
          utmTerm: payload.utmTerm,
          utmContent: payload.utmContent,
          // Page metadata
          title: payload.title,
          description: payload.description,
          ogImage: payload.ogImage,
          ogTitle: payload.ogTitle,
          favicon: payload.favicon,
          canonicalUrl: payload.canonicalUrl,
          language: payload.language,
          robots: payload.robots,
          // Enhanced campaign tracking
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
          // Session tracking
          isNewVisitor: payload.isNewVisitor,
          landingPage: payload.landingPage,
        });

        // Create or update session in ClickHouse
        if (isNewSession) {
          console.log("🆕 API: Creating new session in ClickHouse...");
          // Generate a unique ID for the session
          const sessionDbId = randomBytes(16).toString("hex");
          const visitorId = payload.userAgent
            ? generateVisitorId(payload.userAgent)
            : null;

          await analytics.createTrackedSession({
            id: sessionDbId,
            sessionId,
            startedAt: new Date(payload.timestamp),
            endedAt: null,
            duration: null,
            didBounce: true, // Will be updated if they visit more pages
            visitorId,
            entryPage: payload.url,
            exitPage: payload.url,
            userAgent: payload.userAgent,
            country: locationData?.country,
            countryCode: locationData?.countryCode,
            city: locationData?.city,
            projectId: payload.projectId,
          });

          console.log("✅ API: New session created in ClickHouse", {
            sessionId,
            projectId: payload.projectId,
          });
        } else {
          console.log("🔄 API: Updating existing session in ClickHouse...");
          // Update existing session in ClickHouse
          await analytics.updateTrackedSession(sessionId, {
            exitPage: payload.url,
          });

          console.log("✅ API: Session updated in ClickHouse", {
            sessionId,
            projectId: payload.projectId,
          });
        }

        console.log("✅ API: Page view and session saved to ClickHouse", {
          sessionId: payload.sessionId,
          projectId: payload.projectId,
        });
      } catch (error) {
        console.error("❌ API: Error saving to ClickHouse:", error);
        // Re-throw to return error response
        throw error;
      }
    } else {
      try {
        console.log("💾 API: Saving page view to ClickHouse (no session)...", {
          url: payload.url,
          projectId: payload.projectId,
        });

        await analytics.createPageView({
          id: pageViewId,
          url: payload.url,
          timestamp: new Date(payload.timestamp),
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
          sessionId: null,
          referrer: payload.referrer,
          utmSource: payload.utmSource,
          utmMedium: payload.utmMedium,
          utmCampaign: payload.utmCampaign,
          utmTerm: payload.utmTerm,
          utmContent: payload.utmContent,
        });

        console.log("✅ API: Page view saved to ClickHouse successfully", {
          projectId: payload.projectId,
        });
      } catch (error) {
        console.error("❌ API: Error saving page view to ClickHouse:", error);
        // Re-throw to return error response
        throw error;
      }
    }

    console.log("✅ API: Page view tracking completed successfully", {
      projectId: payload.projectId,
      sessionId: payload.sessionId,
    });

    // Track session in Redis for real-time live count (if available)
    if (payload.sessionId) {
      await trackSessionStart(payload.projectId, payload.sessionId);
    }

    // Real-time notification via direct HTTP to WebSocket server (faster than Redis PUB/SUB)
    // isNewSession was calculated earlier (before saving to ClickHouse)
    // #region agent log
    console.log("[DEBUG H5] Sending event directly to WebSocket server:", {
      projectId: payload.projectId,
      url: payload.url,
      sessionId: payload.sessionId,
      isNewSession,
    });
    // #endregion

    // Send directly to WebSocket server instead of going through Redis PUB/SUB
    fetch("https://ws.bklit.ai/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: payload.projectId,
        type: "pageview",
        timestamp: new Date().toISOString(),
        data: {
          url: payload.url,
          country: locationData?.country,
          countryCode: locationData?.countryCode,
          city: locationData?.city,
          sessionId: payload.sessionId,
          mobile: isMobileDevice(payload.userAgent),
          title: payload.title,
          lat: locationData?.lat,
          lon: locationData?.lon,
          userAgent: payload.userAgent,
          isNewSession, // Flag to show toast only on new sessions
        },
      }),
    }).catch(() => {
      // Swallow errors - real-time is optional
    });

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

    return createCorsResponse({ message: "Data received and stored" }, 200);
  } catch (error) {
    console.error("❌ API: Error processing tracking data:", error);
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
