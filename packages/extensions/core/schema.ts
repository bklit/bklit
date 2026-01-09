import type { z } from "zod";

export interface ExtensionMetadata {
  name: string;
  displayName: string;
  description: string;
  author: string;
  version: string;
  icon: string;
  category: "notifications" | "analytics" | "marketing" | "other";
  isPro: boolean;
  rateLimit?: {
    eventsPerHour: number;
  };
}

export interface Extension<TConfig = unknown> {
  id: string;
  metadata: ExtensionMetadata;
  configSchema: z.ZodSchema<TConfig>;
  handler: ExtensionHandler<TConfig>;
}

export type ExtensionHandler<TConfig = unknown> = (
  config: TConfig,
  event: EventData
) => Promise<void>;

export interface EventData {
  trackingId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  projectId: string;
  sessionId?: string;
}

export interface EventPayload {
  projectId: string;
  eventDefinitionId: string;
  eventData: EventData;
}
