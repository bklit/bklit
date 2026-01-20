import { AnalyticsService } from "@bklit/analytics/service";
import { prisma } from "@bklit/db/client";
import { parseClickHouseDate } from "@/lib/date-utils";
import type { SessionData } from "@/types/geo";

// DEPRECATED: This function is no longer used - all session operations now go through ClickHouse
// Kept for backward compatibility but should not be called
export function createOrUpdateSession(
  _data: SessionData,
  _prismaClient: typeof prisma = prisma
): Promise<never> {
  console.warn(
    "createOrUpdateSession is deprecated - use ClickHouse directly via AnalyticsService"
  );
  throw new Error(
    "createOrUpdateSession is deprecated - use ClickHouse directly"
  );
}

// DEPRECATED: This function is no longer used - all session operations now go through ClickHouse
// Kept for backward compatibility but should not be called
export function endSession(_sessionId: string): Promise<never> {
  console.warn(
    "endSession is deprecated - use ClickHouse directly via AnalyticsService"
  );
  throw new Error("endSession is deprecated - use ClickHouse directly");
}

// Get session analytics for a site
export async function getSessionAnalytics(projectId: string, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const analytics = new AnalyticsService();
    const sessions = await analytics.getSessions({
      projectId,
      startDate,
      endDate,
      limit: 10_000, // Reasonable limit for session actions
    });

    const pageviews = await analytics.getPageViews({
      projectId,
      startDate,
      endDate,
      limit: 10_000, // Reasonable limit for session actions
    });

    const pageviewsBySession = pageviews.reduce(
      (acc, pv) => {
        if (pv.session_id) {
          if (!acc[pv.session_id]) {
            acc[pv.session_id] = [];
          }
          acc[pv.session_id]?.push({
            id: pv.id,
            url: pv.url,
            timestamp: parseClickHouseDate(pv.timestamp),
          });
        }
        return acc;
      },
      {} as Record<string, Array<{ id: string; url: string; timestamp: Date }>>
    );

    const sessionsWithPageviews = sessions.map((s) => ({
      id: s.id,
      sessionId: s.session_id,
      startedAt: parseClickHouseDate(s.started_at),
      endedAt: s.ended_at ? parseClickHouseDate(s.ended_at) : null,
      duration: s.duration,
      didBounce: s.did_bounce,
      visitorId: s.visitor_id,
      entryPage: s.entry_page,
      exitPage: s.exit_page,
      userAgent: s.user_agent,
      country: s.country,
      city: s.city,
      projectId: s.project_id,
      pageViewEvents: (pageviewsBySession[s.session_id] || []).sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      ),
    }));

    const totalSessions = sessionsWithPageviews.length;
    const bouncedSessions = sessionsWithPageviews.filter(
      (s) => s.didBounce
    ).length;
    const bounceRate =
      totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

    const avgSessionDuration =
      sessionsWithPageviews.length > 0
        ? sessionsWithPageviews.reduce(
            (sum: number, s) => sum + (s.duration || 0),
            0
          ) / sessionsWithPageviews.length
        : 0;

    const avgPageViews =
      sessionsWithPageviews.length > 0
        ? sessionsWithPageviews.reduce(
            (sum: number, s) => sum + s.pageViewEvents.length,
            0
          ) / sessionsWithPageviews.length
        : 0;

    return {
      totalSessions,
      bouncedSessions,
      bounceRate: Math.round(bounceRate * 100) / 100,
      avgSessionDuration: Math.round(avgSessionDuration),
      avgPageViews: Math.round(avgPageViews * 100) / 100,
      sessions: sessionsWithPageviews.slice(0, 10), // Return last 10 sessions
    };
  } catch (error) {
    console.error("Error getting session analytics:", error);
    throw error;
  }
}

// Get recent sessions with page flow
export async function getRecentSessions(projectId: string, limit = 10) {
  try {
    const analytics = new AnalyticsService();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const sessions = await analytics.getRecentSessions(projectId, since, limit);

    // Get pageviews for these sessions
    const sessionIds = sessions.map((s) => s.session_id);
    const pageviews = await analytics.getPageViews({
      projectId,
      limit: 10_000, // Reasonable limit for session actions
    });

    const pageviewsBySession = pageviews.reduce(
      (acc, pv) => {
        if (pv.session_id && sessionIds.includes(pv.session_id)) {
          if (!acc[pv.session_id]) {
            acc[pv.session_id] = [];
          }
          acc[pv.session_id]?.push({
            id: pv.id,
            url: pv.url,
            timestamp: parseClickHouseDate(pv.timestamp),
          });
        }
        return acc;
      },
      {} as Record<string, Array<{ id: string; url: string; timestamp: Date }>>
    );

    return sessions.map((s) => ({
      id: s.id,
      sessionId: s.session_id,
      startedAt: parseClickHouseDate(s.started_at),
      endedAt: null,
      duration: null,
      didBounce: false,
      visitorId: null,
      entryPage: s.entry_page,
      exitPage: null,
      userAgent: s.user_agent,
      country: s.country,
      city: s.city,
      projectId,
      pageViewEvents: (pageviewsBySession[s.session_id] || []).sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      ),
    }));
  } catch (error) {
    console.error("Error getting recent sessions:", error);
    throw error;
  }
}

// Clean up stale sessions (sessions older than 30 minutes that haven't ended)
export async function cleanupStaleSessions(projectId?: string) {
  try {
    const analytics = new AnalyticsService();

    // Clean up in ClickHouse only (if projectId provided, otherwise skip)
    if (projectId) {
      await analytics.cleanupStaleSessions(projectId);
      return 1; // Return success count
    }

    return 0;
  } catch (error) {
    console.error("Error cleaning up stale sessions:", error);
    return 0;
  }
}

// Get a single session by ID with all related data
export async function getSessionById(sessionId: string) {
  try {
    // Get project info from PostgreSQL (project metadata is still in Postgres)
    // First, try to find the project by querying all projects and matching session
    const analytics = new AnalyticsService();

    // Get all sessions from ClickHouse to find the one with matching id
    // This is inefficient but necessary since we don't have projectId
    // In practice, this function should receive projectId as a parameter
    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
      },
    });

    // Try each project until we find the session
    for (const project of allProjects) {
      const sessions = await analytics.getSessions({
        projectId: project.id,
        limit: 10_000, // Reasonable limit for session actions
      });

      const sessionData = sessions.find((s) => s.id === sessionId);

      if (sessionData) {
        const session = await analytics.getSessionById(
          sessionData.session_id,
          project.id
        );

        if (session) {
          return {
            id: session.id,
            sessionId: session.session_id,
            startedAt: parseClickHouseDate(session.started_at ?? ""),
            endedAt: session.ended_at
              ? parseClickHouseDate(session.ended_at)
              : null,
            duration: session.duration,
            didBounce: session.did_bounce,
            visitorId: session.visitor_id,
            entryPage: session.entry_page,
            exitPage: session.exit_page,
            userAgent: session.user_agent,
            country: session.country,
            city: session.city,
            projectId: session.project_id,
            pageViewEvents: session.pageViewEvents,
            project: {
              name: project.name,
              domain: project.domain,
            },
          };
        }
      }
    }

    throw new Error("Session not found");
  } catch (error) {
    console.error("Error getting session by ID:", error);
    throw error;
  }
}
