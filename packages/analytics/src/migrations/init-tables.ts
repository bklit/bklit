import { getClickHouseClient } from "../client";

async function initTables() {
  const client = getClickHouseClient();

  console.log("Creating ClickHouse tables...");

  await client.exec({
    query: `
      CREATE TABLE IF NOT EXISTS page_view_event
      (
        id String,
        url String,
        timestamp DateTime,
        created_at DateTime DEFAULT now(),
        city Nullable(String),
        country Nullable(String),
        country_code Nullable(String),
        ip Nullable(String),
        isp Nullable(String),
        lat Nullable(Float64),
        lon Nullable(Float64),
        mobile Nullable(Bool),
        region Nullable(String),
        region_name Nullable(String),
        timezone Nullable(String),
        zip Nullable(String),
        user_agent Nullable(String),
        session_id Nullable(String),
        project_id String,
        referrer Nullable(String),
        utm_campaign Nullable(String),
        utm_content Nullable(String),
        utm_medium Nullable(String),
        utm_source Nullable(String),
        utm_term Nullable(String)
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (project_id, timestamp, id)
      SETTINGS index_granularity = 8192
    `,
  });

  console.log("✓ Created page_view_event table");

  await client.exec({
    query: `
      CREATE TABLE IF NOT EXISTS tracked_event
      (
        id String,
        timestamp DateTime,
        metadata Nullable(String),
        created_at DateTime DEFAULT now(),
        event_definition_id String,
        project_id String,
        session_id Nullable(String)
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (project_id, event_definition_id, timestamp, id)
      SETTINGS index_granularity = 8192
    `,
  });

  console.log("✓ Created tracked_event table");

  await client.exec({
    query: `
      CREATE TABLE IF NOT EXISTS tracked_session
      (
        id String,
        session_id String,
        started_at DateTime,
        ended_at Nullable(DateTime),
        duration Nullable(Int32),
        did_bounce Bool DEFAULT false,
        visitor_id Nullable(String),
        entry_page String,
        exit_page Nullable(String),
        user_agent Nullable(String),
        country Nullable(String),
        city Nullable(String),
        project_id String,
        updated_at DateTime DEFAULT now()
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(started_at)
      ORDER BY (project_id, started_at, session_id)
      SETTINGS index_granularity = 8192
    `,
  });

  console.log("✓ Created tracked_session table");

  // Add updated_at column to existing table if it doesn't exist (for tables created before migration)
  try {
    await client.exec({
      query: `
        ALTER TABLE tracked_session
        ADD COLUMN IF NOT EXISTS updated_at DateTime DEFAULT now()
      `,
    });
    console.log("✓ Ensured updated_at column exists in tracked_session table");
  } catch (error) {
    // Column might already exist or table might not exist yet, ignore error
    if (process.env.NODE_ENV === "development") {
      console.log("Note: updated_at column migration skipped (may already exist)");
    }
  }

  console.log("All tables created successfully!");
}

initTables().catch((error) => {
  console.error("Error creating tables:", error);
  process.exit(1);
});
