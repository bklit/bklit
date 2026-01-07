import { getClickHouseClient } from "../client";

async function backfillSessionCountryCodes() {
  const client = getClickHouseClient();

  console.log("Starting backfill of country_code for tracked_session...");

  try {
    // First, let's check how many sessions don't have country_code
    const countResult = await client.query({
      query: `
        SELECT count(*) as total
        FROM tracked_session
        WHERE country_code IS NULL OR country_code = ''
      `,
      format: "JSONEachRow",
    });

    const countData = (await countResult.json()) as Array<{ total: string }>;
    const totalToUpdate = Number(countData[0]?.total || 0);

    console.log(`Found ${totalToUpdate} sessions without country_code`);

    if (totalToUpdate === 0) {
      console.log(
        "✓ All sessions already have country_code, nothing to backfill",
      );
      await client.close();
      return;
    }

    // Create a mapping of session_id -> country_code from page_view_events
    console.log("Building session -> country_code mapping...");

    const mappingResult = await client.query({
      query: `
        SELECT 
          session_id,
          any(country_code) as country_code
        FROM (
          SELECT session_id, country_code
          FROM page_view_event
          WHERE session_id IS NOT NULL
            AND country_code IS NOT NULL
            AND country_code != ''
        )
        GROUP BY session_id
      `,
      format: "JSONEachRow",
    });

    const mappingData = (await mappingResult.json()) as Array<{
      session_id: string;
      country_code: string;
    }>;

    console.log(
      `Found ${mappingData.length} sessions with country codes in pageviews`,
    );

    if (mappingData.length === 0) {
      console.log("No pageview data with country codes found");
      await client.close();
      return;
    }

    // Update in batches to avoid memory issues
    const batchSize = 1000;
    let updated = 0;

    for (let i = 0; i < mappingData.length; i += batchSize) {
      const batch = mappingData.slice(i, i + batchSize);

      // Build parameterized query to prevent SQL injection
      const sessionIdParams = batch.reduce(
        (acc, item, idx) => {
          acc[`session_id_${idx}`] = item.session_id;
          acc[`country_code_${idx}`] = item.country_code;
          return acc;
        },
        {} as Record<string, string>,
      );

      const caseStatements = batch
        .map(
          (_, idx) =>
            `WHEN {session_id_${idx}:String} THEN {country_code_${idx}:String}`,
        )
        .join("\n          ");

      const sessionIdList = batch
        .map((_, idx) => `{session_id_${idx}:String}`)
        .join(", ");

      await client.exec({
        query: `
          ALTER TABLE tracked_session
          UPDATE country_code = CASE session_id
            ${caseStatements}
          END
          WHERE session_id IN (${sessionIdList})
            AND (country_code IS NULL OR country_code = '')
        `,
        query_params: sessionIdParams,
      });

      updated += batch.length;
      console.log(
        `  Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mappingData.length / batchSize)} (${updated}/${mappingData.length})`,
      );
    }

    console.log("Waiting for updates to complete...");
    // Wait a bit for the mutations to propagate
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check how many were updated
    const updatedResult = await client.query({
      query: `
        SELECT count(*) as updated
        FROM tracked_session
        WHERE country_code IS NOT NULL AND country_code != ''
      `,
      format: "JSONEachRow",
    });

    const updatedData = (await updatedResult.json()) as Array<{
      updated: string;
    }>;
    const totalUpdated = Number(updatedData[0]?.updated || 0);

    console.log(`✓ Successfully backfilled country_code for sessions`);
    console.log(`  Total sessions with country_code: ${totalUpdated}`);

    // Check remaining without country_code
    const remainingResult = await client.query({
      query: `
        SELECT count(*) as remaining
        FROM tracked_session
        WHERE country_code IS NULL OR country_code = ''
      `,
      format: "JSONEachRow",
    });

    const remainingData = (await remainingResult.json()) as Array<{
      remaining: string;
    }>;
    const remaining = Number(remainingData[0]?.remaining || 0);

    if (remaining > 0) {
      console.log(
        `  Note: ${remaining} sessions still without country_code (likely no matching pageview data)`,
      );
    }

    await client.close();
  } catch (error) {
    console.error("Error backfilling country codes:", error);
    await client.close();
    throw error;
  }
}

backfillSessionCountryCodes().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
