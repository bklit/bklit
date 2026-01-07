export interface PageViewData {
  id: string;
  url: string;
  timestamp: Date;
  createdAt?: Date;
  city?: string | null;
  country?: string | null;
  countryCode?: string | null;
  ip?: string | null;
  isp?: string | null;
  lat?: number | null;
  lon?: number | null;
  mobile?: boolean | null;
  region?: string | null;
  regionName?: string | null;
  timezone?: string | null;
  zip?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  projectId: string;
  referrer?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmMedium?: string | null;
  utmSource?: string | null;
  utmTerm?: string | null;
}

export interface TrackedEventData {
  id: string;
  timestamp: Date;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  eventDefinitionId: string;
  projectId: string;
  sessionId?: string | null;
}

export interface TrackedSessionData {
  id: string;
  sessionId: string;
  startedAt: Date;
  endedAt?: Date | null;
  duration?: number | null;
  didBounce?: boolean;
  visitorId?: string | null;
  entryPage: string;
  exitPage?: string | null;
  userAgent?: string | null;
  country?: string | null;
  countryCode?: string | null;
  city?: string | null;
  projectId: string;
}

export interface PageViewQuery {
  projectId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface StatsQuery {
  projectId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface SessionQuery {
  projectId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface EventQuery {
  projectId: string;
  eventDefinitionId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface LiveUserLocation {
  id: string;
  sessionId: string;
  startedAt: Date;
  userAgent: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  pageviewCountry: string | null;
  pageviewCountryCode: string | null;
  lat: number | null;
  lon: number | null;
}

export interface SessionJourney {
  sessionId: string;
  entryPage: string;
  exitPage: string | null;
}

export interface FunnelSessionData {
  id: string;
  sessionId: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number | null;
  didBounce: boolean;
  visitorId: string | null;
  entryPage: string;
  exitPage: string | null;
  userAgent: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  projectId: string;
  pageViewEvents: Array<{
    id: string;
    url: string;
    timestamp: Date;
  }>;
  trackedEvents: Array<{
    id: string;
    timestamp: Date;
    metadata: Record<string, unknown> | null;
    eventDefinitionId: string;
  }>;
}

export interface EventWithSession {
  id: string;
  timestamp: Date;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  eventDefinitionId: string;
  projectId: string;
  sessionId: string | null;
}
