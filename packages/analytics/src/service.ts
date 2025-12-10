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

function formatDateForClickHouse(date: Date): string {
  return date.toISOString().replace("T", " ").replace("Z", "").slice(0, 19);
}

export class AnalyticsService {
  private client = getClickHouseClient();

  async createPageView(data: PageViewData): Promise<void> {
    await this.client.insert({
      table: "page_view_event",
      values: [
        {
          id: data.id,
          url: data.url,
          timestamp: data.timestamp,
          created_at: data.createdAt || new Date(),
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
        },
      ],
      format: "JSONEachRow",
    });
  }

  async createTrackedEvent(data: TrackedEventData): Promise<void> {
    await this.client.insert({
      table: "tracked_event",
      values: [
        {
          id: data.id,
          timestamp: data.timestamp,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          created_at: data.createdAt || new Date(),
          event_definition_id: data.eventDefinitionId,
          project_id: data.projectId,
          session_id: data.sessionId,
        },
      ],
      format: "JSONEachRow",
    });
  }

  async createTrackedSession(data: TrackedSessionData): Promise<void> {
    await this.client.insert({
      table: "tracked_session",
      values: [
        {
          id: data.id,
          session_id: data.sessionId,
          started_at: data.startedAt,
          ended_at: data.endedAt,
          duration: data.duration,
          did_bounce: data.didBounce ?? false,
          visitor_id: data.visitorId,
          entry_page: data.entryPage,
          exit_page: data.exitPage,
          user_agent: data.userAgent,
          country: data.country,
          city: data.city,
          project_id: data.projectId,
          updated_at: new Date(), // Set updated_at to current time
        },
      ],
      format: "JSONEachRow",
    });
  }

  async updateTrackedSession(
    sessionId: string,
    data: Partial<
      Pick<TrackedSessionData, "endedAt" | "duration" | "exitPage">
    >,
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
      city: string | null;
      project_id: string;
    }>;

    if (sessions.length === 0) return;

    const session = sessions[0];
    if (!session) return;

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
      city: session.city,
      projectId: session.project_id,
    });
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
          count() as total_views,
          uniq(ip) as unique_visits,
          uniq(url) as unique_pages,
          countIf(mobile = true) as mobile_visits,
          countIf(mobile = false) as desktop_visits
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
          count() as visits,
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

    if (query.startDate) {
      conditions.push("started_at >= {startDate:DateTime}");
      params.startDate = formatDateForClickHouse(query.startDate);
    }
    if (query.endDate) {
      conditions.push("started_at <= {endDate:DateTime}");
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
          ended_at,
          duration,
          did_bounce,
          visitor_id,
          entry_page,
          exit_page,
          user_agent,
          country,
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
            city,
            project_id,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE ${conditions.join(" AND ")}
        )
        WHERE rn = 1
        ORDER BY started_at DESC
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
      ended_at: string | null;
      duration: number | null;
      did_bounce: boolean;
      visitor_id: string | null;
      entry_page: string;
      exit_page: string | null;
      user_agent: string | null;
      country: string | null;
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
            started_at,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE project_id = {projectId:String}
        )
        WHERE rn = 1
          AND ended_at IS NULL
          AND started_at >= {thirtyMinutesAgo:DateTime}
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
    endDate?: Date,
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
    endDate?: Date,
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
    projectId: string,
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
        if (type === "view") eventCountsByDay[dateKey].views += 1;
        if (type === "click") eventCountsByDay[dateKey].clicks += 1;
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

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  async getTopEvents(query: StatsQuery, limit: number = 10) {
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

    // Get live sessions
    const sessionsResult = await this.client.query({
      query: `
        SELECT 
          id,
          session_id,
          started_at,
          user_agent,
          country,
          city
        FROM tracked_session
        WHERE project_id = {projectId:String}
          AND ended_at IS NULL
          AND started_at >= {thirtyMinutesAgo:DateTime}
        ORDER BY started_at DESC
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
      user_agent: string | null;
      country: string | null;
      city: string | null;
    }>;

    if (sessions.length === 0) return [];

    const sessionIds = sessions.map((s) => s.session_id);

    // Get latest pageview for each session
    // Query all pageviews and filter in code (more reliable than Array parameter)
    const pageviewsResult = await this.client.query({
      query: `
        SELECT 
          session_id,
          country,
          country_code,
          lat,
          lon,
          city,
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
      lat: number | null;
      lon: number | null;
      city: string | null;
      timestamp: string;
    }>;

    // Filter to only relevant sessions and get latest per session
    const relevantPageviews = allPageviews.filter(
      (pv) => pv.session_id && sessionIds.includes(pv.session_id),
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

    return sessions.map((session) => {
      const latestPv = latestPageviewBySession.get(session.session_id);
      return {
        id: session.id,
        session_id: session.session_id,
        started_at: session.started_at,
        user_agent: session.user_agent,
        country: session.country,
        city: session.city,
        pageview_country: latestPv?.country || null,
        pageview_country_code: latestPv?.country_code || null,
        lat: latestPv?.lat || null,
        lon: latestPv?.lon || null,
      };
    });
  }

  async getRecentSessions(projectId: string, since: Date, limit: number = 10) {
    // Simple approach: Use window function to get latest row per session_id
    // This is much simpler than argMax and avoids all the aggregate function issues
    const result = await this.client.query({
      query: `
        SELECT 
          id,
          session_id,
          started_at,
          country,
          city,
          user_agent,
          entry_page
        FROM (
          SELECT 
            id,
            session_id,
            started_at,
            country,
            city,
            user_agent,
            entry_page,
            row_number() OVER (PARTITION BY session_id ORDER BY updated_at DESC) as rn
          FROM tracked_session
          WHERE project_id = {projectId:String}
            AND started_at >= {since:DateTime}
        )
        WHERE rn = 1
        ORDER BY started_at DESC
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
      city: string | null;
      project_id: string;
    }>;

    if (sessions.length === 0) return null;

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
    endDate?: Date,
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

    // Get live sessions
    const sessionsResult = await this.client.query({
      query: `
        SELECT session_id
        FROM tracked_session
        WHERE project_id = {projectId:String}
          AND ended_at IS NULL
          AND started_at >= {thirtyMinutesAgo:DateTime}
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

    if (sessions.length === 0) return [];

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
      (pv) => pv.session_id && sessionIds.includes(pv.session_id),
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

    // Get live sessions
    const sessionsResult = await this.client.query({
      query: `
        SELECT session_id
        FROM tracked_session
        WHERE project_id = {projectId:String}
          AND ended_at IS NULL
          AND started_at >= {thirtyMinutesAgo:DateTime}
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

    if (sessions.length === 0) return [];

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
      (pv) => pv.session_id && sessionIds.includes(pv.session_id),
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

  async cleanupStaleSessions(projectId: string): Promise<number> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const now = new Date();

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
    endDate: Date,
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
      city: string | null;
      project_id: string;
    }>;

    if (sessions.length === 0) return [];

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
      (pv) => pv.session_id && sessionIds.includes(pv.session_id),
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
      (ev) => ev.session_id && sessionIds.includes(ev.session_id),
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
            timestamp: new Date(pv.timestamp),
          });
        }
        return acc;
      },
      {} as Record<string, Array<{ id: string; url: string; timestamp: Date }>>,
    );

    const eventsBySession = events.reduce(
      (acc, ev) => {
        if (ev.session_id) {
          if (!acc[ev.session_id]) {
            acc[ev.session_id] = [];
          }
          acc[ev.session_id].push({
            id: ev.id,
            timestamp: new Date(ev.timestamp),
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
      >,
    );

    return sessions.map((session) => ({
      id: session.id,
      sessionId: session.session_id,
      startedAt: new Date(session.started_at),
      endedAt: session.ended_at ? new Date(session.ended_at) : null,
      duration: session.duration,
      didBounce: session.did_bounce,
      visitorId: session.visitor_id,
      entryPage: session.entry_page,
      exitPage: session.exit_page,
      userAgent: session.user_agent,
      country: session.country,
      city: session.city,
      projectId: session.project_id,
      pageViewEvents: pageviewsBySession[session.session_id] || [],
      trackedEvents: eventsBySession[session.session_id] || [],
    }));
  }
}
