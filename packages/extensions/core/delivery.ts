import { prisma } from "@bklit/db/client";
import type { EventPayload } from "./schema";
import { checkRateLimit, incrementRateLimit, updateExtensionStats } from "./rate-limiter";
import { extensionRegistry } from "./registry";

export async function deliverToExtensions(event: EventPayload): Promise<void> {
  try {
    // Find all ProjectExtensions subscribed to this event
    const extensions = await prisma.projectExtension.findMany({
      where: {
        projectId: event.projectId,
        enabled: true,
        eventDefinitions: {
          some: { eventDefinitionId: event.eventDefinitionId },
        },
      },
      include: {
        eventDefinitions: true,
      },
    });

    // Deliver to each extension (fire-and-forget)
    for (const ext of extensions) {
      try {
        // Check rate limit
        const withinLimit = await checkRateLimit(ext.extensionId);
        if (!withinLimit) {
          console.log(
            `⏭️  Extension ${ext.extensionId} rate limit exceeded, skipping`,
          );
          continue;
        }

        // Get handler
        const handler = extensionRegistry.getHandler(ext.extensionId);
        
        // Validate config
        const config = extensionRegistry.validateConfig(ext.extensionId, ext.config);
        
        // Execute handler
        await handler(config, event.eventData);

        console.log(
          `✅ Extension ${ext.extensionId} delivered event ${event.eventData.trackingId}`,
        );

        // Update stats
        await Promise.all([
          incrementRateLimit(ext.extensionId),
          updateExtensionStats(ext.id),
        ]);
      } catch (err) {
        console.error(`❌ Extension ${ext.extensionId} failed:`, err);
        // Don't throw - continue to other extensions
      }
    }
  } catch (err) {
    console.error("❌ Extension delivery failed:", err);
    throw err;
  }
}

