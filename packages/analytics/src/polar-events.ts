import { authEnv } from "@bklit/auth/env";
import { Polar } from "@polar-sh/sdk";

const env = authEnv();

// Initialize Polar client
const polar = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_SERVER_MODE,
});

export interface PolarEventData {
  organizationId: string;
  polarCustomerId?: string | null;
  eventType: "pageview" | "custom_event";
  metadata?: Record<string, unknown>;
}

/**
 * Send an event to Polar for usage-based billing
 * Only sends events for organizations with Polar customers (paid tiers)
 */
export async function sendEventToPolar(data: PolarEventData): Promise<void> {
  try {
    // Skip if no Polar customer ID (free tier users)
    if (!data.polarCustomerId) {
      console.log(
        `⏭️  Skipping Polar event for org ${data.organizationId} (no Polar customer)`,
      );
      return;
    }

    // Send event to Polar
    await polar.events.create({
      name: data.eventType,
      externalCustomerId: data.organizationId,
      metadata: data.metadata || {},
    });

    console.log(
      `✅ Polar: Event sent for org ${data.organizationId} (${data.eventType})`,
    );
  } catch (error) {
    // Log error but don't throw - don't fail event tracking if Polar is down
    console.error("❌ Polar: Error sending event:", error);
    console.error("Event data:", {
      organizationId: data.organizationId,
      eventType: data.eventType,
    });
  }
}

/**
 * Batch send multiple events to Polar
 * Useful for backfilling or bulk operations
 */
export async function sendEventsToPolarBatch(
  events: PolarEventData[],
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  for (const event of events) {
    try {
      await sendEventToPolar(event);
      succeeded++;
    } catch {
      failed++;
    }
  }

  return { succeeded, failed };
}

/**
 * Get the Polar meter ID for events
 */
export function getPolarMeterIdEvents(): string | undefined {
  return env.POLAR_METER_ID_EVENTS;
}
