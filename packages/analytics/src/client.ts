import { type ClickHouseClient, createClient } from "@clickhouse/client";
import { analyticsEnv } from "../env";

let clickhouseClient: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!clickhouseClient) {
    const env = analyticsEnv();
    clickhouseClient = createClient({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_USERNAME,
      password: env.CLICKHOUSE_PASSWORD,
      database: "default",
      request_timeout: 30000,
    });
  }
  return clickhouseClient;
}
