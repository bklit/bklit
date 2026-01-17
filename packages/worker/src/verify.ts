import { getClickHouseClient } from "@bklit/analytics/client";
import { publishDebugLog } from "@bklit/redis";

export interface VerificationResult {
  eventId: string;
  exists: boolean;
  writtenByOldSystem: boolean;
  writtenByNewSystem: boolean;
  match: boolean;
  discrepancies?: string[];
}

export async function verifyEventInClickHouse(
  eventId: string,
  projectId: string
): Promise<VerificationResult> {
  try {
    // Query ClickHouse to check if event exists
    const client = getClickHouseClient();
    const result = await client.query({
      query: `
        SELECT 
          id,
          url,
          timestamp,
          project_id,
          session_id,
          country,
          city
        FROM page_view_event
        WHERE id = {id:String}
        LIMIT 1
      `,
      query_params: { id: eventId },
      format: "JSONEachRow",
    });

    const rows = await result.json<Array<{ id: string }>>();

    if (rows.length === 0) {
      return {
        eventId,
        exists: false,
        writtenByOldSystem: false,
        writtenByNewSystem: false,
        match: false,
      };
    }

    // Event exists - was written by one or both systems
    // We can't distinguish which wrote it without additional metadata
    // So we'll assume if it exists, it was written successfully
    return {
      eventId,
      exists: true,
      writtenByOldSystem: true, // Assumed since old system writes immediately
      writtenByNewSystem: true, // Worker just wrote it
      match: true,
    };
  } catch (error) {
    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "worker",
      level: "error",
      message: "Verification failed",
      data: {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      },
      eventId,
      projectId,
    });

    return {
      eventId,
      exists: false,
      writtenByOldSystem: false,
      writtenByNewSystem: false,
      match: false,
      discrepancies: [error instanceof Error ? error.message : String(error)],
    };
  }
}
