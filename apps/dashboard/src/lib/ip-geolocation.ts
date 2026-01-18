import path from "node:path";
import { Reader } from "@maxmind/geoip2-node";
import type ReaderModel from "@maxmind/geoip2-node/dist/src/readerModel";
import { getCountryNameFromCode } from "@/lib/maps/country-coordinates";
import type { GeoLocation, IpGeoResponse } from "@/types/geo";

interface LocationData extends GeoLocation {
  ip: string;
}

// Singleton instance of GeoIP2 reader
let geoipReader: ReaderModel | null = null;

/**
 * Initialize MaxMind GeoIP2 reader
 * Downloads GeoLite2 database from MaxMind (requires free account)
 * @see https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
 */
async function getGeoIPReader(): Promise<ReaderModel | null> {
  if (geoipReader) {
    return geoipReader;
  }

  try {
    // Path to GeoLite2-City.mmdb database file
    // Download from: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
    const dbPath = path.join(process.cwd(), "data", "GeoLite2-City.mmdb");
    geoipReader = await Reader.open(dbPath);
    console.log("GeoIP2 database loaded successfully");
    return geoipReader;
  } catch (error) {
    console.warn(
      "GeoIP2 database not found. Falling back to Cloudflare headers.",
      error
    );
    return null;
  }
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
  ip: string
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
  const lat = latitude ? Number.parseFloat(latitude) : null;
  const lon = longitude ? Number.parseFloat(longitude) : null;

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
    ip,
    country, // Full country name mapped from code
    countryCode, // 2-letter ISO country code from Cloudflare
    region: regionCode || region, // Prefer regionCode if available, fallback to region
    regionName: region, // Full region name
    city,
    zip: postalCode, // Use postal code if available
    lat: lat ?? 0, // Convert null to 0 for database (schema expects number)
    lon: lon ?? 0, // Convert null to 0 for database (schema expects number)
    timezone,
    // ISP and mobile not available from Cloudflare
    isp: undefined,
    mobile: undefined,
  };
}

export async function getLocationFromIP(
  ip: string,
  request?: Request
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

    // PRIMARY: Try local MaxMind GeoIP2 database (GDPR-compliant, no external API calls)
    const geoipLocation = await getLocationFromGeoIP(ip);
    if (geoipLocation) {
      return geoipLocation;
    }

    // FALLBACK 1: Use Cloudflare headers (privacy-friendly, no external calls)
    if (request) {
      const cfLocation = getLocationFromCloudflareHeaders(request, ip);
      if (cfLocation) {
        return cfLocation;
      }
    }

    // FALLBACK 2: Use ip-api.com ONLY if both above methods fail
    // Note: This sends IP to third-party service - use sparingly
    const ipApiLocation = await getLocationFromIPApi(ip);
    if (ipApiLocation) {
      return ipApiLocation;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching location data for IP ${ip}:`, error);
    return null;
  }
}

/**
 * Get geolocation from local MaxMind GeoIP2 database
 * GDPR-compliant: No external API calls, all lookups are local
 */
async function getLocationFromGeoIP(ip: string): Promise<LocationData | null> {
  try {
    const reader = await getGeoIPReader();
    if (!reader) {
      return null;
    }

    // reader.city() is synchronous and returns the response directly
    const response = reader.city(ip);

    // Extract location data from MaxMind response
    const country = response.country?.names?.en || undefined;
    const countryCode = response.country?.isoCode;
    const city = response.city?.names?.en || undefined;
    const postalCode = response.postal?.code || undefined;
    const latitude = response.location?.latitude ?? null;
    const longitude = response.location?.longitude ?? null;
    const timezone = response.location?.timeZone || undefined;

    // MaxMind provides subdivision info (state/region)
    const subdivision = response.subdivisions?.[0];
    const regionCode = subdivision?.isoCode || undefined;
    const regionName = subdivision?.names?.en || undefined;

    // If we don't have a country code, return null (invalid/incomplete geolocation data)
    if (!countryCode) {
      return null;
    }

    return {
      ip,
      country,
      countryCode,
      region: regionCode,
      regionName,
      city,
      zip: postalCode,
      lat: latitude ?? 0,
      lon: longitude ?? 0,
      timezone,
      isp: undefined, // MaxMind City DB doesn't include ISP (need GeoIP2-ISP for that)
      mobile: undefined,
    };
  } catch (error) {
    console.error(`Error looking up IP ${ip} in GeoIP database:`, error);
    return null;
  }
}

/**
 * Fallback: Get geolocation from ip-api.com
 * WARNING: Sends IP to third-party service - use as last resort only
 * Now uses HTTPS for encrypted transmission (still not GDPR-ideal)
 */
async function getLocationFromIPApi(ip: string): Promise<LocationData | null> {
  try {
    const fields =
      "status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,currency,isp,mobile,query";

    // Use HTTPS for encrypted transmission (previously was HTTP)
    // Note: Free tier may not support HTTPS - consider upgrading to Pro or removing this fallback
    const url = `https://ip-api.com/json/${ip}?fields=${fields}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`IP-API request failed for IP ${ip}: ${response.status}`);
      return null;
    }

    const data: IpGeoResponse = await response.json();

    if (data.status === "success") {
      return {
        ip: data.query,
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
    console.warn(`IP-API returned error for IP ${ip}: ${data.message}`);
    return null;
  } catch (error) {
    console.error(
      `Error fetching location data from ip-api for IP ${ip}:`,
      error
    );
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
    return forwardedFor.split(",")[0]?.trim() ?? null;
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
