import { checkRedisHealth } from "@bklit/redis";
import { NextResponse } from "next/server";

export async function GET() {
  const healthy = await checkRedisHealth();

  if (!process.env.REDIS_URL) {
    return NextResponse.json({
      status: "disabled",
      mode: "polling",
    });
  }

  return NextResponse.json({
    status: healthy ? "healthy" : "degraded",
    redis: healthy ? "connected" : "disconnected",
    mode: healthy ? "realtime" : "polling-fallback",
  });
}
