import { getClickHouseClient } from "./client";
import { ANALYTICS_UNLIMITED_QUERY_LIMIT } from "./constants";
import type {
  EventQuery,
  PageViewData,
  PageViewQuery,
  SessionQuery,
  StatsQuery,
  TrackedEventData,
  TrackedSessionData,
} from "./types";

// Helper to parse ClickHouse DateTime strings as UTC
function parseClickHouseDate(dateString: string): Date {
  return new Date(`${dateString}Z`);
}

function formatDateForClickHouse(date: Date): string {
  return date.toISOString().replace("T", " ").replace("Z", "").slice(0, 19);
}

// Helper to format Date for insert (Unix timestamp)
function formatDateForInsert(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export class AnalyticsService {
  private readonly client = getClickHouseClient();

  async createPageView(data: PageViewData): Promise<void> {
    try {
      await this.client.insert({
        table: "page_view_event", // Client already has database: "analytics" set
        values: [
          {
            id: data.id,
            url: data.url,
            timestamp: formatDateForInsert(data.timestamp),
            created_at: formatDateForInsert(data.createdAt || new Date()),
            city: data.city,
            country: data.country,
            country_code: data.countryCode,
            ip: data.ip,
            isp: data.isp,
            lat: data.lat,
            lon: data.lon,
            mobile: data.mobile,
            region: data.region,
            region_name: data.regionName,
            timezone: data.timezone,
            zip: data.zip,
            user_agent: data.userAgent,
            session_id: data.sessionId,
            project_id: data.projectId,
            referrer: data.referrer,
            utm_campaign: data.utmCampaign,
            utm_content: data.utmContent,
            utm_medium: data.utmMedium,
            utm_source: data.utmSource,
            utm_term: data.utmTerm,
            // Page metadata
            title: data.title,
            description: data.description,
            og_image: data.ogImage,
            og_title: data.ogTitle,
            favicon: data.favicon,
            canonical_url: data.canonicalUrl,
            language: data.language,
            robots: data.robots,
            // Enhanced campaign tracking
            referrer_hostname: data.referrerHostname,
            referrer_path: data.referrerPath,
            referrer_type: data.referrerType,
            utm_id: data.utmId,
            gclid: data.gclid,
            fbclid: data.fbclid,
            msclkid: data.msclkid,
            ttclid: data.ttclid,
            li_fat_id: data.liFatId,
            twclid: data.twclid,
            // Session tracking
            is_new_visitor: data.isNewVisitor ?? false,
            landing_page: data.landingPage,
          },
        ],
        format: "JSONEachRow",
      });
    } catch (error) {
      console.error("❌ ClickHouse: Error inserting page view:", error);
      console.error("Page view data:", {
        id: data.id,
        url: data.url,
        projectId: data.projectId,
        sessionId: data.sessionId,
      });
      throw error;
    }
  }

  async createTrackedEvent(data: TrackedEventData): Promise<void> {
    try {
      console.log("[ClickHouse] Inserting tracked_event:", {
        id: data.id,
        eventDefinitionId: data.eventDefinitionId,
        projectId: data.projectId,
      });

      const result = await this.client.insert({
        table: "tracked_event", // Client already has database: "analytics" set
        values: [
          {
            id: data.id,
            timestamp: formatDateForInsert(data.timestamp),
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            created_at: formatDateForInsert(data.createdAt || new Date()),
            event_definition_id: data.eventDefinitionId,
            project_id: data.projectId,
            session_id: data.sessionId,
          },
        ],
        format: "JSONEachRow",
      });

      console.log("[ClickHouse] Insert completed:", result);
    } catch (error) {
      console.error("[ClickHouse] Insert FAILED:", error);
      throw error;
    }
  }

  async sessionExists(sessionId: string, projectId: string): Promise<boolean> {
    const result = await this.client.query({
      query: `
        SELECT count() as count
        FROM (
          SELECT session_id
          FROM tracked_session
          WHERE session_id = {sessionId:String}
            AND project_id = {projectId:String}
          LIMIT 1
        )
      `,
      query_params: { sessionId, projectId },
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{ count: number }>;
    return (rows[0]?.count || 0) > 0;
  }

  async createTrackedSession(data: TrackedSessionData): Promise<void> {
    try {
      await this.client.insert({
        table: "tracked_session",
        values: [
          {
            id: data.id,
            session_id: data.sessionId,
            started_at: formatDateForInsert(data.startedAt),
            ended_at: data.endedAt ? formatDateForInsert(data.endedAt) : null,
            duration: data.duration,
            did_bounce: data.didBounce ?? false,
            visitor_id: data.visitorId,
            entry_page: data.entryPage,
            exit_page: data.exitPage,
            user_agent: data.userAgent,
            country: data.country,
            country_code: data.countryCode,
            city: data.city,
            project_id: data.projectId,
            updated_at: formatDateForInsert(new Date()), // Set updated_at to current time
          },
        ],
        format: "JSONEachRow",
      });
    } catch (error) {
      console.error("❌ ClickHouse: Error inserting session:", error);
      console.error("Session data:", {
        id: data.id,
        sessionId: data.sessionId,
        projectId: data.projectId,
      });
      throw error;
    }
  }

  async endSession(sessionId: string, projectId: string): Promise<void> {
    // Get the latest session state
    const existingSession = await this.client.query({
      query: `
        SELECT 
          id,
          session_id,
          started_at,
          ended_at,
          duration,
          did_bounce,
          visitor_id,
          entry_page,
          exit_page,
          user_agent,
          country,
          country_code,
          city,
          project_id
        FROM (
          SELECT 
            id,
            session_id,
            started_at,
            ended_at,
            duration,
            did_bounce,
            visitor_id,
            entry_page,
            exit_page,
            user_agent,
            country,
            country_code,
            city,
            project_id,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE session_id = {sessionId:String}
            AND project_id = {projectId:String}
        )
        WHERE rn = 1
      `,
      query_params: { sessionId, projectId },
      format: "JSONEachRow",
    });

    const sessions = (await existingSession.json()) as Array<{
      id: string;
      session_id: string;
      started_at: string;
      ended_at: string | null;
      duration: number | null;
      did_bounce: boolean;
      visitor_id: string | null;
      entry_page: string;
      exit_page: string | null;
      user_agent: string | null;
      country: string | null;
      country_code: string | null;
      city: string | null;
      project_id: string;
    }>;

    if (sessions.length === 0) {
      return;
    }

    const session = sessions[0];
    if (!session || session.ended_at) {
      return; // Already ended
    }

    // Calculate duration
    const startedAt = new Date(session.started_at);
    const endedAt = new Date();
    const duration = Math.floor(
      (endedAt.getTime() - startedAt.getTime()) / 1000
    );

    // Create new row with ended session
    await this.createTrackedSession({
      id: session.id,
      sessionId: session.session_id,
      startedAt,
      endedAt,
      duration,
      didBounce: session.did_bounce,
      visitorId: session.visitor_id,
      entryPage: session.entry_page,
      exitPage: session.exit_page,
      userAgent: session.user_agent,
      country: session.country,
      countryCode: session.country_code,
      city: session.city,
      projectId: session.project_id,
    });
  }

  async updateTrackedSession(
    sessionId: string,
    data: Partial<Pick<TrackedSessionData, "endedAt" | "duration" | "exitPage">>
  ): Promise<void> {
    // Use window function to get the latest state of the session
    // Much simpler than argMax
    const existingSession = await this.client.query({
      query: `
        SELECT 
          id,
          session_id,
          started_at,
          ended_at,
          duration,
          did_bounce,
          visitor_id,
          entry_page,
          exit_page,
          user_agent,
          country,
          country_code,
          city,
          project_id
        FROM (
          SELECT 
            id,
            session_id,
            started_at,
            ended_at,
            duration,
            did_bounce,
            visitor_id,
            entry_page,
            exit_page,
            user_agent,
            country,
            country_code,
            city,
            project_id,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE session_id = {sessionId:String}
        )
        WHERE rn = 1
      `,
      query_params: { sessionId },
      format: "JSONEachRow",
    });

    const sessions = (await existingSession.json()) as Array<{
      id: string;
      session_id: string;
      started_at: string;
      ended_at: string | null;
      duration: number | null;
      did_bounce: boolean;
      visitor_id: string | null;
      entry_page: string;
      exit_page: string | null;
      user_agent: string | null;
      country: string | null;
      country_code: string | null;
      city: string | null;
      project_id: string;
    }>;

    if (sessions.length === 0) {
      return;
    }

    const session = sessions[0];
    if (!session) {
      return;
    }

    await this.createTrackedSession({
      id: session.id,
      sessionId: session.session_id,
      startedAt: new Date(session.started_at),
      endedAt: data.endedAt
        ? data.endedAt
        : session.ended_at
          ? new Date(session.ended_at)
          : null,
      duration: data.duration !== undefined ? data.duration : session.duration,
      didBounce: session.did_bounce,
      visitorId: session.visitor_id,
      entryPage: session.entry_page,
      exitPage: data.exitPage !== undefined ? data.exitPage : session.exit_page,
      userAgent: session.user_agent,
      country: session.country,
      countryCode: session.country_code,
      city: session.city,
      projectId: session.project_id,
    });
  }

  async endTrackedSession(sessionId: string): Promise<void> {
    const now = new Date();
    await this.updateTrackedSession(sessionId, {
      endedAt: now,
    });
  }

  /**
   * Get session IDs that have ended (for Redis cleanup)
   */
  async getEndedSessions(sessionIds: string[]): Promise<string[]> {
    if (sessionIds.length === 0) return [];

    // Build query with proper ClickHouse tuple syntax
    const sessionList = sessionIds
      .map((id) => `'${id.replace(/'/g, "\\'")}'`)
      .join(",");
    const query = `
      SELECT session_id 
      FROM tracked_session 
      WHERE session_id IN (${sessionList})
      AND ended_at IS NOT NULL
    `;

    const result = await this.client.query({ query, format: "JSONEachRow" });
    const rows = await result.json<{ session_id: string }>();
    return rows.map((row) => row.session_id);
  }

  async getPageViews(query: PageViewQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || 100;
    const offset = query.offset || 0;

    const result = await this.client.query({
      query: `
        SELECT 
          id,
          url,
          title,
          timestamp,
          created_at,
          city,
          country,
          country_code,
          ip,
          mobile,
          user_agent,
          session_id,
          referrer,
          utm_source,
          utm_medium,
          utm_campaign
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
        ORDER BY timestamp DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `,
      query_params: { ...params, limit, offset },
      format: "JSONEachRow",
    });

    return (await result.json()) as Array<{
      id: string;
      url: string;
      timestamp: string;
      created_at: string;
      city: string | null;
      country: string | null;
      country_code: string | null;
      ip: string | null;
      mobile: boolean | null;
      user_agent: string | null;
      session_id: string | null;
      referrer: string | null;
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
    }>;
  }

  async getPageViewsBySessionIds(
    projectId: string,
    sessionIds: string[]
  ): Promise<
    Array<{
      id: string;
      url: string;
      timestamp: string;
      session_id: string | null;
      country?: string | null;
      country_code?: string | null;
      lat?: number | null;
      lon?: number | null;
      city?: string | null;
    }>
  > {
    if (sessionIds.length === 0) {
      return [];
    }

    // ClickHouse doesn't support array parameters directly, so we query all pageviews
    // for the project and filter by session_id in code (more reliable)
    const result = await this.client.query({
      query: `
        SELECT 
          id,
          url,
          timestamp,
          session_id,
          country,
          country_code,
          lat,
          lon,
          city
        FROM page_view_event
        WHERE project_id = {projectId:String}
          AND session_id != ''
        ORDER BY timestamp ASC
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    const allPageviews = (await result.json()) as Array<{
      id: string;
      url: string;
      timestamp: string;
      session_id: string | null;
      country?: string | null;
      country_code?: string | null;
      lat?: number | null;
      lon?: number | null;
      city?: string | null;
    }>;

    // Filter to only the session IDs we need
    const sessionIdSet = new Set(sessionIds);
    return allPageviews.filter(
      (pv) => pv.session_id && sessionIdSet.has(pv.session_id)
    );
  }

  async getStats(query: StatsQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT 
          uniq(id) as total_views,
          uniq(ip) as unique_visits,
          uniq(url) as unique_pages,
          uniqIf(id, mobile = true) as mobile_visits,
          uniqIf(id, mobile = false) as desktop_visits
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      total_views: number;
      unique_visits: number;
      unique_pages: number;
      mobile_visits: number;
      desktop_visits: number;
    }>;

    return (
      rows[0] || {
        total_views: 0,
        unique_visits: 0,
        unique_pages: 0,
        mobile_visits: 0,
        desktop_visits: 0,
      }
    );
  }

  async getTopCountries(query: StatsQuery & { limit?: number }) {
    const conditions: string[] = [
      "project_id = {projectId:String}",
      "country IS NOT NULL",
    ];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || 10;

    const result = await this.client.query({
      query: `
        SELECT 
          country,
          country_code,
          uniq(id) as visits,
          uniq(ip) as unique_visitors
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
        GROUP BY country, country_code
        ORDER BY visits DESC
        LIMIT {limit:UInt32}
      `,
      query_params: { ...params, limit },
      format: "JSONEachRow",
    });

    return (await result.json()) as Array<{
      country: string;
      country_code: string;
      visits: number;
      unique_visitors: number;
    }>;
  }

  async getSessions(query: SessionQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    // Filter by updated_at for date ranges to show recently active sessions
    // This ensures we get sessions that were active in the date range, not just started then
    if (query.startDate) {
      conditions.push("updated_at >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("updated_at <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || 100;
    const offset = query.offset || 0;

    // Simple approach: Use window function to get latest row per session_id
    // This is much simpler than argMax and avoids all the aggregate function issues
    const result = await this.client.query({
      query: `
        SELECT 
          id,
          session_id,
          started_at,
          updated_at,
          ended_at,
          duration,
          did_bounce,
          visitor_id,
          entry_page,
          exit_page,
          user_agent,
          country,
          country_code,
          city,
          project_id
        FROM (
          SELECT 
            id,
            session_id,
            started_at,
            updated_at,
            ended_at,
            duration,
            did_bounce,
            visitor_id,
            entry_page,
            exit_page,
            user_agent,
            country,
            country_code,
            city,
            project_id,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE ${conditions.join(" AND ")}
        )
        WHERE rn = 1
        ORDER BY updated_at DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `,
      query_params: { ...params, limit, offset },
      format: "JSONEachRow",
    });

    return (await result.json()) as Array<{
      id: string;
      session_id: string;
      started_at: string;
      updated_at: string;
      ended_at: string | null;
      duration: number | null;
      did_bounce: boolean;
      visitor_id: string | null;
      entry_page: string;
      exit_page: string | null;
      user_agent: string | null;
      country: string | null;
      country_code: string | null;
      city: string | null;
      project_id: string;
    }>;
  }

  async getSessionStats(query: StatsQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("started_at >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("started_at <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT 
          count() as total_sessions,
          countIf(did_bounce = true) as bounced_sessions,
          avg(duration) as avg_duration
        FROM tracked_session
        WHERE ${conditions.join(" AND ")}
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      total_sessions: number;
      bounced_sessions: number;
      avg_duration: number;
    }>;

    return (
      rows[0] || {
        total_sessions: 0,
        bounced_sessions: 0,
        avg_duration: 0,
      }
    );
  }

  async getTimeSeries(query: StatsQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("started_at >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("started_at <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT 
          toDate(started_at) as date,
          count() as total,
          countIf(did_bounce = false) as engaged,
          countIf(did_bounce = true) as bounced
        FROM tracked_session
        WHERE ${conditions.join(" AND ")}
        GROUP BY date
        ORDER BY date ASC
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    return (await result.json()) as Array<{
      date: string;
      total: number;
      engaged: number;
      bounced: number;
    }>;
  }

  async getLiveUsers(projectId: string): Promise<number> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Use window function to get the most recent session state for each session_id
    const result = await this.client.query({
      query: `
        SELECT count() as count
        FROM (
          SELECT 
            session_id,
            ended_at,
            updated_at,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE project_id = {projectId:String}
            AND updated_at >= {thirtyMinutesAgo:DateTime}
        )
        WHERE rn = 1
          AND ended_at IS NULL
      `,
      query_params: {
        projectId,
        thirtyMinutesAgo: formatDateForClickHouse(thirtyMinutesAgo),
      },
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{ count: number }>;
    return rows[0]?.count || 0;
  }

  async getTrackedEvents(query: EventQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.eventDefinitionId) {
      conditions.push("event_definition_id = {eventDefinitionId:String}");
      params.eventDefinitionId = query.eventDefinitionId;
    }
    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || 100;
    const offset = query.offset || 0;

    const result = await this.client.query({
      query: `
        SELECT 
          id,
          timestamp,
          metadata,
          created_at,
          event_definition_id,
          project_id,
          session_id
        FROM tracked_event
        WHERE ${conditions.join(" AND ")}
        ORDER BY timestamp DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `,
      query_params: { ...params, limit, offset },
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      id: string;
      timestamp: string;
      metadata: string | null;
      created_at: string;
      event_definition_id: string;
      project_id: string;
      session_id: string | null;
    }>;

    return rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  async getEventStats(query: EventQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.eventDefinitionId) {
      conditions.push("event_definition_id = {eventDefinitionId:String}");
      params.eventDefinitionId = query.eventDefinitionId;
    }
    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT 
          count() as total_events,
          uniq(session_id) as unique_sessions
        FROM tracked_event
        WHERE ${conditions.join(" AND ")}
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      total_events: number;
      unique_sessions: number;
    }>;

    return (
      rows[0] || {
        total_events: 0,
        unique_sessions: 0,
      }
    );
  }

  async countPageViews(
    projectId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId };

    if (startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(startDate);
    }
    if (endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT count() as count
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{ count: number }>;
    return rows[0]?.count || 0;
  }

  async countTrackedEvents(
    projectId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId };

    if (startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(startDate);
    }
    if (endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT count() as count
        FROM tracked_event
        WHERE ${conditions.join(" AND ")}
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{ count: number }>;
    return rows[0]?.count || 0;
  }

  async getEventsBySession(
    sessionId: string,
    projectId: string
  ): Promise<
    Array<{
      id: string;
      timestamp: string;
      metadata: Record<string, unknown> | null;
      created_at: string;
      event_definition_id: string;
      project_id: string;
      session_id: string | null;
    }>
  > {
    const result = await this.client.query({
      query: `
        SELECT 
          id,
          timestamp,
          metadata,
          created_at,
          event_definition_id,
          project_id,
          session_id
        FROM tracked_event
        WHERE project_id = {projectId:String}
          AND session_id = {sessionId:String}
        ORDER BY timestamp ASC
      `,
      query_params: { projectId, sessionId },
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      id: string;
      timestamp: string;
      metadata: string | null;
      created_at: string;
      event_definition_id: string;
      project_id: string;
      session_id: string | null;
    }>;

    return rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  async getEventsByDefinition(eventDefinitionId: string, query: EventQuery) {
    const conditions: string[] = [
      "project_id = {projectId:String}",
      "event_definition_id = {eventDefinitionId:String}",
    ];
    const params: Record<string, unknown> = {
      projectId: query.projectId,
      eventDefinitionId,
    };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || ANALYTICS_UNLIMITED_QUERY_LIMIT;
    const offset = query.offset || 0;

    const result = await this.client.query({
      query: `
        SELECT 
          id,
          timestamp,
          metadata,
          created_at,
          event_definition_id,
          project_id,
          session_id
        FROM tracked_event
        WHERE ${conditions.join(" AND ")}
        ORDER BY timestamp DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `,
      query_params: { ...params, limit, offset },
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      id: string;
      timestamp: string;
      metadata: string | null;
      created_at: string;
      event_definition_id: string;
      project_id: string;
      session_id: string | null;
    }>;

    return rows.map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
  }

  async getEventsTimeSeries(query: EventQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.eventDefinitionId) {
      conditions.push("event_definition_id = {eventDefinitionId:String}");
      params.eventDefinitionId = query.eventDefinitionId;
    }
    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT 
          toDate(timestamp) as date,
          count() as total
        FROM tracked_event
        WHERE ${conditions.join(" AND ")}
        GROUP BY date
        ORDER BY date ASC
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      date: string;
      total: number;
    }>;

    // Get all events to calculate views/clicks from metadata
    const allEvents = await this.getTrackedEvents({
      ...query,
      limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
    });

    const eventCountsByDay: Record<
      string,
      { total: number; views: number; clicks: number }
    > = {};

    for (const row of rows) {
      eventCountsByDay[row.date] = { total: row.total, views: 0, clicks: 0 };
    }

    for (const event of allEvents) {
      const dateKey =
        new Date(event.timestamp).toISOString().split("T")[0] ?? "";
      if (eventCountsByDay[dateKey]) {
        const metadata = event.metadata as { eventType?: string } | null;
        const type = metadata?.eventType || "unknown";
        if (type === "view") {
          eventCountsByDay[dateKey].views += 1;
        }
        if (type === "click") {
          eventCountsByDay[dateKey].clicks += 1;
        }
      }
    }

    return Object.entries(eventCountsByDay).map(([date, data]) => ({
      date,
      total: data.total,
      views: data.views,
      clicks: data.clicks,
    }));
  }

  async getEventDetails(eventId: string, projectId: string) {
    const result = await this.client.query({
      query: `
        SELECT 
          id,
          timestamp,
          metadata,
          created_at,
          event_definition_id,
          project_id,
          session_id
        FROM tracked_event
        WHERE id = {eventId:String}
          AND project_id = {projectId:String}
        LIMIT 1
      `,
      query_params: { eventId, projectId },
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      id: string;
      timestamp: string;
      metadata: string | null;
      created_at: string;
      event_definition_id: string;
      project_id: string;
      session_id: string | null;
    }>;

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  async getTopEvents(query: StatsQuery, limit = 10) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT 
          event_definition_id,
          count() as count
        FROM tracked_event
        WHERE ${conditions.join(" AND ")}
        GROUP BY event_definition_id
        ORDER BY count DESC
        LIMIT {limit:UInt32}
      `,
      query_params: { ...params, limit },
      format: "JSONEachRow",
    });

    return (await result.json()) as Array<{
      event_definition_id: string;
      count: number;
    }>;
  }

  async getLiveUserLocations(projectId: string) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Get live sessions using window function to get latest state per session_id
    const sessionsResult = await this.client.query({
      query: `
        SELECT 
          id,
          session_id,
          started_at,
          updated_at,
          user_agent,
          country,
          country_code,
          city
        FROM (
          SELECT 
            id,
            session_id,
            started_at,
            updated_at,
            ended_at,
            user_agent,
            country,
            country_code,
            city,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE project_id = {projectId:String}
            AND updated_at >= {thirtyMinutesAgo:DateTime}
        )
        WHERE rn = 1
          AND ended_at IS NULL
        ORDER BY updated_at DESC
      `,
      query_params: {
        projectId,
        thirtyMinutesAgo: formatDateForClickHouse(thirtyMinutesAgo),
      },
      format: "JSONEachRow",
    });

    const sessions = (await sessionsResult.json()) as Array<{
      id: string;
      session_id: string;
      started_at: string;
      updated_at: string;
      user_agent: string | null;
      country: string | null;
      country_code: string | null;
      city: string | null;
    }>;

    if (sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map((s) => s.session_id);

    // Get pageviews for these sessions using the efficient method
    const pageviews = await this.getPageViewsBySessionIds(
      projectId,
      sessionIds
    );

    // Get latest pageview per session
    const latestPageviewBySession = new Map<string, (typeof pageviews)[0]>();
    for (const pv of pageviews) {
      if (pv.session_id) {
        const existing = latestPageviewBySession.get(pv.session_id);
        if (
          !existing ||
          new Date(pv.timestamp) > new Date(existing.timestamp)
        ) {
          latestPageviewBySession.set(pv.session_id, pv);
        }
      }
    }

    return sessions.map((session) => {
      const latestPv = latestPageviewBySession.get(session.session_id);

      // Use pageview coordinates if available and valid
      let lat = latestPv?.lat || null;
      let lon = latestPv?.lon || null;

      // If no valid coordinates from pageview, use country center as fallback
      if (!(lat && lon) || (lat === 0 && lon === 0)) {
        const countryCode = session.country_code;
        if (countryCode) {
          // Use approximate country center coordinates
          // This ensures all sessions show on map even without exact location
          const countryCenter = this.getCountryCenterCoordinates(countryCode);
          if (countryCenter) {
            lat = countryCenter.lat;
            lon = countryCenter.lon;
          }
        }
      }

      return {
        id: session.id,
        session_id: session.session_id,
        started_at: session.started_at,
        user_agent: session.user_agent,
        country: session.country,
        country_code: session.country_code,
        city: session.city,
        pageview_country: latestPv?.country || null,
        pageview_country_code: latestPv?.country_code || null,
        lat,
        lon,
      };
    });
  }

  // Helper to get country center coordinates for map markers
  private getCountryCenterCoordinates(
    countryCode: string
  ): { lat: number; lon: number } | null {
    // Approximate center coordinates for common countries
    const countryCenters: Record<string, { lat: number; lon: number }> = {
      US: { lat: 37.0902, lon: -95.7129 },
      GB: { lat: 55.3781, lon: -3.436 },
      FR: { lat: 46.2276, lon: 2.2137 },
      DE: { lat: 51.1657, lon: 10.4515 },
      CA: { lat: 56.1304, lon: -106.3468 },
      AU: { lat: -25.2744, lon: 133.7751 },
      JP: { lat: 36.2048, lon: 138.2529 },
      KR: { lat: 35.9078, lon: 127.7669 }, // South Korea
      CZ: { lat: 49.8175, lon: 15.473 },
      BG: { lat: 42.7339, lon: 25.4858 },
      ES: { lat: 40.4637, lon: -3.7492 },
      IT: { lat: 41.8719, lon: 12.5674 },
      NL: { lat: 52.1326, lon: 5.2913 },
      SE: { lat: 60.1282, lon: 18.6435 },
      NO: { lat: 60.472, lon: 8.4689 },
      DK: { lat: 56.2639, lon: 9.5018 },
      FI: { lat: 61.9241, lon: 25.7482 },
      PL: { lat: 51.9194, lon: 19.1451 },
      BR: { lat: -14.235, lon: -51.9253 },
      IN: { lat: 20.5937, lon: 78.9629 },
      CN: { lat: 35.8617, lon: 104.1954 },
      MX: { lat: 23.6345, lon: -102.5528 }, // Mexico
      RU: { lat: 61.524, lon: 105.3188 }, // Russia
    };

    return countryCenters[countryCode.toUpperCase()] || null;
  }

  async getRecentSessions(projectId: string, since: Date, limit = 10) {
    // Simple approach: Use window function to get latest row per session_id
    // Filter by updated_at to get sessions that were recently active
    // Order by updated_at DESC to show most recently active sessions first
    const result = await this.client.query({
      query: `
        SELECT 
          id,
          session_id,
          started_at,
          country,
          country_code,
          city,
          user_agent,
          entry_page
        FROM (
          SELECT 
            id,
            session_id,
            started_at,
            updated_at,
            country,
            country_code,
            city,
            user_agent,
            entry_page,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE project_id = {projectId:String}
            AND updated_at >= {since:DateTime}
        )
        WHERE rn = 1
        ORDER BY updated_at DESC
        LIMIT {limit:UInt32}
      `,
      query_params: {
        projectId,
        since: formatDateForClickHouse(since),
        limit,
      },
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      id: string;
      session_id: string;
      started_at: string;
      country: string | null;
      country_code: string | null;
      city: string | null;
      user_agent: string | null;
      entry_page: string;
    }>;

    return rows;
  }

  async getSessionById(sessionId: string, projectId: string) {
    const sessionResult = await this.client.query({
      query: `
        SELECT 
          id,
          session_id,
          started_at,
          ended_at,
          duration,
          did_bounce,
          visitor_id,
          entry_page,
          exit_page,
          user_agent,
          country,
          country_code,
          city,
          project_id
        FROM tracked_session
        WHERE session_id = {sessionId:String}
          AND project_id = {projectId:String}
        ORDER BY started_at DESC
        LIMIT 1
      `,
      query_params: { sessionId, projectId },
      format: "JSONEachRow",
    });

    const sessions = (await sessionResult.json()) as Array<{
      id: string;
      session_id: string;
      started_at: string;
      ended_at: string | null;
      duration: number | null;
      did_bounce: boolean;
      visitor_id: string | null;
      entry_page: string;
      exit_page: string | null;
      user_agent: string | null;
      country: string | null;
      country_code: string | null;
      city: string | null;
      project_id: string;
    }>;

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0];

    const pageviewsResult = await this.client.query({
      query: `
        SELECT 
          id,
          url,
          timestamp
        FROM page_view_event
        WHERE session_id = {sessionId:String}
          AND project_id = {projectId:String}
        ORDER BY timestamp ASC
      `,
      query_params: { sessionId, projectId },
      format: "JSONEachRow",
    });

    const pageviews = (await pageviewsResult.json()) as Array<{
      id: string;
      url: string;
      timestamp: string;
    }>;

    const eventsResult = await this.client.query({
      query: `
        SELECT 
          id,
          timestamp,
          metadata,
          event_definition_id
        FROM tracked_event
        WHERE session_id = {sessionId:String}
          AND project_id = {projectId:String}
        ORDER BY timestamp ASC
      `,
      query_params: { sessionId, projectId },
      format: "JSONEachRow",
    });

    const events = (await eventsResult.json()) as Array<{
      id: string;
      timestamp: string;
      metadata: string | null;
      event_definition_id: string;
    }>;

    return {
      ...session,
      pageViewEvents: pageviews.map((pv) => ({
        id: pv.id,
        url: pv.url,
        timestamp: new Date(pv.timestamp),
      })),
      trackedEvents: events.map((ev) => ({
        id: ev.id,
        timestamp: new Date(ev.timestamp),
        metadata: ev.metadata ? JSON.parse(ev.metadata) : null,
        eventDefinitionId: ev.event_definition_id,
      })),
    };
  }

  async getSessionJourneys(
    projectId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId };

    if (startDate) {
      conditions.push("started_at >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(startDate);
    }
    if (endDate) {
      conditions.push("started_at <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT 
          session_id,
          entry_page,
          exit_page
        FROM tracked_session
        WHERE ${conditions.join(" AND ")}
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    return (await result.json()) as Array<{
      session_id: string;
      entry_page: string;
      exit_page: string | null;
    }>;
  }

  async getLiveTopCountries(projectId: string) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Get live sessions using window function to get latest state per session_id
    const sessionsResult = await this.client.query({
      query: `
        SELECT session_id
        FROM (
          SELECT 
            session_id,
            ended_at,
            updated_at,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE project_id = {projectId:String}
            AND updated_at >= {thirtyMinutesAgo:DateTime}
        )
        WHERE rn = 1
          AND ended_at IS NULL
      `,
      query_params: {
        projectId,
        thirtyMinutesAgo: formatDateForClickHouse(thirtyMinutesAgo),
      },
      format: "JSONEachRow",
    });

    const sessions = (await sessionsResult.json()) as Array<{
      session_id: string;
    }>;

    if (sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map((s) => s.session_id);

    // Get latest pageview for each session
    // Query all pageviews and filter in code (more reliable than Array parameter)
    const pageviewsResult = await this.client.query({
      query: `
        SELECT 
          session_id,
          country,
          country_code,
          timestamp
        FROM page_view_event
        WHERE project_id = {projectId:String}
          AND session_id != ''
        ORDER BY timestamp DESC
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    const allPageviews = (await pageviewsResult.json()) as Array<{
      session_id: string | null;
      country: string | null;
      country_code: string | null;
      timestamp: string;
    }>;

    // Filter to only relevant sessions and get latest per session
    const relevantPageviews = allPageviews.filter(
      (pv) => pv.session_id && sessionIds.includes(pv.session_id)
    );

    const latestPageviewBySession = new Map<
      string,
      (typeof relevantPageviews)[0]
    >();
    for (const pv of relevantPageviews) {
      if (pv.session_id && !latestPageviewBySession.has(pv.session_id)) {
        latestPageviewBySession.set(pv.session_id, pv);
      }
    }

    // Count countries
    const countryCounts = new Map<
      string,
      { country: string; country_code: string; count: number }
    >();
    for (const session of sessions) {
      const latestPv = latestPageviewBySession.get(session.session_id);
      if (latestPv?.country && latestPv?.country_code) {
        const key = latestPv.country_code;
        if (!countryCounts.has(key)) {
          countryCounts.set(key, {
            country: latestPv.country,
            country_code: latestPv.country_code,
            count: 0,
          });
        }
        countryCounts.get(key)!.count += 1;
      }
    }

    return Array.from(countryCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async getLiveTopPages(projectId: string) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Get live sessions using window function to get latest state per session_id
    const sessionsResult = await this.client.query({
      query: `
        SELECT session_id
        FROM (
          SELECT 
            session_id,
            ended_at,
            updated_at,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE project_id = {projectId:String}
            AND updated_at >= {thirtyMinutesAgo:DateTime}
        )
        WHERE rn = 1
          AND ended_at IS NULL
      `,
      query_params: {
        projectId,
        thirtyMinutesAgo: formatDateForClickHouse(thirtyMinutesAgo),
      },
      format: "JSONEachRow",
    });

    const sessions = (await sessionsResult.json()) as Array<{
      session_id: string;
    }>;

    if (sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map((s) => s.session_id);

    // Get latest pageview for each session
    // Query all pageviews and filter in code (more reliable than Array parameter)
    const pageviewsResult = await this.client.query({
      query: `
        SELECT 
          session_id,
          url,
          timestamp
        FROM page_view_event
        WHERE project_id = {projectId:String}
          AND session_id != ''
        ORDER BY timestamp DESC
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    const allPageviews = (await pageviewsResult.json()) as Array<{
      session_id: string | null;
      url: string;
      timestamp: string;
    }>;

    // Filter to only relevant sessions and get latest per session
    const relevantPageviews = allPageviews.filter(
      (pv) => pv.session_id && sessionIds.includes(pv.session_id)
    );

    const latestPageviewBySession = new Map<
      string,
      (typeof relevantPageviews)[0]
    >();
    for (const pv of relevantPageviews) {
      if (pv.session_id && !latestPageviewBySession.has(pv.session_id)) {
        latestPageviewBySession.set(pv.session_id, pv);
      }
    }

    // Count URLs
    const urlCounts = new Map<string, number>();
    for (const session of sessions) {
      const latestPv = latestPageviewBySession.get(session.session_id);
      if (latestPv?.url) {
        urlCounts.set(latestPv.url, (urlCounts.get(latestPv.url) || 0) + 1);
      }
    }

    return Array.from(urlCounts.entries())
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async getLiveTopReferrers(projectId: string) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Get live sessions using window function to get latest state per session_id
    const sessionsResult = await this.client.query({
      query: `
        SELECT session_id
        FROM (
          SELECT 
            session_id,
            ended_at,
            updated_at,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE project_id = {projectId:String}
            AND updated_at >= {thirtyMinutesAgo:DateTime}
        )
        WHERE rn = 1
          AND ended_at IS NULL
      `,
      query_params: {
        projectId,
        thirtyMinutesAgo: formatDateForClickHouse(thirtyMinutesAgo),
      },
      format: "JSONEachRow",
    });

    const sessions = (await sessionsResult.json()) as Array<{
      session_id: string;
    }>;

    if (sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map((s) => s.session_id);

    // Get latest pageview for each session
    const pageviewsResult = await this.client.query({
      query: `
        SELECT 
          session_id,
          referrer,
          timestamp
        FROM page_view_event
        WHERE project_id = {projectId:String}
          AND session_id != ''
        ORDER BY timestamp DESC
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    const allPageviews = (await pageviewsResult.json()) as Array<{
      session_id: string | null;
      referrer: string | null;
      timestamp: string;
    }>;

    // Filter to only relevant sessions and get latest per session
    const relevantPageviews = allPageviews.filter(
      (pv) => pv.session_id && sessionIds.includes(pv.session_id)
    );

    const latestPageviewBySession = new Map<
      string,
      (typeof relevantPageviews)[0]
    >();
    for (const pv of relevantPageviews) {
      if (pv.session_id && !latestPageviewBySession.has(pv.session_id)) {
        latestPageviewBySession.set(pv.session_id, pv);
      }
    }

    // Count referrers
    const referrerCounts = new Map<string, number>();
    for (const session of sessions) {
      const latestPv = latestPageviewBySession.get(session.session_id);
      let referrer = "Direct";

      if (latestPv?.referrer) {
        try {
          const url = new URL(latestPv.referrer);
          referrer = url.hostname.replace(/^www\./, "");
        } catch {
          referrer = latestPv.referrer;
        }
      }

      referrerCounts.set(referrer, (referrerCounts.get(referrer) || 0) + 1);
    }

    return Array.from(referrerCounts.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async cleanupStaleSessions(projectId: string): Promise<number> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const now = new Date();

    // Use mutations_sync=2 to wait for the mutation to complete before proceeding
    // This ensures the subsequent COUNT query returns accurate results
    await this.client.command({
      query: `
        ALTER TABLE tracked_session
        UPDATE 
          ended_at = {now:DateTime},
          duration = 1800,
          did_bounce = false
        WHERE project_id = {projectId:String}
          AND ended_at IS NULL
          AND started_at < {thirtyMinutesAgo:DateTime}
        SETTINGS mutations_sync = 2
      `,
      query_params: {
        projectId,
        now: formatDateForClickHouse(now),
        thirtyMinutesAgo: formatDateForClickHouse(thirtyMinutesAgo),
      },
    });

    const countResult = await this.client.query({
      query: `
        SELECT count() as count
        FROM tracked_session
        WHERE project_id = {projectId:String}
          AND ended_at = {now:DateTime}
          AND started_at < {thirtyMinutesAgo:DateTime}
      `,
      query_params: {
        projectId,
        now: formatDateForClickHouse(now),
        thirtyMinutesAgo: formatDateForClickHouse(thirtyMinutesAgo),
      },
      format: "JSONEachRow",
    });

    const rows = (await countResult.json()) as Array<{ count: number }>;
    return rows[0]?.count || 0;
  }

  async getSessionsForFunnel(
    projectId: string,
    startDate: Date,
    endDate: Date
  ) {
    const sessionsResult = await this.client.query({
      query: `
        SELECT 
          id,
          session_id,
          started_at,
          ended_at,
          duration,
          did_bounce,
          visitor_id,
          entry_page,
          exit_page,
          user_agent,
          country,
          country_code,
          city,
          project_id
        FROM tracked_session
        WHERE project_id = {projectId:String}
          AND started_at >= {startDate:DateTime}
          AND started_at <= {endDate:DateTime}
        ORDER BY started_at ASC
      `,
      query_params: {
        projectId,
        startDate: formatDateForClickHouse(startDate),
        endDate: formatDateForClickHouse(endDate),
      },
      format: "JSONEachRow",
    });

    const sessions = (await sessionsResult.json()) as Array<{
      id: string;
      session_id: string;
      started_at: string;
      ended_at: string | null;
      duration: number | null;
      did_bounce: boolean;
      visitor_id: string | null;
      entry_page: string;
      exit_page: string | null;
      user_agent: string | null;
      country: string | null;
      country_code: string | null;
      city: string | null;
      project_id: string;
    }>;

    if (sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map((s) => s.session_id);

    // Query all pageviews and filter in code (more reliable than Array parameter)
    const pageviewsResult = await this.client.query({
      query: `
        SELECT 
          id,
          url,
          timestamp,
          session_id
        FROM page_view_event
        WHERE project_id = {projectId:String}
          AND timestamp >= {startDate:DateTime}
          AND timestamp <= {endDate:DateTime}
        ORDER BY timestamp ASC
      `,
      query_params: {
        projectId,
        startDate: formatDateForClickHouse(startDate),
        endDate: formatDateForClickHouse(endDate),
      },
      format: "JSONEachRow",
    });

    const allPageviews = (await pageviewsResult.json()) as Array<{
      id: string;
      url: string;
      timestamp: string;
      session_id: string | null;
    }>;

    // Filter to only relevant sessions
    const pageviews = allPageviews.filter(
      (pv) => pv.session_id && sessionIds.includes(pv.session_id)
    );

    // Query all events and filter in code
    const eventsResult = await this.client.query({
      query: `
        SELECT 
          id,
          timestamp,
          metadata,
          event_definition_id,
          session_id
        FROM tracked_event
        WHERE project_id = {projectId:String}
          AND timestamp >= {startDate:DateTime}
          AND timestamp <= {endDate:DateTime}
        ORDER BY timestamp ASC
      `,
      query_params: {
        projectId,
        startDate: formatDateForClickHouse(startDate),
        endDate: formatDateForClickHouse(endDate),
      },
      format: "JSONEachRow",
    });

    const allEvents = (await eventsResult.json()) as Array<{
      id: string;
      timestamp: string;
      metadata: string | null;
      event_definition_id: string;
      session_id: string | null;
    }>;

    // Filter to only relevant sessions
    const events = allEvents.filter(
      (ev) => ev.session_id && sessionIds.includes(ev.session_id)
    );

    const pageviewsBySession = pageviews.reduce(
      (acc, pv) => {
        if (pv.session_id) {
          if (!acc[pv.session_id]) {
            acc[pv.session_id] = [];
          }
          acc[pv.session_id].push({
            id: pv.id,
            url: pv.url,
            timestamp: parseClickHouseDate(pv.timestamp),
          });
        }
        return acc;
      },
      {} as Record<string, Array<{ id: string; url: string; timestamp: Date }>>
    );

    const eventsBySession = events.reduce(
      (acc, ev) => {
        if (ev.session_id) {
          if (!acc[ev.session_id]) {
            acc[ev.session_id] = [];
          }
          acc[ev.session_id].push({
            id: ev.id,
            timestamp: parseClickHouseDate(ev.timestamp),
            metadata: ev.metadata ? JSON.parse(ev.metadata) : null,
            eventDefinitionId: ev.event_definition_id,
          });
        }
        return acc;
      },
      {} as Record<
        string,
        Array<{
          id: string;
          timestamp: Date;
          metadata: Record<string, unknown> | null;
          eventDefinitionId: string;
        }>
      >
    );

    return sessions.map((session) => ({
      id: session.id,
      sessionId: session.session_id,
      startedAt: parseClickHouseDate(session.started_at),
      endedAt: session.ended_at ? parseClickHouseDate(session.ended_at) : null,
      duration: session.duration,
      didBounce: session.did_bounce,
      visitorId: session.visitor_id,
      entryPage: session.entry_page,
      exitPage: session.exit_page,
      userAgent: session.user_agent,
      country: session.country,
      countryCode: session.country_code,
      city: session.city,
      projectId: session.project_id,
      pageViewEvents: pageviewsBySession[session.session_id] || [],
      trackedEvents: eventsBySession[session.session_id] || [],
    }));
  }

  async getAcquisitionSources(
    query: StatsQuery & { limit?: number; offset?: number }
  ) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    // Build source string in SQL (matching getAcquisitionSource logic)
    const sourceExpression = `
      CASE
        WHEN utm_source IS NOT NULL AND utm_source != '' THEN
          concat(
            utm_source,
            if(utm_medium IS NOT NULL AND utm_medium != '', concat(' (', utm_medium, ')'), ''),
            if(utm_campaign IS NOT NULL AND utm_campaign != '', concat(' - ', utm_campaign), '')
          )
        WHEN referrer IS NOT NULL AND referrer != '' THEN
          domain(referrer)
        ELSE 'Direct'
      END
    `;

    const result = await this.client.query({
      query: `
        SELECT 
          ${sourceExpression} as source,
          count() as view_count,
          uniq(ip) as unique_users,
          max(timestamp) as last_viewed,
          min(timestamp) as first_viewed,
          any(referrer) as sample_referrer,
          any(utm_source) as sample_utm_source,
          any(utm_medium) as sample_utm_medium,
          any(utm_campaign) as sample_utm_campaign
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
        GROUP BY source
        ORDER BY view_count DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `,
      query_params: { ...params, limit, offset },
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      source: string;
      view_count: number;
      unique_users: number;
      last_viewed: string;
      first_viewed: string;
      sample_referrer: string | null;
      sample_utm_source: string | null;
      sample_utm_medium: string | null;
      sample_utm_campaign: string | null;
    }>;

    return rows.map((row) => ({
      source: row.source,
      viewCount: row.view_count,
      uniqueUserCount: row.unique_users,
      lastViewed: parseClickHouseDate(row.last_viewed),
      firstViewed: parseClickHouseDate(row.first_viewed),
      sampleReferrer: row.sample_referrer,
      sampleUtmSource: row.sample_utm_source,
      sampleUtmMedium: row.sample_utm_medium,
      sampleUtmCampaign: row.sample_utm_campaign,
    }));
  }

  async getAcquisitionSourcesCount(query: StatsQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    // Same source expression as above
    const sourceExpression = `
      CASE
        WHEN utm_source IS NOT NULL AND utm_source != '' THEN
          concat(
            utm_source,
            if(utm_medium IS NOT NULL AND utm_medium != '', concat(' (', utm_medium, ')'), ''),
            if(utm_campaign IS NOT NULL AND utm_campaign != '', concat(' - ', utm_campaign), '')
          )
        WHEN referrer IS NOT NULL AND referrer != '' THEN
          domain(referrer)
        ELSE 'Direct'
      END
    `;

    const result = await this.client.query({
      query: `
        SELECT count(DISTINCT ${sourceExpression}) as total_sources
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{ total_sources: number }>;
    return rows[0]?.total_sources || 0;
  }

  async getTrafficTypeStats(query: StatsQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT 
          countIf(referrer IS NULL OR referrer = '') as direct_traffic,
          countIf(
            utm_source IS NOT NULL AND utm_source != ''
            AND utm_medium IN ('cpc', 'paid')
          ) as paid_traffic,
          countIf(
            utm_source IS NOT NULL AND utm_source != ''
            AND (utm_medium NOT IN ('cpc', 'paid') OR utm_medium IS NULL OR utm_medium = '')
          ) as utm_traffic,
          countIf(
            referrer IS NOT NULL AND referrer != '' 
            AND (utm_source IS NULL OR utm_source = '')
            AND (
              referrer LIKE '%google.com%' 
              OR referrer LIKE '%bing.com%' 
              OR referrer LIKE '%yahoo.com%'
            )
          ) as organic_traffic,
          countIf(
            referrer IS NOT NULL AND referrer != ''
            AND (utm_source IS NULL OR utm_source = '')
            AND (
              referrer LIKE '%facebook.com%' 
              OR referrer LIKE '%twitter.com%' 
              OR referrer LIKE '%linkedin.com%' 
              OR referrer LIKE '%instagram.com%'
            )
          ) as social_traffic
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      direct_traffic: number;
      paid_traffic: number;
      utm_traffic: number;
      organic_traffic: number;
      social_traffic: number;
    }>;

    return (
      rows[0] || {
        direct_traffic: 0,
        paid_traffic: 0,
        utm_traffic: 0,
        organic_traffic: 0,
        social_traffic: 0,
      }
    );
  }

  async getAcquisitionTimeSeries(query: StatsQuery & { limit?: number }) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || 5;

    // Build source string in SQL
    const sourceExpression = `
      CASE
        WHEN utm_source IS NOT NULL AND utm_source != '' THEN
          concat(
            utm_source,
            if(utm_medium IS NOT NULL AND utm_medium != '', concat(' (', utm_medium, ')'), ''),
            if(utm_campaign IS NOT NULL AND utm_campaign != '', concat(' - ', utm_campaign), '')
          )
        WHEN referrer IS NOT NULL AND referrer != '' THEN
          domain(referrer)
        ELSE 'Direct'
      END
    `;

    // First, get top N sources by total views
    const topSourcesResult = await this.client.query({
      query: `
        SELECT ${sourceExpression} as source
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
        GROUP BY source
        ORDER BY count() DESC
        LIMIT {limit:UInt32}
      `,
      query_params: { ...params, limit },
      format: "JSONEachRow",
    });

    const topSourcesRows = (await topSourcesResult.json()) as Array<{
      source: string;
    }>;
    const topSourceNames = topSourcesRows.map((r) => r.source);

    if (topSourceNames.length === 0) {
      return [];
    }

    // Then get daily data for only those top sources
    const result = await this.client.query({
      query: `
        SELECT 
          ${sourceExpression} as source,
          toDate(timestamp) as date,
          count() as view_count,
          any(referrer) as sample_referrer,
          any(utm_source) as sample_utm_source,
          any(utm_medium) as sample_utm_medium,
          any(utm_campaign) as sample_utm_campaign
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
          AND ${sourceExpression} IN (${topSourceNames.map((s) => `'${s.replace(/'/g, "\\'")}'`).join(",")})
        GROUP BY source, date
        ORDER BY date ASC
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      source: string;
      date: string;
      view_count: number;
      sample_referrer: string | null;
      sample_utm_source: string | null;
      sample_utm_medium: string | null;
      sample_utm_campaign: string | null;
    }>;

    // Group by source
    const sourceGroups: Record<
      string,
      {
        source: string;
        dailyViews: Record<string, number>;
        totalViews: number;
        sampleReferrer: string | null;
        sampleUtmSource: string | null;
        sampleUtmMedium: string | null;
        sampleUtmCampaign: string | null;
      }
    > = {};

    for (const row of rows) {
      if (!sourceGroups[row.source]) {
        sourceGroups[row.source] = {
          source: row.source,
          dailyViews: {},
          totalViews: 0,
          sampleReferrer: row.sample_referrer,
          sampleUtmSource: row.sample_utm_source,
          sampleUtmMedium: row.sample_utm_medium,
          sampleUtmCampaign: row.sample_utm_campaign,
        };
      }
      sourceGroups[row.source].dailyViews[row.date] = row.view_count;
      sourceGroups[row.source].totalViews += row.view_count;
    }

    return Object.values(sourceGroups)
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, limit);
  }

  async getTopPagesByUrl(
    query: StatsQuery & { limit?: number; offset?: number }
  ) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    // Extract path from URL (normalize by removing query params and hash)
    // This groups https://example.com/page?foo=bar and https://example.com/page together
    const result = await this.client.query({
      query: `
        SELECT 
          path(url) as normalized_path,
          any(url) as sample_url,
          argMax(title, timestamp) as latest_title,
          count() as view_count,
          uniq(ip) as unique_users,
          max(timestamp) as last_viewed,
          min(timestamp) as first_viewed
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
        GROUP BY normalized_path
        ORDER BY view_count DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `,
      query_params: { ...params, limit, offset },
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      normalized_path: string;
      sample_url: string;
      latest_title: string | null;
      view_count: number;
      unique_users: number;
      last_viewed: string;
      first_viewed: string;
    }>;

    return rows.map((row) => ({
      url: row.sample_url, // Use a sample URL (latest one)
      title: row.latest_title,
      viewCount: row.view_count,
      uniqueUserCount: row.unique_users,
      lastViewed: parseClickHouseDate(row.last_viewed),
      firstViewed: parseClickHouseDate(row.first_viewed),
    }));
  }

  async getTopPagesCount(query: StatsQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT count(DISTINCT path(url)) as total_pages
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{ total_pages: number }>;
    return rows[0]?.total_pages || 0;
  }

  async getTopPagesTimeSeries(query: StatsQuery & { limit?: number }) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("timestamp >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("timestamp <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || 5;

    // First, get top N pages by normalized path (excluding query params)
    const topPagesResult = await this.client.query({
      query: `
        SELECT path(url) as normalized_path
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
        GROUP BY normalized_path
        ORDER BY count() DESC
        LIMIT {limit:UInt32}
      `,
      query_params: { ...params, limit },
      format: "JSONEachRow",
    });

    const topPagesRows = (await topPagesResult.json()) as Array<{
      normalized_path: string;
    }>;
    const topPagePaths = topPagesRows.map((r) => r.normalized_path);

    if (topPagePaths.length === 0) {
      return [];
    }

    // Then get daily data for only those top pages
    const result = await this.client.query({
      query: `
        SELECT 
          path(url) as normalized_path,
          any(url) as sample_url,
          toDate(timestamp) as date,
          count() as view_count,
          argMax(title, timestamp) as latest_title
        FROM page_view_event
        WHERE ${conditions.join(" AND ")}
          AND path(url) IN (${topPagePaths.map((p) => `'${p.replace(/'/g, "\\'")}'`).join(",")})
        GROUP BY normalized_path, date
        ORDER BY date ASC
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      normalized_path: string;
      sample_url: string;
      date: string;
      view_count: number;
      latest_title: string | null;
    }>;

    // Group by normalized path
    const urlGroups: Record<
      string,
      {
        url: string;
        title: string | null;
        dailyViews: Record<string, number>;
        totalViews: number;
      }
    > = {};

    for (const row of rows) {
      if (!urlGroups[row.normalized_path]) {
        urlGroups[row.normalized_path] = {
          url: row.sample_url,
          title: row.latest_title,
          dailyViews: {},
          totalViews: 0,
        };
      }
      urlGroups[row.normalized_path].dailyViews[row.date] = row.view_count;
      urlGroups[row.normalized_path].totalViews += row.view_count;
      // Keep most recent title
      if (row.latest_title) {
        urlGroups[row.normalized_path].title = row.latest_title;
      }
    }

    return Object.values(urlGroups)
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, limit);
  }

  async getTopEntryPages(
    query: StatsQuery & { limit?: number; offset?: number }
  ) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("started_at >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("started_at <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    // Use window function to get latest session state, then group by entry_page
    const result = await this.client.query({
      query: `
        SELECT 
          entry_page,
          count(DISTINCT session_id) as session_count,
          max(updated_at) as last_session
        FROM (
          SELECT 
            entry_page,
            session_id,
            updated_at,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE ${conditions.join(" AND ")}
        )
        WHERE rn = 1
        GROUP BY entry_page
        ORDER BY session_count DESC
        LIMIT {limit:UInt32}
        OFFSET {offset:UInt32}
      `,
      query_params: { ...params, limit, offset },
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      entry_page: string;
      session_count: number;
      last_session: string;
    }>;

    return rows.map((row) => ({
      entryPage: row.entry_page,
      sessionCount: row.session_count,
      lastSession: parseClickHouseDate(row.last_session),
    }));
  }

  async getTopEntryPagesCount(query: StatsQuery) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("started_at >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("started_at <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT count(DISTINCT entry_page) as total_entry_pages
        FROM (
          SELECT 
            entry_page,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE ${conditions.join(" AND ")}
        )
        WHERE rn = 1
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{ total_entry_pages: number }>;
    return rows[0]?.total_entry_pages || 0;
  }

  async getTopEntryPagesTimeSeries(query: StatsQuery & { limit?: number }) {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("started_at >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("started_at <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const limit = query.limit || 5;

    // First, get top N entry pages by total sessions
    const topEntryPagesResult = await this.client.query({
      query: `
        SELECT entry_page
        FROM (
          SELECT 
            entry_page,
            session_id,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE ${conditions.join(" AND ")}
        )
        WHERE rn = 1
        GROUP BY entry_page
        ORDER BY count(DISTINCT session_id) DESC
        LIMIT {limit:UInt32}
      `,
      query_params: { ...params, limit },
      format: "JSONEachRow",
    });

    const topEntryPagesRows = (await topEntryPagesResult.json()) as Array<{
      entry_page: string;
    }>;
    const topEntryPageUrls = topEntryPagesRows.map((r) => r.entry_page);

    if (topEntryPageUrls.length === 0) {
      return [];
    }

    // Then get daily data for only those top entry pages
    const result = await this.client.query({
      query: `
        SELECT 
          entry_page,
          toDate(started_at) as date,
          count(DISTINCT session_id) as session_count
        FROM (
          SELECT 
            entry_page,
            session_id,
            started_at,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE ${conditions.join(" AND ")}
            AND entry_page IN (${topEntryPageUrls.map((url) => `'${url.replace(/'/g, "\\'")}'`).join(",")})
        )
        WHERE rn = 1
        GROUP BY entry_page, date
        ORDER BY date ASC
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{
      entry_page: string;
      date: string;
      session_count: number;
    }>;

    // Group by entry page
    const entryPageGroups: Record<
      string,
      {
        entryPage: string;
        dailySessions: Record<string, number>;
        totalSessions: number;
      }
    > = {};

    for (const row of rows) {
      if (!entryPageGroups[row.entry_page]) {
        entryPageGroups[row.entry_page] = {
          entryPage: row.entry_page,
          dailySessions: {},
          totalSessions: 0,
        };
      }
      entryPageGroups[row.entry_page].dailySessions[row.date] =
        row.session_count;
      entryPageGroups[row.entry_page].totalSessions += row.session_count;
    }

    return Object.values(entryPageGroups)
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, limit);
  }

  async getSessionsCount(query: StatsQuery): Promise<number> {
    const conditions: string[] = ["project_id = {projectId:String}"];
    const params: Record<string, unknown> = { projectId: query.projectId };

    if (query.startDate) {
      conditions.push("updated_at >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("updated_at <= {endDate:DateTime}");
      params.endDate = formatDateForClickHouse(query.endDate);
    }

    const result = await this.client.query({
      query: `
        SELECT count(DISTINCT session_id) as total_sessions
        FROM (
          SELECT 
            session_id,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE ${conditions.join(" AND ")}
        )
        WHERE rn = 1
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const rows = (await result.json()) as Array<{ total_sessions: number }>;
    return rows[0]?.total_sessions || 0;
  }
}
