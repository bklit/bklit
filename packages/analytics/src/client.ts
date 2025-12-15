import { type ClickHouseClient, createClient } from "@clickhouse/client";
import { analyticsEnv } from "../env";

// Override ClickHouse env vars with DEV_* variants in development
if (process.env.NODE_ENV === "development") {
  if (process.env.DEV_CLICKHOUSE_HOST) {
    process.env.CLICKHOUSE_HOST = process.env.DEV_CLICKHOUSE_HOST;
  }
  if (process.env.DEV_CLICKHOUSE_USERNAME) {
    process.env.CLICKHOUSE_USERNAME = process.env.DEV_CLICKHOUSE_USERNAME;
  }
  if (process.env.DEV_CLICKHOUSE_PASSWORD) {
    process.env.CLICKHOUSE_PASSWORD = process.env.DEV_CLICKHOUSE_PASSWORD;
  }
}

let clickhouseClient: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!clickhouseClient) {
    const env = analyticsEnv();
    clickhouseClient = createClient({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_USERNAME,
      password: env.CLICKHOUSE_PASSWORD,
    });
  }
  return clickhouseClient;
}
