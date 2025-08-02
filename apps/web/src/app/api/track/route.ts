import { prisma } from "@bklit/db";
import { type NextRequest, NextResponse } from "next/server";
import { createOrUpdateSession } from "@/actions/session-actions";
import { extractClientIP, getLocationFromIP } from "@/lib/ip-geolocation";
import type { GeoLocation } from "@/types/geo";

interface TrackingPayload {
  url: string;
  timestamp: string;
  siteId: string;
  userAgent?: string;
  sessionId?: string;
  referrer?: string;
}

// Helper function to create a response with CORS headers
function createCorsResponse(
  body: Record<string, unknown> | { message: string; error?: string },
  status: number,
) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return createCorsResponse({ message: "CORS preflight OK" }, 200);
}

export async function POST(request: NextRequest) {
  try {
    const payload: TrackingPayload = await request.json();
    console.log("📊 API: Page view tracking request received", {
      url: payload.url,
      siteId: payload.siteId,
      sessionId: payload.sessionId,
      timestamp: payload.timestamp,
    });

    if (!payload.siteId) {
      return createCorsResponse({ message: "siteId is required" }, 400);
    }

    // Extract client IP and get location data
    const clientIP = extractClientIP(request);
    let locationData: GeoLocation | null = null;

    if (clientIP) {
      try {
        locationData = await getLocationFromIP(clientIP);
        if (locationData) {
          console.log(
            `Location data retrieved for IP ${clientIP}: ${locationData.city}, ${locationData.country}`,
          );
        }
      } catch (locationError) {
        console.warn("Error fetching location data:", locationError);
        // Continue without location data
      }
    }

    // Note: Redis storage removed - all data is now stored in PostgreSQL
    // Real-time features are handled via session tracking

    // Handle session tracking and page view creation in a transaction
    if (payload.sessionId) {
      try {
        console.log(
          "🔄 API: Updating session and saving page view in transaction...",
          {
            sessionId: payload.sessionId,
            siteId: payload.siteId,
            url: payload.url,
          },
        );

        if (!payload.sessionId) {
          throw new Error("sessionId is required for this operation");
        }
        const sessionId = payload.sessionId;

        await prisma.$transaction(async (tx) => {
          // Upsert session using the transaction client
          const session = await createOrUpdateSession(
            {
              sessionId: sessionId,
              siteId: payload.siteId,
              url: payload.url,
              userAgent: payload.userAgent,
              country: locationData?.country,
              city: locationData?.city,
            },
            tx as typeof prisma,
          );

          console.log("🔗 API: Session upserted successfully", {
            sessionId: session.sessionId,
            sessionDbId: session.id,
            siteId: session.siteId,
          });

          // DEDUPLICATION: Check for recent identical page view event
          const recentPageView = await tx.pageViewEvent.findFirst({
            where: {
              sessionId: session.id,
              url: payload.url,
              timestamp: {
                gte: new Date(Date.now() - 2000), // 2 seconds window
              },
            },
            orderBy: { timestamp: "desc" },
          });

          if (recentPageView) {
            console.log("⏭️ Duplicate page view detected, skipping insert:", {
              sessionId: session.id,
              url: payload.url,
            });
            return;
          }

          // Create page view event using the session's primary key (id)
          await tx.pageViewEvent.create({
            data: {
              url: payload.url,
              timestamp: new Date(payload.timestamp),
              siteId: payload.siteId,
              userAgent: payload.userAgent,
              // Location data
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
              mobile: locationData?.mobile,
              // Link to session using the primary key (id), not the sessionId
              sessionId: session.id,
            },
          });

          console.log("📄 API: Page view event created successfully", {
            url: payload.url,
            sessionDbId: session.id,
          });
        });
        console.log(
          "✅ API: Session updated and page view saved successfully",
          {
            sessionId: payload.sessionId,
            siteId: payload.siteId,
          },
        );
      } catch (sessionError) {
        console.error(
          "❌ API: Error updating session or saving page view:",
          sessionError,
        );
        // Continue execution - session tracking failed but page view tracking should still work
      }
    } else {
      // Save page view to database for historical persistence (no session)
      try {
        console.log("💾 API: Saving page view to database (no session)...", {
          url: payload.url,
          siteId: payload.siteId,
        });
        await prisma.pageViewEvent.create({
          data: {
            url: payload.url,
            timestamp: new Date(payload.timestamp),
            siteId: payload.siteId,
            userAgent: payload.userAgent,
            // Location data
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
            mobile: locationData?.mobile,
            // No session link
            sessionId: null,
          },
        });
        console.log(
          "✅ API: Page view saved to database successfully (no session)",
          {
            siteId: payload.siteId,
          },
        );
      } catch (dbError) {
        console.error(
          "❌ API: Error saving page view to database (no session):",
          dbError,
        );
        // Continue execution - session tracking failed but page view tracking should still work
      }
    }

    console.log("✅ API: Page view tracking completed successfully", {
      siteId: payload.siteId,
      sessionId: payload.sessionId,
    });

    return createCorsResponse({ message: "Data received and stored" }, 200);
  } catch (error) {
    console.error("Error processing tracking data:", error);
    // Check if the error is from JSON parsing etc.
    let errorMessage = "Error processing request";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return createCorsResponse(
      { message: "Error processing request", error: errorMessage },
      500,
    );
  }
}
