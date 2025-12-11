import { getClickHouseClient } from "../client";

async function verifyData() {
  const client = getClickHouseClient();

  console.log("🔍 Verifying ClickHouse data...\n");
  console.log(`⏰ Server Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  console.log(`⏰ Current Server Time: ${new Date().toLocaleString()} (UTC: ${new Date().toISOString()})\n`);

  try {
    // Check table counts
    console.log("📊 Table Counts:");
    console.log("─".repeat(50));

    const pageViewCount = await client.query({
      query: `SELECT count() as count FROM page_view_event`,
      format: "JSONEachRow",
    });
    const pageViewRows = (await pageViewCount.json()) as Array<{ count: number }>;
    console.log(`Page Views: ${pageViewRows[0]?.count || 0}`);

    const sessionCount = await client.query({
      query: `SELECT count() as count FROM tracked_session`,
      format: "JSONEachRow",
    });
    const sessionRows = (await sessionCount.json()) as Array<{ count: number }>;
    console.log(`Sessions (total rows): ${sessionRows[0]?.count || 0}`);

    // Count unique sessions (latest per session_id)
    const uniqueSessionCount = await client.query({
      query: `
        SELECT count() as count
        FROM (
          SELECT session_id
          FROM tracked_session
          GROUP BY session_id
        )
      `,
      format: "JSONEachRow",
    });
    const uniqueSessionRows = (await uniqueSessionCount.json()) as Array<{ count: number }>;
    console.log(`Unique Sessions: ${uniqueSessionRows[0]?.count || 0}`);

    const eventCount = await client.query({
      query: `SELECT count() as count FROM tracked_event`,
      format: "JSONEachRow",
    });
    const eventRows = (await eventCount.json()) as Array<{ count: number }>;
    console.log(`Events: ${eventRows[0]?.count || 0}`);

    console.log("\n");

    // Show recent sessions
    console.log("📅 Recent Sessions (Latest 5):");
    console.log("─".repeat(50));
    const recentSessions = await client.query({
      query: `
        SELECT 
          session_id,
          started_at,
          updated_at,
          entry_page,
          exit_page,
          country,
          city,
          project_id
        FROM (
          SELECT 
            session_id,
            started_at,
            updated_at,
            entry_page,
            exit_page,
            country,
            city,
            project_id,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
        )
        WHERE rn = 1
        ORDER BY updated_at DESC
        LIMIT 10
      `,
      format: "JSONEachRow",
    });
    const sessions = (await recentSessions.json()) as Array<{
      session_id: string;
      started_at: string;
      updated_at: string;
      entry_page: string;
      exit_page: string | null;
      country: string | null;
      city: string | null;
      project_id: string;
    }>;

    if (sessions.length === 0) {
      console.log("No sessions found");
    } else {
      sessions.forEach((session, index) => {
        const startedAt = new Date(session.started_at);
        const updatedAt = new Date(session.updated_at);
        console.log(`\n${index + 1}. Session: ${session.session_id}`);
        console.log(`   Started: ${startedAt.toLocaleString()} (UTC: ${startedAt.toISOString()})`);
        console.log(`   Updated: ${updatedAt.toLocaleString()} (UTC: ${updatedAt.toISOString()})`);
        console.log(`   Entry: ${session.entry_page}`);
        console.log(`   Exit: ${session.exit_page || "N/A"}`);
        console.log(`   Location: ${session.city || "N/A"}, ${session.country || "N/A"}`);
        console.log(`   Project: ${session.project_id}`);
      });
    }

    console.log("\n");

    // Show recent page views
    console.log("👁️  Recent Page Views (Latest 5):");
    console.log("─".repeat(50));
    const recentPageViews = await client.query({
      query: `
        SELECT 
          id,
          url,
          timestamp,
          session_id,
          project_id,
          country,
          city
        FROM page_view_event
        ORDER BY timestamp DESC
        LIMIT 5
      `,
      format: "JSONEachRow",
    });
    const pageViews = (await recentPageViews.json()) as Array<{
      id: string;
      url: string;
      timestamp: string;
      session_id: string | null;
      project_id: string;
      country: string | null;
      city: string | null;
    }>;

    if (pageViews.length === 0) {
      console.log("No page views found");
    } else {
      pageViews.forEach((pv, index) => {
        const timestamp = new Date(pv.timestamp);
        console.log(`\n${index + 1}. Page View: ${pv.id}`);
        console.log(`   URL: ${pv.url}`);
        console.log(`   Time: ${timestamp.toLocaleString()} (UTC: ${timestamp.toISOString()})`);
        console.log(`   Session: ${pv.session_id || "N/A"}`);
        console.log(`   Location: ${pv.city || "N/A"}, ${pv.country || "N/A"}`);
        console.log(`   Project: ${pv.project_id}`);
      });
    }

    console.log("\n");

    // Show sessions by project
    console.log("📈 Sessions by Project:");
    console.log("─".repeat(50));
    const sessionsByProject = await client.query({
      query: `
        SELECT 
          project_id,
          count() as unique_sessions,
          countIf(ended_at IS NULL) as active_sessions
        FROM (
          SELECT 
            project_id,
            ended_at,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
        )
        WHERE rn = 1
        GROUP BY project_id
        ORDER BY unique_sessions DESC
      `,
      format: "JSONEachRow",
    });
    const projectStats = (await sessionsByProject.json()) as Array<{
      project_id: string;
      unique_sessions: number;
      active_sessions: number;
    }>;

    if (projectStats.length === 0) {
      console.log("No project data found");
    } else {
      projectStats.forEach((stat) => {
        console.log(
          `Project ${stat.project_id}: ${stat.unique_sessions} total, ${stat.active_sessions} active`,
        );
      });
    }

    console.log("\n✅ Data verification complete!");
  } catch (error) {
    console.error("❌ Error verifying data:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  }
}

verifyData().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});

