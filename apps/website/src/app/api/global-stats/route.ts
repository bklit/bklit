import { AnalyticsService } from "@bklit/analytics/service";
import { NextResponse } from "next/server";
import type { GlobalStats } from "@/types/global-stats";

export const revalidate = 300;

export async function GET() {
  try {
    const analytics = new AnalyticsService();

    const [
      sessionsResult,
      pageviewsResult,
      uniqueUsersResult,
      conversionsResult,
    ] = await Promise.all([
      analytics.client.query({
        query:
          "SELECT count(DISTINCT session_id) as count FROM tracked_session",
        format: "JSONEachRow",
      }),
      analytics.client.query({
        query: "SELECT count() as count FROM page_view_event",
        format: "JSONEachRow",
      }),
      analytics.client.query({
        query:
          "SELECT count(DISTINCT visitor_id) as count FROM tracked_session WHERE visitor_id IS NOT NULL",
        format: "JSONEachRow",
      }),
      analytics.client.query({
        query: "SELECT count() as count FROM tracked_event",
        format: "JSONEachRow",
      }),
    ]);

    const sessions = (await sessionsResult.json()) as Array<{ count: number }>;
    const pageviews = (await pageviewsResult.json()) as Array<{
      count: number;
    }>;
    const uniqueUsers = (await uniqueUsersResult.json()) as Array<{
      count: number;
    }>;
    const conversions = (await conversionsResult.json()) as Array<{
      count: number;
    }>;

    const stats: GlobalStats = {
      totalSessions: sessions[0]?.count || 0,
      totalPageviews: pageviews[0]?.count || 0,
      totalUniqueUsers: uniqueUsers[0]?.count || 0,
      totalConversions: conversions[0]?.count || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return NextResponse.json(
      {
        totalSessions: 0,
        totalPageviews: 0,
        totalUniqueUsers: 0,
        totalConversions: 0,
      },
      { status: 500 },
    );
  }
}
