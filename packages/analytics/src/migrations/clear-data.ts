import { getClickHouseClient } from "../client";

async function clearData() {
  const client = getClickHouseClient();

  console.log("🗑️  Clearing all data from ClickHouse tables...\n");

  try {
    // Clear page_view_event table
    console.log("Clearing page_view_event...");
    await client.exec({
      query: `TRUNCATE TABLE IF EXISTS page_view_event`,
    });
    console.log("✓ Cleared page_view_event");

    // Clear tracked_event table
    console.log("Clearing tracked_event...");
    await client.exec({
      query: `TRUNCATE TABLE IF EXISTS tracked_event`,
    });
    console.log("✓ Cleared tracked_event");

    // Clear tracked_session table
    console.log("Clearing tracked_session...");
    await client.exec({
      query: `TRUNCATE TABLE IF EXISTS tracked_session`,
    });
    console.log("✓ Cleared tracked_session");

    console.log("\n✅ All data cleared successfully!");
    console.log("Tables are still intact and ready for new data.\n");

    // Verify tables are empty
    const pageViewCount = await client.query({
      query: `SELECT count() as count FROM page_view_event`,
      format: "JSONEachRow",
    });
    const pageViewRows = (await pageViewCount.json()) as Array<{
      count: number;
    }>;
    console.log(`Page Views: ${pageViewRows[0]?.count || 0}`);

    const sessionCount = await client.query({
      query: `SELECT count() as count FROM tracked_session`,
      format: "JSONEachRow",
    });
    const sessionRows = (await sessionCount.json()) as Array<{ count: number }>;
    console.log(`Sessions: ${sessionRows[0]?.count || 0}`);

    const eventCount = await client.query({
      query: `SELECT count() as count FROM tracked_event`,
      format: "JSONEachRow",
    });
    const eventRows = (await eventCount.json()) as Array<{ count: number }>;
    console.log(`Events: ${eventRows[0]?.count || 0}`);

    await client.close();
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    await client.close();
    process.exit(1);
  }
}

clearData()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
