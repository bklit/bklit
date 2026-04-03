import type { AnalyticsService } from "@bklit/analytics";
import { prisma } from "@bklit/db/client";
import { publishDebugLog, type QueuedEvent } from "@bklit/redis";
import { verifyEventInClickHouse } from "./verify";

export interface ProcessorState {
  eventDefinitionCache: Map<string, string>;
  seenSessions: Set<string>;
}

export function createProcessorState(): ProcessorState {
  return {
    eventDefinitionCache: new Map(),
    seenSessions: new Set(),
  };
}

export interface ProcessQueuedEventsOptions {
  /** Skip post-insert verification (faster for large backfills). */
  skipVerification?: boolean;
  /** Skip Redis debug-logs publish (much faster for drain-queue backfills). */
  quiet?: boolean;
}

/**
 * Same persistence logic as the long-running worker loop (pageviews + tracked events).
 */
// biome-ignore lint: parity with long-running worker (pageview + event branches)
export async function processQueuedEvents(
  events: QueuedEvent[],
  analytics: AnalyticsService,
  state: ProcessorState,
  options: ProcessQueuedEventsOptions = {}
): Promise<{ processed: number; errors: number }> {
  const { skipVerification = false, quiet = false } = options;
  const logDebug: typeof publishDebugLog = quiet
    ? async () => {
        /* skip: drain backfill */
      }
    : publishDebugLog;
  let processed = 0;
  let errors = 0;

  for (const event of events) {
    try {
      const eventDetails =
        event.type === "event"
          ? {
              trackingId: event.payload.trackingId,
              eventType: event.payload.eventType,
            }
          : { url: event.payload.url };

      await logDebug({
        timestamp: new Date().toISOString(),
        stage: "worker",
        level: "info",
        message: `Processing ${event.type} from queue`,
        data: { queueType: event.type, ...eventDetails },
        eventId: event.id,
        projectId: event.projectId,
      });

      const sessionId = event.payload.sessionId as string | undefined;
      const isNewSession = sessionId
        ? !state.seenSessions.has(sessionId)
        : false;

      const clickhouseStartTime = Date.now();

      try {
        if (event.type === "pageview") {
          await analytics.createPageView({
            id: event.id,
            ...event.payload,
            timestamp: new Date(event.payload.timestamp as string),
            // biome-ignore lint/suspicious/noExplicitAny: queue JSON payload
          } as any);

          if (sessionId) {
            if (isNewSession) {
              const exists = await analytics.sessionExists(
                sessionId,
                event.projectId
              );

              if (!exists) {
                const sessionDbId = `sess_${Date.now()}_${Math.random().toString(36).slice(7)}`;
                await analytics.createTrackedSession({
                  id: sessionDbId,
                  sessionId,
                  startedAt: new Date(event.payload.timestamp as string),
                  endedAt: null,
                  duration: null,
                  didBounce: true,
                  visitorId: null,
                  entryPage: event.payload.url as string,
                  exitPage: event.payload.url as string,
                  userAgent: event.payload.userAgent as string | null,
                  country: event.payload.country as string | null,
                  countryCode: event.payload.countryCode as string | null,
                  city: event.payload.city as string | null,
                  projectId: event.projectId,
                  // biome-ignore lint/suspicious/noExplicitAny: queue JSON payload
                } as any);

                state.seenSessions.add(sessionId);
              }
            } else {
              await analytics.updateTrackedSession(sessionId, {
                exitPage: event.payload.url as string,
              });
            }
          }
        } else if (event.type === "event") {
          const trackingId = event.payload.trackingId as string;
          const cacheKey = `${trackingId}:${event.projectId}`;

          let eventDefinitionId = state.eventDefinitionCache.get(cacheKey);

          if (!eventDefinitionId) {
            const eventDef = await prisma.eventDefinition.findUnique({
              where: {
                projectId_trackingId: {
                  projectId: event.projectId,
                  trackingId,
                },
              },
              select: { id: true },
            });

            if (eventDef) {
              eventDefinitionId = eventDef.id;
              state.eventDefinitionCache.set(cacheKey, eventDefinitionId);
            } else {
              await logDebug({
                timestamp: new Date().toISOString(),
                stage: "worker",
                level: "warn",
                message: "EventDefinition not found - skipping event",
                data: { trackingId, projectId: event.projectId },
                eventId: event.id,
                projectId: event.projectId,
              });
              continue;
            }
          }

          const enrichedMetadata = {
            ...((event.payload.metadata as Record<string, unknown>) || {}),
            eventType: event.payload.eventType,
          };

          await analytics.createTrackedEvent({
            id: event.id,
            timestamp: new Date(event.payload.timestamp as string),
            projectId: event.projectId,
            eventDefinitionId,
            sessionId: event.payload.sessionId as string | null,
            metadata: enrichedMetadata,
            // biome-ignore lint/suspicious/noExplicitAny: queue JSON payload
          } as any);
        }
      } catch (chError) {
        await logDebug({
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
        throw chError;
      }

      const clickhouseDuration = Date.now() - clickhouseStartTime;

      const tableName =
        event.type === "pageview" ? "page_view_event" : "tracked_event";
      const savedDetails =
        event.type === "event"
          ? {
              trackingId: event.payload.trackingId,
              eventType: event.payload.eventType,
              table: tableName,
            }
          : { url: event.payload.url, table: tableName };

      await logDebug({
        timestamp: new Date().toISOString(),
        stage: "clickhouse",
        level: "info",
        message: `Saved to ClickHouse (${tableName})`,
        data: { ...savedDetails },
        eventId: event.id,
        projectId: event.projectId,
        duration: clickhouseDuration,
      });

      if (!skipVerification) {
        const verification = await verifyEventInClickHouse(
          event.id,
          event.projectId
        );

        if (!verification.match) {
          await logDebug({
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
      }

      processed++;
    } catch (error) {
      errors++;

      await logDebug({
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

  return { processed, errors };
}
