import { ANALYTICS_UNLIMITED_QUERY_LIMIT } from "@bklit/analytics/constants";
import { z } from "zod";
import { endOfDay, startOfDay } from "../lib/date-utils";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const sessionRouter = createTRPCRouter({
  getTimeSeries: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, organizationId: input.organizationId },
        include: {
          organization: {
            include: { members: { where: { userId: ctx.session.user.id } } },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              startedAt: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      const timeSeries = await ctx.analytics.getTimeSeries({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
      });

      const sessionCountsByDay = timeSeries.reduce(
        (acc, item) => {
          acc[item.date] = {
            total: item.total,
            engaged: item.engaged,
            bounced: item.bounced,
          };
          return acc;
        },
        {} as Record<
          string,
          { total: number; engaged: number; bounced: number }
        >,
      );

      const endDate = input.endDate || new Date();
      const startDate =
        input.startDate ||
        (() => {
          const d = new Date(endDate);
          d.setDate(d.getDate() - 30);
          return d;
        })();

      const dateRange: string[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dateRange.push(currentDate.toISOString().split("T")[0] ?? "");
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const timeSeriesData = dateRange.map((date) => ({
        date,
        total: sessionCountsByDay[date]?.total || 0,
        engaged: sessionCountsByDay[date]?.engaged || 0,
        bounced: sessionCountsByDay[date]?.bounced || 0,
      }));

      return { timeSeriesData };
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, organizationId: input.organizationId },
        include: {
          organization: {
            include: { members: { where: { userId: ctx.session.user.id } } },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              startedAt: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      const sessions = await ctx.analytics.getSessions({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const pageviews = await ctx.analytics.getPageViews({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const pageviewsBySession = pageviews.reduce(
        (acc, pv) => {
          if (pv.session_id) {
            if (!acc[pv.session_id]) {
              acc[pv.session_id] = [];
            }
            acc[pv.session_id].push({ mobile: pv.mobile });
          }
          return acc;
        },
        {} as Record<string, Array<{ mobile: boolean | null }>>,
      );

      const totalSessions = sessions.length;
      let mobileSessions = 0;
      let desktopSessions = 0;

      for (const s of sessions) {
        const sessionPageviews = pageviewsBySession[s.session_id] || [];
        const isMobile =
          sessionPageviews.some((pv) => pv.mobile) ||
          (s.user_agent
            ? /Mobile|Android|iPhone|iPad/.test(s.user_agent)
            : false);
        if (isMobile) mobileSessions += 1;
        else desktopSessions += 1;
      }

      return { totalSessions, mobileSessions, desktopSessions };
    }),
  getRecent: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(1000).default(10),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to the project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              startedAt: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      const allSessions = await ctx.analytics.getSessions({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT, // Get all sessions for accurate totalCount
      });

      const totalCount = allSessions.length;

      const sessions = allSessions.slice(
        (input.page - 1) * input.limit,
        input.page * input.limit,
      );

      const pageviews = await ctx.analytics.getPageViews({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT, // Get all pageviews for accurate stats
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
        {} as Record<
          string,
          Array<{ id: string; url: string; timestamp: Date }>
        >,
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

      return {
        sessions: sessionsWithPageviews,
        totalCount,
        pagination: {
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(totalCount / input.limit),
          hasNextPage: input.page < Math.ceil(totalCount / input.limit),
          hasPreviousPage: input.page > 1,
        },
      };
    }),
  getById: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        projectId: z.string(),
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to the project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      // Extract project info from the already-fetched project
      const projectInfo = {
        name: project.name,
        domain: project.domain,
      };

      // Get session from ClickHouse - need to find by id first
      // Since ClickHouse uses session_id, we need to query sessions and find by id
      const sessions = await ctx.analytics.getSessions({
        projectId: input.projectId,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const sessionData = sessions.find((s) => s.id === input.sessionId);

      if (!sessionData) {
        throw new Error("Session not found");
      }

      // Get full session with pageviews and events
      const session = await ctx.analytics.getSessionById(
        sessionData.session_id,
        input.projectId,
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
        project: projectInfo,
      };
    }),
  liveUsers: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to the project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      // Clean up stale sessions first (dual-write to both PostgreSQL and ClickHouse)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      await ctx.prisma.trackedSession.updateMany({
        where: {
          projectId: input.projectId,
          endedAt: null,
          startedAt: {
            lt: thirtyMinutesAgo,
          },
        },
        data: {
          endedAt: new Date(),
          duration: 1800, // 30 minutes in seconds
          didBounce: false,
        },
      });

      await ctx.analytics.cleanupStaleSessions(input.projectId);

      // Count active sessions from ClickHouse
      const liveUsers = await ctx.analytics.getLiveUsers(input.projectId);

      return liveUsers;
    }),
  liveUserLocations: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to the project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      // Clean up stale sessions first (dual-write to both PostgreSQL and ClickHouse)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      await ctx.prisma.trackedSession.updateMany({
        where: {
          projectId: input.projectId,
          endedAt: null,
          startedAt: {
            lt: thirtyMinutesAgo,
          },
        },
        data: {
          endedAt: new Date(),
          duration: 1800, // 30 minutes in seconds
          didBounce: false,
        },
      });

      await ctx.analytics.cleanupStaleSessions(input.projectId);

      // Get active sessions with their latest page view location from ClickHouse
      const liveSessionsData = await ctx.analytics.getLiveUserLocations(
        input.projectId,
      );

      // Helper function to validate coordinates
      const isValidCoordinate = (
        lat: number | null,
        lon: number | null,
      ): boolean => {
        if (lat === null || lon === null) return false;
        // Check if coordinates are valid (not 0,0 and within valid ranges)
        // 0,0 is in the Gulf of Guinea and indicates missing/invalid data
        if (lat === 0 && lon === 0) return false;
        // Valid latitude: -90 to 90, Valid longitude: -180 to 180
        return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
      };

      // Helper function to parse browser from userAgent
      const getBrowserFromUserAgent = (userAgent: string | null): string => {
        if (!userAgent) return "Unknown";
        if (userAgent.includes("Chrome") && !userAgent.includes("Edge"))
          return "Chrome";
        if (userAgent.includes("Firefox")) return "Firefox";
        if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
          return "Safari";
        if (userAgent.includes("Edge")) return "Edge";
        return "Other";
      };

      // Helper function to parse device type from userAgent
      const getDeviceTypeFromUserAgent = (userAgent: string | null): string => {
        if (!userAgent) return "Unknown";
        const ua = userAgent.toLowerCase();
        if (
          ua.includes("ipad") ||
          (ua.includes("android") && !ua.includes("mobile"))
        ) {
          return "Tablet";
        }
        if (
          ua.includes("iphone") ||
          ua.includes("ipod") ||
          (ua.includes("android") && ua.includes("mobile")) ||
          ua.includes("mobile")
        ) {
          return "Mobile";
        }
        return "Desktop";
      };

      // Country center coordinates fallback (GeoJSON format: [longitude, latitude])
      // Using coordinates from country-coordinates.json
      const countryCenterCoords: Record<string, [number, number]> = {
        BG: [25, 43], // Bulgaria (Sofia region)
        US: [-95.7129, 37.0902], // United States
        GB: [-3.436, 55.3781], // United Kingdom
        DE: [10.4515, 51.1657], // Germany
        FR: [2.2137, 46.2276], // France
        IT: [12.5674, 41.8719], // Italy
        ES: [-3.7492, 40.4637], // Spain
        NL: [5.2913, 52.1326], // Netherlands
        CA: [-106.3468, 56.1304], // Canada
        AU: [133.7751, -25.2744], // Australia
        // Add more countries as needed - format: [longitude, latitude]
      };

      // Filter to only sessions with valid location data and format as GeoJSON features
      return liveSessionsData
        .map((session) => {
          let coordinates: [number, number] | null = null;
          let city: string | null = null;
          let country: string | null = null;
          let countryCode: string | null = null;

          // Use pageview coordinates if available and valid
          if (
            session.lat !== null &&
            session.lon !== null &&
            isValidCoordinate(session.lat, session.lon)
          ) {
            coordinates = [session.lon, session.lat] as [number, number];
            city = session.city;
            country = session.pageview_country || session.country;
            countryCode = session.pageview_country_code;
          } else if (session.pageview_country_code) {
            // Fallback to country center coordinates
            const countryCodeUpper = session.pageview_country_code.toUpperCase();
            const centerCoords = countryCenterCoords[countryCodeUpper];

            if (centerCoords) {
              coordinates = centerCoords;
              city = session.city;
              country = session.pageview_country || session.country;
              countryCode = session.pageview_country_code;
            } else {
              console.log(
                `No center coordinates for country code: ${countryCodeUpper}`,
              );
            }
          }

          if (!coordinates) {
            return null;
          }

          const userAgent = session.user_agent;
          const browser = getBrowserFromUserAgent(userAgent);
          const deviceType = getDeviceTypeFromUserAgent(userAgent);

          return {
            id: session.id,
            coordinates,
            city,
            country,
            countryCode,
            startedAt: new Date(session.started_at),
            browser,
            deviceType,
          };
        })
        .filter(
          (location): location is NonNullable<typeof location> =>
            location !== null,
        );
    }),
  recentSessions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        since: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if user has access to the project
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      // Get recent sessions (last 30 seconds by default)
      const since = input.since || new Date(Date.now() - 30 * 1000);

      const recentSessions = await ctx.analytics.getRecentSessions(
        input.projectId,
        since,
        10,
      );

      return recentSessions.map((s) => ({
        id: s.id,
        sessionId: s.session_id,
        startedAt: new Date(s.started_at),
        country: s.country,
        city: s.city,
        userAgent: s.user_agent,
        entryPage: s.entry_page,
      }));
    }),
  getJourneys: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, organizationId: input.organizationId },
        include: {
          organization: {
            include: { members: { where: { userId: ctx.session.user.id } } },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      const normalizedStartDate = input.startDate
        ? startOfDay(input.startDate)
        : undefined;
      const normalizedEndDate = input.endDate
        ? endOfDay(input.endDate)
        : undefined;

      const dateFilter =
        normalizedStartDate || normalizedEndDate
          ? {
              startedAt: {
                ...(normalizedStartDate && { gte: normalizedStartDate }),
                ...(normalizedEndDate && { lte: normalizedEndDate }),
              },
            }
          : undefined;

      const journeys = await ctx.analytics.getSessionJourneys(
        input.projectId,
        normalizedStartDate,
        normalizedEndDate,
      );

      // Get pageviews for all sessions to build transitions
      const pageviews = await ctx.analytics.getPageViews({
        projectId: input.projectId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: ANALYTICS_UNLIMITED_QUERY_LIMIT,
      });

      const pageviewsBySession = pageviews.reduce(
        (acc, pv) => {
          if (pv.session_id) {
            if (!acc[pv.session_id]) {
              acc[pv.session_id] = [];
            }
            acc[pv.session_id].push({ url: pv.url, timestamp: pv.timestamp });
          }
          return acc;
        },
        {} as Record<
          string,
          Array<{ url: string; timestamp: string }>
        >,
      );

      const sessions = journeys.map((journey) => ({
        sessionId: journey.session_id,
        entryPage: journey.entry_page,
        exitPage: journey.exit_page,
        pageViewEvents: (pageviewsBySession[journey.session_id] || []).sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        ),
      }));

      function extractPath(url: string): string {
        try {
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          return pathname === "" ? "/" : pathname;
        } catch {
          const match = url.match(/^https?:\/\/[^/]+(\/.*)?$/);
          if (match) {
            return match[1] || "/";
          }
          return url;
        }
      }

      const pageSet = new Set<string>();
      const transitions = new Map<string, Map<string, number>>();

      for (const session of sessions) {
        if (session.pageViewEvents.length === 0) continue;

        const paths = session.pageViewEvents.map((event) =>
          extractPath(event.url),
        );

        const entryPage = paths[0];
        const exitPage = paths[paths.length - 1];

        pageSet.add(entryPage);
        pageSet.add(exitPage);

        for (let i = 0; i < paths.length - 1; i++) {
          const from = paths[i];
          const to = paths[i + 1];
          if (from !== to) {
            pageSet.add(from);
            pageSet.add(to);
            let innerMap = transitions.get(from);
            if (!innerMap) {
              innerMap = new Map<string, number>();
              transitions.set(from, innerMap);
            }
            innerMap.set(to, (innerMap.get(to) || 0) + 1);
          }
        }
      }

      const pages = Array.from(pageSet).sort();
      const nodeMap = new Map<string, number>();
      pages.forEach((page, index) => {
        nodeMap.set(page, index);
      });

      const nodes = pages.map((page) => ({
        name: page === "/" ? "Home" : page,
      }));

      const links: Array<{ source: number; target: number; value: number }> =
        [];
      for (const [from, innerMap] of transitions.entries()) {
        const sourceIndex = nodeMap.get(from);
        if (sourceIndex === undefined) continue;

        for (const [to, value] of innerMap.entries()) {
          const targetIndex = nodeMap.get(to);
          if (targetIndex === undefined || sourceIndex === targetIndex) {
            continue;
          }
          links.push({
            source: sourceIndex,
            target: targetIndex,
            value,
          });
        }
      }

      return { nodes, links };
    }),
  liveTopCountries: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      const liveTopCountries = await ctx.analytics.getLiveTopCountries(
        input.projectId,
      );

      const countryCounts: Record<
        string,
        { country: string; countryCode: string; count: number }
      > = {};

      for (const item of liveTopCountries) {
        const key = item.country_code || item.country || "unknown";
        if (!countryCounts[key]) {
          countryCounts[key] = {
            country: item.country || "Unknown",
            countryCode: item.country_code || "",
            count: 0,
          };
        }
        countryCounts[key].count += item.count;
      }

      return Object.values(countryCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((c) => ({
          country: c.country,
          countryCode: c.countryCode,
          views: c.count,
        }));
    }),
  liveTopPages: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        organizationId: z.string(),
        limit: z.number().default(5),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          organizationId: input.organizationId,
        },
        include: {
          organization: {
            include: {
              members: {
                where: { userId: ctx.session.user.id },
              },
            },
          },
        },
      });

      if (
        !project ||
        !project.organization ||
        project.organization.members.length === 0
      ) {
        throw new Error("Forbidden");
      }

      const liveTopPages = await ctx.analytics.getLiveTopPages(input.projectId);

      const pathCounts: Record<string, number> = {};

      for (const item of liveTopPages) {
        let path = item.url;
        try {
          path = new URL(item.url).pathname;
        } catch {
          // Keep original path if URL parsing fails
        }
        pathCounts[path] = (pathCounts[path] || 0) + item.count;
      }

      return Object.entries(pathCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, input.limit)
        .map(([path, count]) => ({ path, count }));
    }),
});
