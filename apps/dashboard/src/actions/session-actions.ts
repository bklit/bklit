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

// End a session (called when user leaves)
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

    const didBounce = duration < 10; // 10 second bounce threshold

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

    const sessions = await prisma.trackedSession.findMany({
      where: {
        projectId,
        startedAt: {
          gte: startDate,
        },
      },
      include: {
        pageViewEvents: {
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    const totalSessions = sessions.length;
    const bouncedSessions = sessions.filter(
      (s: SessionData) => s.didBounce,
    ).length;
    const bounceRate =
      totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

    const avgSessionDuration =
      sessions.length > 0
        ? sessions.reduce(
            (sum: number, s: SessionData) => sum + (s.duration || 0),
            0,
          ) / sessions.length
        : 0;

    const avgPageViews =
      sessions.length > 0
        ? sessions.reduce(
            (sum: number, s: SessionData) => sum + s.pageViewEvents.length,
            0,
          ) / sessions.length
        : 0;

    return {
      totalSessions,
      bouncedSessions,
      bounceRate: Math.round(bounceRate * 100) / 100,
      avgSessionDuration: Math.round(avgSessionDuration),
      avgPageViews: Math.round(avgPageViews * 100) / 100,
      sessions: sessions.slice(0, 10), // Return last 10 sessions
    };
  } catch (error) {
    console.error("Error getting session analytics:", error);
    throw error;
  }
}

// Get recent sessions with page flow
export async function getRecentSessions(projectId: string, limit: number = 10) {
  try {
    return await prisma.trackedSession.findMany({
      where: { projectId },
      include: {
        pageViewEvents: {
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: limit,
    });
  } catch (error) {
    console.error("Error getting recent sessions:", error);
    throw error;
  }
}

// Clean up stale sessions (sessions older than 30 minutes that haven't ended)
export async function cleanupStaleSessions() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const result = await prisma.trackedSession.updateMany({
      where: {
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

    return result.count;
  } catch (error) {
    console.error("Error cleaning up stale sessions:", error);
    return 0;
  }
}

// Get a single session by ID with all related data
export async function getSessionById(sessionId: string) {
  try {
    const session = await prisma.trackedSession.findUnique({
      where: { id: sessionId },
      include: {
        pageViewEvents: {
          orderBy: { timestamp: "asc" },
        },
        project: {
          select: {
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    return session;
  } catch (error) {
    console.error("Error getting session by ID:", error);
    throw error;
  }
}
