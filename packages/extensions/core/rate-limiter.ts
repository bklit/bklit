import { prisma } from "@bklit/db/client";
import { extensionRegistry } from "./registry";

const DEFAULT_RATE_LIMIT = 1000; // events per hour

export async function checkRateLimit(extensionId: string): Promise<boolean> {
  const extension = extensionRegistry.get(extensionId);
  const limit = extension?.metadata.rateLimit?.eventsPerHour ?? DEFAULT_RATE_LIMIT;

  const currentHour = new Date();
  currentHour.setMinutes(0, 0, 0);

  const rateLimit = await prisma.extensionRateLimit.findUnique({
    where: {
      extensionId_hourTimestamp: {
        extensionId,
        hourTimestamp: currentHour,
      },
    },
  });

  if (!rateLimit) {
    return true; // No record yet, within limit
  }

  return rateLimit.eventCount < limit;
}

export async function incrementRateLimit(extensionId: string): Promise<void> {
  const currentHour = new Date();
  currentHour.setMinutes(0, 0, 0);

  await prisma.extensionRateLimit.upsert({
    where: {
      extensionId_hourTimestamp: {
        extensionId,
        hourTimestamp: currentHour,
      },
    },
    update: {
      eventCount: {
        increment: 1,
      },
    },
    create: {
      extensionId,
      hourTimestamp: currentHour,
      eventCount: 1,
    },
  });
}

export async function resetDailyStats(projectExtensionId: string): Promise<void> {
  await prisma.projectExtension.update({
    where: { id: projectExtensionId },
    data: { eventsSentToday: 0 },
  });
}

export async function updateExtensionStats(projectExtensionId: string): Promise<void> {
  await prisma.projectExtension.update({
    where: { id: projectExtensionId },
    data: {
      lastTriggeredAt: new Date(),
      eventsSentToday: {
        increment: 1,
      },
    },
  });
}

