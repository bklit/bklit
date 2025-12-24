import { getCountryNameFromCode } from "@/lib/maps/country-coordinates";
import type { GeoLocation, IpGeoResponse } from "@/types/geo";

interface LocationData extends GeoLocation {
  ip: string;
}

/**
 * Extract geolocation data from Cloudflare headers
 * Cloudflare adds these headers when requests pass through their network
 *
 * Available headers (when IP Geolocation and Managed Transforms are enabled):
 * - CF-IPCountry: 2-letter country code
 * - CF-Region: Region/state name
 * - CF-RegionCode: ISO region code
 * - CF-City: City name
 * - CF-PostalCode: Postal/ZIP code
 * - CF-Latitude: Latitude coordinate
 * - CF-Longitude: Longitude coordinate
 * - CF-Timezone: Timezone (e.g., "America/New_York")
 */
function getLocationFromCloudflareHeaders(
  request: Request,
  ip: string,
): LocationData | null {
  const headers = request.headers;

  // Check if Cloudflare headers are present
  const countryCode = headers.get("cf-ipcountry");
  if (!countryCode) {
    // No CF headers present - request didn't go through Cloudflare
    return null;
  }

  // Extract all available Cloudflare geolocation headers
  // Note: Header names are case-insensitive, but Cloudflare typically uses lowercase
  const region = headers.get("cf-region") || undefined;
  const regionCode = headers.get("cf-regioncode") || undefined; // ISO region code
  const city = headers.get("cf-city") || undefined;
  const postalCode = headers.get("cf-postalcode") || undefined; // Postal/ZIP code
  const latitude = headers.get("cf-latitude");
  const longitude = headers.get("cf-longitude");
  const timezone = headers.get("cf-timezone") || undefined;

  // Parse coordinates - use null if not available, then convert to 0 for database
  const lat = latitude ? parseFloat(latitude) : null;
  const lon = longitude ? parseFloat(longitude) : null;

  // Map Cloudflare's 2-letter country code to full country name
  // Cloudflare provides CF-IPCountry as a 2-letter ISO 3166-1 alpha-2 code
  // This ensures consistency with ip-api format and downstream consumers
  const country = getCountryNameFromCode(countryCode);

  // Log available headers for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("Cloudflare geolocation headers:", {
      country,
      countryCode,
      region,
      regionCode,
      city,
      postalCode,
      latitude,
      longitude,
      timezone,
      ip,
    });
  }

  return {
    ip: ip,
    country: country, // Full country name mapped from code
    countryCode: countryCode, // 2-letter ISO country code from Cloudflare
    region: regionCode || region, // Prefer regionCode if available, fallback to region
    regionName: region, // Full region name
    city: city,
    zip: postalCode, // Use postal code if available
    lat: lat ?? 0, // Convert null to 0 for database (schema expects number)
    lon: lon ?? 0, // Convert null to 0 for database (schema expects number)
    timezone: timezone,
    // ISP and mobile not available from Cloudflare
    isp: undefined,
    mobile: undefined,
  };
}

export async function getLocationFromIP(
  ip: string,
  request?: Request,
): Promise<LocationData | null> {
  try {
    // Skip localhost and private IPs
    if (
      ip === "127.0.0.1" ||
      ip === "localhost" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.")
    ) {
      return null;
    }

    // First, try to get geolocation from Cloudflare headers (if request is provided)
    if (request) {
      const cfLocation = getLocationFromCloudflareHeaders(request, ip);
      if (cfLocation) {
        return cfLocation;
      }
    }

    // Cloudflare headers not available - fallback to ip-api.com
    // Note: ip-api.com free tier has 45 requests/minute limit
    return await getLocationFromIPApi(ip);
  } catch (error) {
    console.error(`Error fetching location data for IP ${ip}:`, error);
    return null;
  }
}

async function getLocationFromIPApi(ip: string): Promise<LocationData | null> {
  try {
    // Use ipapi.co - supports HTTPS on free tier (1000 requests/day)
    const url = `https://ipapi.co/${ip}/json/`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "bklit-analytics",
      },
    });

    if (!response.ok) {
      console.warn(`ipapi.co request failed for IP ${ip}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.warn(`ipapi.co returned error for IP ${ip}: ${data.reason}`);
      return null;
    }

    return {
      ip: data.ip,
      country: data.country_name,
      countryCode: data.country_code,
      region: data.region_code,
      regionName: data.region,
      city: data.city,
      zip: data.postal,
      lat: data.latitude,
      lon: data.longitude,
      timezone: data.timezone,
      isp: data.org,
      mobile: undefined,
    };
  } catch (error) {
    console.error(`Error fetching geolocation for IP ${ip}:`, error);
    return null;
  }
}

export function extractClientIP(request: Request): string | null {
  const headers = request.headers;

  // Prioritize Cloudflare's connecting IP header (most accurate when using CF as proxy)
  const cfConnectingIP = headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to other headers (for non-Cloudflare environments)
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0]?.trim() ?? forwardedFor;
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const clientIP = headers.get("x-client-ip");
  if (clientIP) {
    return clientIP;
  }

  // For local development, you might need to handle this differently
  // since the request might come from localhost
  return null;
}
