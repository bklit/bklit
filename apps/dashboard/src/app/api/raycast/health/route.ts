export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check endpoint for Raycast API
 * Used by Vercel cron to keep functions warm and prevent cold starts
 * This endpoint is lightweight - no DB queries, no auth, no external calls
 */
export function GET() {
  return Response.json({
    status: "ok",
    timestamp: Date.now(),
    service: "raycast-api",
  });
}
