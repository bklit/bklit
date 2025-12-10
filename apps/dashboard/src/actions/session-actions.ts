import { ANALYTICS_UNLIMITED_QUERY_LIMIT } from "@bklit/analytics/constants";
import { AnalyticsService } from "@bklit/analytics/service";
import { prisma } from "@bklit/db/client";
import type { SessionData } from "@/types/geo";

// Generate a simple visitor ID for returning user detection
function generateVisitorId(userAgent: string): string {
  // Simple hash of user agent for anonymous visitor tracking
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Create or update a session (accepts a Prisma client for transaction support)
export async function createOrUpdateSession(
  data: SessionData,
  prismaClient: typeof prisma = prisma,
) {
  const { sessionId, projectId, url, userAgent, country, city } = data;

  try {
    // Check if session exists
    const existingSession = await prismaClient.trackedSession.findUnique({
      where: { sessionId },
    });

    if (existingSession) {
      // Update existing session
      return await prismaClient.trackedSession.update({
        where: { sessionId },
        data: {
          exitPage: url,
        },
      });
    } else {
      // Upsert session (create if not exists, update if exists)
      const visitorId = userAgent ? generateVisitorId(userAgent) : null;
      return await prismaClient.trackedSession.upsert({
        where: { sessionId },
        update: {
          exitPage: url,
        },
        create: {
          sessionId,
          projectId,
          entryPage: url,
          exitPage: url,
          userAgent,
          country,
          city,
          visitorId,
        },
      });
    }
  } catch (error) {
    console.error("Error creating/updating session:", error);
    throw error;
  }
}

export async function endSession(sessionId: string) {
  try {
    const session = await prisma.trackedSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    const duration = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000,
    );

    const didBounce = duration < 10;

    return await prisma.trackedSession.update({
      where: { sessionId },
      data: {
        endedAt: new Date(),
        duration,
        didBounce,
      },
    });
  } catch (error) {
    console.error("Error ending session:", error);
    throw error;
  }
}

// Get session analytics for a site
export async function getSessionAnalytics(
  projectId: string,
  days: number = 30,
) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    const analytics = new AnalyticsService();
    const sessions = await analytics.getSessions({
      projectId,
      startDate,
      endDate,
      limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
    });

    const pageviews = await analytics.getPageViews({
      projectId,
      startDate,
      endDate,
      limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
    });

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

    const sessionsWithPageviews = sessions.map((s) => ({
      id: s.id,
      sessionId: s.session_id,
      startedAt: new Date(s.started_at),
      endedAt: s.ended_at ? new Date(s.ended_at) : null,
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
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      ),
    }));

    const totalSessions = sessionsWithPageviews.length;
    const bouncedSessions = sessionsWithPageviews.filter((s) => s.didBounce)
      .length;
    const bounceRate =
      totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

    const avgSessionDuration =
      sessionsWithPageviews.length > 0
        ? sessionsWithPageviews.reduce(
            (sum: number, s) => sum + (s.duration || 0),
            0,
          ) / sessionsWithPageviews.length
        : 0;

    const avgPageViews =
      sessionsWithPageviews.length > 0
        ? sessionsWithPageviews.reduce(
            (sum: number, s) => sum + s.pageViewEvents.length,
            0,
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
export async function getRecentSessions(projectId: string, limit: number = 10) {
  try {
    const analytics = new AnalyticsService();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const sessions = await analytics.getRecentSessions(projectId, since, limit);

    // Get pageviews for these sessions
    const sessionIds = sessions.map((s) => s.session_id);
    const pageviews = await analytics.getPageViews({
      projectId,
      limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
    });

    const pageviewsBySession = pageviews.reduce(
      (acc, pv) => {
        if (pv.session_id && sessionIds.includes(pv.session_id)) {
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

    return sessions.map((s) => ({
      id: s.id,
      sessionId: s.session_id,
      startedAt: new Date(s.started_at),
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
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
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

    // Clean up in PostgreSQL
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const result = await prisma.trackedSession.updateMany({
      where: {
        ...(projectId && { projectId }),
        endedAt: null, // Sessions that haven't ended
        startedAt: {
          lt: thirtyMinutesAgo, // Started more than 30 minutes ago
        },
      },
      data: {
        endedAt: new Date(),
        duration: 1800, // 30 minutes in seconds
        didBounce: false,
      },
    });

    // Clean up in ClickHouse (if projectId provided, otherwise skip)
    if (projectId) {
      await analytics.cleanupStaleSessions(projectId);
    }

    return result.count;
  } catch (error) {
    console.error("Error cleaning up stale sessions:", error);
    return 0;
  }
}

// Get a single session by ID with all related data
export async function getSessionById(sessionId: string) {
  try {
    // First get session from PostgreSQL to get project info
    const sessionFromDb = await prisma.trackedSession.findUnique({
      where: { id: sessionId },
      select: {
        projectId: true,
        project: {
          select: {
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!sessionFromDb) {
      throw new Error("Session not found");
    }

    // Get full session data from ClickHouse
    const analytics = new AnalyticsService();
    const sessions = await analytics.getSessions({
      projectId: sessionFromDb.projectId,
      limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
    });

    const sessionData = sessions.find((s) => s.id === sessionId);

    if (!sessionData) {
      throw new Error("Session not found");
    }

    const session = await analytics.getSessionById(
      sessionData.session_id,
      sessionFromDb.projectId,
    );

    if (!session) {
      throw new Error("Session not found");
    }

    return {
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
      pageViewEvents: session.pageViewEvents,
      project: sessionFromDb.project,
    };
  } catch (error) {
    console.error("Error getting session by ID:", error);
    throw error;
  }
}
