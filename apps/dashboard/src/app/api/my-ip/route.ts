import { NextResponse } from "next/server";
import { normalizeIp } from "@/lib/ip-blacklist";
import { extractClientIP } from "@/lib/ip-geolocation";

export async function GET(request: Request) {
  const clientIP = extractClientIP(request);
  const normalizedIP = normalizeIp(clientIP);

  return NextResponse.json({
    ip: normalizedIP,
  });
}
