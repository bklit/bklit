import { config } from "dotenv";
import {
  popFromQueue,
  getQueueDepth,
  publishDebugLog,
  publishLiveEvent,
  type QueuedEvent,
} from "@bklit/redis";
import { AnalyticsService } from "@bklit/analytics";
import { verifyEventInClickHouse } from "./verify";

config();

const POLL_INTERVAL_MS = 1000; // Poll every 1 second
const BATCH_SIZE = 100; // Process up to 100 events per batch

let isProcessing = false;
let totalProcessed = 0;
let totalErrors = 0;

async function processBatch() {
  if (isProcessing) {
    return; // Skip if already processing
  }

  isProcessing = true;

  try {
    const queueDepth = await getQueueDepth();
    
    if (queueDepth === 0) {
      isProcessing = false;
      return;
    }

    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "worker",
      level: "info",
      message: "Starting batch processing",
      data: { queueDepth, batchSize: BATCH_SIZE },
    });

    const events = await popFromQueue(BATCH_SIZE);

    if (events.length === 0) {
      isProcessing = false;
      return;
    }

    const startTime = Date.now();
    const analytics = new AnalyticsService();

    // Process each event
    for (const event of events) {
      try {
        // Get actual event details for better logging
        const eventDetails = event.type === "event" 
          ? { trackingId: event.payload.trackingId, eventType: event.payload.eventType }
          : { url: event.payload.url };
        
        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "worker",
          level: "info",
          message: `Processing ${event.type} from queue`,
          data: { queueType: event.type, ...eventDetails },
          eventId: event.id,
          projectId: event.projectId,
        });

        // Insert into ClickHouse (using existing AnalyticsService)
        const clickhouseStartTime = Date.now();
        
        try {
          if (event.type === "pageview") {
            await analytics.createPageView({
              id: event.id,
              ...event.payload,
              timestamp: new Date(event.payload.timestamp as string),
            } as any);
          } else if (event.type === "event") {
            await analytics.createTrackedEvent({
              id: event.id,
              timestamp: new Date(event.payload.timestamp as string),
              projectId: event.projectId,
              trackingId: event.payload.trackingId as string,
              eventType: event.payload.eventType as string,
              sessionId: event.payload.sessionId as string | null,
              metadata: event.payload.metadata as Record<string, unknown> | null,
            } as any);
          }
        } catch (chError) {
          await publishDebugLog({
            timestamp: new Date().toISOString(),
            stage: "clickhouse",
            level: "error",
            message: "ClickHouse insert failed",
            data: {
              error: chError instanceof Error ? chError.message : String(chError),
              eventType: event.type,
              eventId: event.id,
            },
            eventId: event.id,
            projectId: event.projectId,
          });
          throw chError; // Re-throw to be caught by outer catch
        }

        const clickhouseDuration = Date.now() - clickhouseStartTime;

        // Get table name for clarity
        const tableName = event.type === "pageview" ? "page_view_event" : "tracked_event";
        const savedDetails = event.type === "event" 
          ? { trackingId: event.payload.trackingId, eventType: event.payload.eventType, table: tableName }
          : { url: event.payload.url, table: tableName };
        
        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "clickhouse",
          level: "info",
          message: `Saved to ClickHouse (${tableName})`,
          data: { ...savedDetails },
          eventId: event.id,
          projectId: event.projectId,
          duration: clickhouseDuration,
        });

        // Publish to live-events for WebSocket
        await publishLiveEvent({
          projectId: event.projectId,
          type: event.type,
          timestamp: new Date().toISOString(),
          data: event.payload,
        });

        const pubsubDetails = event.type === "event" 
          ? { trackingId: event.payload.trackingId, eventType: event.payload.eventType }
          : { url: event.payload.url };
        
        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "pubsub",
          level: "info",
          message: "Event published to live-events",
          data: { queueType: event.type, ...pubsubDetails },
          eventId: event.id,
          projectId: event.projectId,
        });

        // Verify event exists in ClickHouse (dual-write verification)
        const verification = await verifyEventInClickHouse(event.id, event.projectId);
        
        if (!verification.match) {
          await publishDebugLog({
            timestamp: new Date().toISOString(),
            stage: "worker",
            level: "error",
            message: "VERIFICATION FAILED - Event mismatch detected",
            data: {
              verification,
              discrepancies: verification.discrepancies || [],
            },
            eventId: event.id,
            projectId: event.projectId,
          });
        }

        totalProcessed++;
      } catch (error) {
        totalErrors++;
        
        await publishDebugLog({
          timestamp: new Date().toISOString(),
          stage: "worker",
          level: "error",
          message: "Failed to process event",
          data: {
            error: error instanceof Error ? error.message : String(error),
            eventId: event.id,
          },
          eventId: event.id,
          projectId: event.projectId,
        });

        console.error("Error processing event:", error);
      }
    }

    const duration = Date.now() - startTime;
    const avgDuration = duration / events.length;

    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "worker",
      level: "info",
      message: "Batch processing completed",
      data: {
        processed: events.length,
        duration,
        avgDuration,
        totalProcessed,
        totalErrors,
        remainingInQueue: await getQueueDepth(),
      },
    });

    console.log(`✅ Processed ${events.length} events in ${duration}ms (avg: ${avgDuration.toFixed(2)}ms/event)`);
  } catch (error) {
    await publishDebugLog({
      timestamp: new Date().toISOString(),
      stage: "worker",
      level: "error",
      message: "Batch processing error",
      data: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    console.error("Batch processing error:", error);
  } finally {
    isProcessing = false;
  }
}

// Start polling loop
setInterval(processBatch, POLL_INTERVAL_MS);

console.log(`🔄 Background worker started (polling every ${POLL_INTERVAL_MS}ms, batch size: ${BATCH_SIZE})`);
console.log(`📊 Stats will be logged to debug-logs channel`);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[SHUTDOWN] SIGTERM received");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[SHUTDOWN] SIGINT received");
  process.exit(0);
});

