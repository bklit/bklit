import type { Prisma } from "@bklit/db/client";

export interface EventListItem {
  id: string;
  name: string;
  description: string | null;
  trackingId: string;
  createdAt: Date;
  updatedAt: Date;
  totalCount: number;
  eventTypeCounts: Record<string, number>;
  recentEvents: Array<{
    id: string;
    timestamp: Date;
    metadata: Prisma.JsonValue | null;
    sessionId: string | null;
  }>;
}

