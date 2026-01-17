export interface LiveEventBase {
  projectId: string;
  timestamp: string;
}

export interface PageviewEvent extends LiveEventBase {
  type: "pageview";
  data: {
    url: string;
    country?: string;
    countryCode?: string;
    city?: string;
    sessionId?: string;
    mobile?: boolean;
    title?: string;
    lat?: number;
    lon?: number;
    userAgent?: string;
    isNewSession?: boolean; // Track if this is the first pageview of a new session
  };
}

export interface TrackedEvent extends LiveEventBase {
  type: "event";
  data: {
    trackingId: string;
    eventType: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface SessionEndEvent extends LiveEventBase {
  type: "session_end";
  data: {
    sessionId: string;
    countryCode?: string;
    reason?: "timeout" | "closed" | "manual";
  };
}

export type LiveEvent = PageviewEvent | TrackedEvent | SessionEndEvent;

export const LIVE_EVENTS_CHANNEL = "live-events";
