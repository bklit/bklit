import { getClickHouseClient } from "../client";

async function addCountryCodeToSession() {
  const client = getClickHouseClient();

  console.log("Adding country_code column to tracked_session table...");

  try {
    // Add country_code column to tracked_session table
    await client.exec({
      query: `
        ALTER TABLE tracked_session
        ADD COLUMN IF NOT EXISTS country_code Nullable(String)
      `,
    });

    console.log("✓ Successfully added country_code column to tracked_session");
    await client.close();
  } catch (error) {
    console.error("Error adding country_code column:", error);
    await client.close();
    throw error;
  }
}

addCountryCodeToSession().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
