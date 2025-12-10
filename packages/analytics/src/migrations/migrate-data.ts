import { createRequire } from "module";
import { fileURLToPath } from "url";
import { AnalyticsService } from "../service";

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(__filename);
const dbClientPath = require.resolve("@bklit/db/client");
const { prisma } = await import(dbClientPath);

async function migrateData() {
  const analytics = new AnalyticsService();

  console.log("Starting data migration from Postgres to ClickHouse...");

  let pageViewCount = 0;
  let eventCount = 0;
  let sessionCount = 0;

  const batchSize = 1000;

  console.log("Migrating PageViewEvent...");
  const allSessions = await prisma.trackedSession.findMany({
    select: { id: true, sessionId: true },
  });
  const sessionIdMap = new Map(allSessions.map((s) => [s.id, s.sessionId]));

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
        console.error(`Error migrating page view ${pv.id}:`, error);
      }
    }

    pageViewOffset += batchSize;
    console.log(`Migrated ${pageViewCount} page views...`);
  }

  console.log("Migrating TrackedEvent...");
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
        console.error(`Error migrating event ${event.id}:`, error);
      }
    }

    eventOffset += batchSize;
    console.log(`Migrated ${eventCount} events...`);
  }

  console.log("Migrating TrackedSession...");
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
        await analytics.createTrackedSession({
          id: session.id,
          sessionId: session.sessionId,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          duration: session.duration,
          didBounce: session.didBounce,
          visitorId: session.visitorId,
          entryPage: session.entryPage,
          exitPage: session.exitPage,
          userAgent: session.userAgent,
          country: session.country,
          city: session.city,
          projectId: session.projectId,
        });
        sessionCount++;
      } catch (error) {
        console.error(`Error migrating session ${session.id}:`, error);
      }
    }

    sessionOffset += batchSize;
    console.log(`Migrated ${sessionCount} sessions...`);
  }

  console.log("\nMigration completed!");
  console.log(`PageViewEvent: ${pageViewCount} records`);
  console.log(`TrackedEvent: ${eventCount} records`);
  console.log(`TrackedSession: ${sessionCount} records`);

  const postgresCounts = {
    pageViews: await prisma.pageViewEvent.count(),
    events: await prisma.trackedEvent.count(),
    sessions: await prisma.trackedSession.count(),
  };

  console.log("\nPostgres counts:");
  console.log(`PageViewEvent: ${postgresCounts.pageViews}`);
  console.log(`TrackedEvent: ${postgresCounts.events}`);
  console.log(`TrackedSession: ${postgresCounts.sessions}`);

  if (
    pageViewCount === postgresCounts.pageViews &&
    eventCount === postgresCounts.events &&
    sessionCount === postgresCounts.sessions
  ) {
    console.log("\n✓ All data migrated successfully!");
  } else {
    console.log("\n⚠️ Count mismatch detected. Please verify data integrity.");
  }
}

migrateData().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
