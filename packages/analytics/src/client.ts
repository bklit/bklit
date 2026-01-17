import { type ClickHouseClient, createClient } from "@clickhouse/client";
import { analyticsEnv } from "../env";

let clickhouseClient: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!clickhouseClient) {
    const env = analyticsEnv();

    console.log("[ClickHouse Client] Initializing with:", {
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_USERNAME,
      database: "analytics",
      NODE_ENV: process.env.NODE_ENV,
    });

    clickhouseClient = createClient({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_USERNAME,
      password: env.CLICKHOUSE_PASSWORD,
      database: "analytics",
      request_timeout: 30_000,
      clickhouse_settings: {
        date_time_input_format: "best_effort",
      },
    });
  }
  return clickhouseClient;
}
