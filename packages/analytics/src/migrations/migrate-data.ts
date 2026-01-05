import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { getClickHouseClient } from "../client";
import { AnalyticsService } from "../service";

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(__filename);
const dbClientPath = require.resolve("@bklit/db/client");
const { prisma } = await import(dbClientPath);

// Helper to check if a pageview exists in ClickHouse
async function pageViewExists(id: string): Promise<boolean> {
  const client = getClickHouseClient();
  const result = await client.query({
    query: `SELECT count() as count FROM page_view_event WHERE id = {id:String} LIMIT 1`,
    query_params: { id },
    format: "JSONEachRow",
  });
  const rows = (await result.json()) as Array<{ count: number }>;
  return (rows[0]?.count || 0) > 0;
}

// Helper to check if an event exists in ClickHouse
async function eventExists(id: string): Promise<boolean> {
  const client = getClickHouseClient();
  const result = await client.query({
    query: `SELECT count() as count FROM tracked_event WHERE id = {id:String} LIMIT 1`,
    query_params: { id },
    format: "JSONEachRow",
  });
  const rows = (await result.json()) as Array<{ count: number }>;
  return (rows[0]?.count || 0) > 0;
}

async function migrateData() {
  const analytics = new AnalyticsService();

  console.log("🚀 Starting data migration from Postgres to ClickHouse...\n");

  let pageViewCount = 0;
  let eventCount = 0;
  let sessionCount = 0;
  let pageViewSkipped = 0;
  let eventSkipped = 0;
  let sessionSkipped = 0;
  let pageViewErrors = 0;
  let eventErrors = 0;
  let sessionErrors = 0;

  const batchSize = 1000;

  console.log("📄 Migrating PageViewEvent...");
  const allSessions = await prisma.trackedSession.findMany({
    select: { id: true, sessionId: true },
  });
  const sessionIdMap = new Map(allSessions.map((s) => [s.id, s.sessionId]));

  const totalPageViews = await prisma.pageViewEvent.count();
  console.log(`   Total page views in Postgres: ${totalPageViews}`);

  let pageViewOffset = 0;
  while (true) {
    const pageViews = await prisma.pageViewEvent.findMany({
      skip: pageViewOffset,
      take: batchSize,
      orderBy: { createdAt: "asc" },
    });

    if (pageViews.length === 0) break;

    for (const pv of pageViews) {
      try {
        // Check if already exists
        if (await pageViewExists(pv.id)) {
          pageViewSkipped++;
          continue;
        }

        await analytics.createPageView({
          id: pv.id,
          url: pv.url,
          timestamp: pv.timestamp,
          createdAt: pv.createdAt,
          city: pv.city,
          country: pv.country,
          countryCode: pv.countryCode,
          ip: pv.ip,
          isp: pv.isp,
          lat: pv.lat,
          lon: pv.lon,
          mobile: pv.mobile,
          region: pv.region,
          regionName: pv.regionName,
          timezone: pv.timezone,
          zip: pv.zip,
          userAgent: pv.userAgent,
          sessionId: pv.sessionId
            ? sessionIdMap.get(pv.sessionId) || null
            : null,
          projectId: pv.projectId,
          referrer: pv.referrer,
          utmCampaign: pv.utmCampaign,
          utmContent: pv.utmContent,
          utmMedium: pv.utmMedium,
          utmSource: pv.utmSource,
          utmTerm: pv.utmTerm,
        });
        pageViewCount++;
      } catch (error) {
        console.error(`   ❌ Error migrating page view ${pv.id}:`, error);
        pageViewErrors++;
      }
    }

    pageViewOffset += batchSize;
    console.log(
      `   Progress: ${pageViewCount} migrated, ${pageViewSkipped} skipped, ${pageViewErrors} errors (${pageViewOffset}/${totalPageViews})`,
    );
  }

  console.log("\n🎯 Migrating TrackedEvent...");
  const totalEvents = await prisma.trackedEvent.count();
  console.log(`   Total events in Postgres: ${totalEvents}`);

  let eventOffset = 0;
  while (true) {
    const events = await prisma.trackedEvent.findMany({
      skip: eventOffset,
      take: batchSize,
      orderBy: { createdAt: "asc" },
    });

    if (events.length === 0) break;

    for (const event of events) {
      try {
        // Check if already exists
        if (await eventExists(event.id)) {
          eventSkipped++;
          continue;
        }

        await analytics.createTrackedEvent({
          id: event.id,
          timestamp: event.timestamp,
          metadata: event.metadata as Record<string, unknown> | null,
          createdAt: event.createdAt,
          eventDefinitionId: event.eventDefinitionId,
          projectId: event.projectId,
          sessionId: event.sessionId
            ? sessionIdMap.get(event.sessionId) || null
            : null,
        });
        eventCount++;
      } catch (error) {
        console.error(`   ❌ Error migrating event ${event.id}:`, error);
        eventErrors++;
      }
    }

    eventOffset += batchSize;
    console.log(
      `   Progress: ${eventCount} migrated, ${eventSkipped} skipped, ${eventErrors} errors (${eventOffset}/${totalEvents})`,
    );
  }

  console.log("\n👤 Migrating TrackedSession...");
  const totalSessions = await prisma.trackedSession.count();
  console.log(`   Total sessions in Postgres: ${totalSessions}`);

  let sessionOffset = 0;
  while (true) {
    const sessions = await prisma.trackedSession.findMany({
      skip: sessionOffset,
      take: batchSize,
      orderBy: { startedAt: "asc" },
    });

    if (sessions.length === 0) break;

    for (const session of sessions) {
      try {
        // Check if already exists
        if (
          await analytics.sessionExists(session.sessionId, session.projectId)
        ) {
          sessionSkipped++;
          continue;
        }

        // For migrated sessions, set updated_at = started_at (historical data)
        // We'll need to insert directly to set updated_at correctly
        const client = getClickHouseClient();
        await client.insert({
          table: "tracked_session",
          values: [
            {
              id: session.id,
              session_id: session.sessionId,
              started_at: session.startedAt,
              ended_at: session.endedAt,
              duration: session.duration,
              did_bounce: session.didBounce ?? false,
              visitor_id: session.visitorId,
              entry_page: session.entryPage,
              exit_page: session.exitPage,
              user_agent: session.userAgent,
              country: session.country,
              city: session.city,
              project_id: session.projectId,
              updated_at: session.startedAt, // Set updated_at = started_at for historical data
            },
          ],
          format: "JSONEachRow",
        });
        sessionCount++;
      } catch (error) {
        console.error(`   ❌ Error migrating session ${session.id}:`, error);
        sessionErrors++;
      }
    }

    sessionOffset += batchSize;
    console.log(
      `   Progress: ${sessionCount} migrated, ${sessionSkipped} skipped, ${sessionErrors} errors (${sessionOffset}/${totalSessions})`,
    );
  }

  console.log("\n✅ Migration completed!\n");
  console.log("📊 Migration Summary:");
  console.log(
    `   PageViewEvent: ${pageViewCount} migrated, ${pageViewSkipped} skipped, ${pageViewErrors} errors`,
  );
  console.log(
    `   TrackedEvent: ${eventCount} migrated, ${eventSkipped} skipped, ${eventErrors} errors`,
  );
  console.log(
    `   TrackedSession: ${sessionCount} migrated, ${sessionSkipped} skipped, ${sessionErrors} errors`,
  );

  const postgresCounts = {
    pageViews: await prisma.pageViewEvent.count(),
    events: await prisma.trackedEvent.count(),
    sessions: await prisma.trackedSession.count(),
  };

  console.log("\n📈 Postgres Source Counts:");
  console.log(`   PageViewEvent: ${postgresCounts.pageViews}`);
  console.log(`   TrackedEvent: ${postgresCounts.events}`);
  console.log(`   TrackedSession: ${postgresCounts.sessions}`);

  // Verify ClickHouse counts
  const client = getClickHouseClient();
  const chPageViewCount = await client.query({
    query: `SELECT count() as count FROM page_view_event`,
    format: "JSONEachRow",
  });
  const chPageViewRows = (await chPageViewCount.json()) as Array<{
    count: number;
  }>;

  const chEventCount = await client.query({
    query: `SELECT count() as count FROM tracked_event`,
    format: "JSONEachRow",
  });
  const chEventRows = (await chEventCount.json()) as Array<{ count: number }>;

  const chSessionCount = await client.query({
    query: `SELECT count() as count FROM tracked_session`,
    format: "JSONEachRow",
  });
  const chSessionRows = (await chSessionCount.json()) as Array<{
    count: number;
  }>;

  console.log("\n📊 ClickHouse Destination Counts:");
  console.log(`   PageViewEvent: ${chPageViewRows[0]?.count || 0}`);
  console.log(`   TrackedEvent: ${chEventRows[0]?.count || 0}`);
  console.log(`   TrackedSession: ${chSessionRows[0]?.count || 0}`);

  const allMigrated =
    pageViewCount + pageViewSkipped === postgresCounts.pageViews &&
    eventCount + eventSkipped === postgresCounts.events &&
    sessionCount + sessionSkipped === postgresCounts.sessions;

  if (
    allMigrated &&
    pageViewErrors === 0 &&
    eventErrors === 0 &&
    sessionErrors === 0
  ) {
    console.log("\n✅ All data migrated successfully!");
  } else {
    console.log("\n⚠️ Migration completed with some issues:");
    if (pageViewErrors > 0 || eventErrors > 0 || sessionErrors > 0) {
      console.log(
        `   Errors: ${pageViewErrors + eventErrors + sessionErrors} total`,
      );
    }
    if (!allMigrated) {
      console.log("   Count mismatch detected. Please verify data integrity.");
    }
  }

  await client.close();
  await prisma.$disconnect();
}

migrateData().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
