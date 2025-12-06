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

      const sessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
        select: {
          startedAt: true,
          didBounce: true,
        },
        orderBy: { startedAt: "asc" },
      });

      const sessionCountsByDay = sessions.reduce(
        (acc, s) => {
          const dateKey = s.startedAt.toISOString().split("T")[0] ?? "";
          if (!acc[dateKey]) {
            acc[dateKey] = { total: 0, engaged: 0, bounced: 0 };
          }
          acc[dateKey].total += 1;
          if (s.didBounce) {
            acc[dateKey].bounced += 1;
          } else {
            acc[dateKey].engaged += 1;
          }
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

      const sessions = await ctx.prisma.trackedSession.findMany({
        where: { projectId: input.projectId, ...(dateFilter && dateFilter) },
        select: {
          id: true,
          startedAt: true,
          userAgent: true,
          pageViewEvents: {
            select: { mobile: true },
            orderBy: { timestamp: "asc" },
          },
        },
      });

      const totalSessions = sessions.length;
      let mobileSessions = 0;
      let desktopSessions = 0;

      for (const s of sessions) {
        const isMobile =
          s.pageViewEvents.some((e) => e.mobile) ||
          (s.userAgent
            ? /Mobile|Android|iPhone|iPad/.test(s.userAgent)
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

      // Get total count for pagination
      const totalCount = await ctx.prisma.trackedSession.count({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
      });

      // Get paginated sessions
      const sessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
        include: {
          pageViewEvents: {
            orderBy: { timestamp: "asc" },
          },
        },
        orderBy: {
          startedAt: "desc",
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });

      return {
        sessions,
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

      // Get session by ID
      const session = await ctx.prisma.trackedSession.findFirst({
        where: {
          id: input.sessionId,
          projectId: input.projectId,
        },
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

      // Clean up stale sessions first
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

      // Count active sessions
      const liveUsers = await ctx.prisma.trackedSession.count({
        where: {
          projectId: input.projectId,
          endedAt: null, // Active sessions only
          startedAt: {
            gte: thirtyMinutesAgo, // Only count sessions started in last 30 minutes
          },
        },
      });

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

      // Clean up stale sessions first
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

      // Get active sessions with their latest page view location
      const liveSessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          endedAt: null, // Active sessions only
          startedAt: {
            gte: thirtyMinutesAgo, // Only count sessions started in last 30 minutes
          },
        },
        include: {
          pageViewEvents: {
            orderBy: { timestamp: "desc" },
            take: 10, // Get recent page views to find one with valid location
          },
        },
      });

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
      return liveSessions
        .map((session) => {
          // Find the most recent page view with valid coordinates
          const pageViewWithLocation = session.pageViewEvents.find((pve) =>
            isValidCoordinate(pve.lat, pve.lon),
          );

          let coordinates: [number, number] | null = null;
          let city: string | null = null;
          let country: string | null = null;
          let countryCode: string | null = null;

          if (pageViewWithLocation) {
            // Use exact coordinates if available
            coordinates = [
              pageViewWithLocation.lon!,
              pageViewWithLocation.lat!,
            ] as [number, number];
            city = pageViewWithLocation.city;
            country = pageViewWithLocation.country;
            countryCode = pageViewWithLocation.countryCode;
          } else {
            // Fallback to country center coordinates if we have country code
            const mostRecentPageView = session.pageViewEvents[0];
            if (mostRecentPageView?.countryCode) {
              const countryCodeUpper =
                mostRecentPageView.countryCode.toUpperCase();
              const centerCoords = countryCenterCoords[countryCodeUpper];

              if (centerCoords) {
                coordinates = centerCoords;
                city = mostRecentPageView.city;
                country = mostRecentPageView.country;
                countryCode = mostRecentPageView.countryCode;
              } else {
                // Log when country code exists but we don't have center coordinates
                console.log(
                  `No center coordinates for country code: ${countryCodeUpper}`,
                );
              }
            }
          }

          if (!coordinates) {
            return null;
          }

          const userAgent = session.userAgent;
          const browser = getBrowserFromUserAgent(userAgent);
          const deviceType = getDeviceTypeFromUserAgent(userAgent);

          return {
            id: session.id,
            coordinates,
            city,
            country,
            countryCode,
            startedAt: session.startedAt,
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

      const recentSessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          startedAt: {
            gte: since,
          },
        },
        select: {
          id: true,
          sessionId: true,
          startedAt: true,
          country: true,
          city: true,
          userAgent: true,
          entryPage: true,
        },
        orderBy: {
          startedAt: "desc",
        },
        take: 10,
      });

      return recentSessions;
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

      const sessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          ...(dateFilter && dateFilter),
        },
        include: {
          pageViewEvents: {
            orderBy: { timestamp: "asc" },
            select: {
              url: true,
            },
          },
        },
      });

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

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const liveSessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          endedAt: null,
          startedAt: {
            gte: thirtyMinutesAgo,
          },
        },
        include: {
          pageViewEvents: {
            orderBy: { timestamp: "desc" },
            take: 1,
            select: {
              country: true,
              countryCode: true,
            },
          },
        },
      });

      const countryCounts: Record<
        string,
        { country: string; countryCode: string; count: number }
      > = {};

      for (const session of liveSessions) {
        const latestPageView = session.pageViewEvents[0];
        if (!latestPageView?.country || !latestPageView?.countryCode) {
          continue;
        }

        const key =
          latestPageView.countryCode || latestPageView.country || "unknown";
        if (!countryCounts[key]) {
          countryCounts[key] = {
            country: latestPageView.country || "Unknown",
            countryCode: latestPageView.countryCode || "",
            count: 0,
          };
        }
        countryCounts[key].count += 1;
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

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const liveSessions = await ctx.prisma.trackedSession.findMany({
        where: {
          projectId: input.projectId,
          endedAt: null,
          startedAt: {
            gte: thirtyMinutesAgo,
          },
        },
        include: {
          pageViewEvents: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });

      const pathCounts: Record<string, number> = {};

      for (const session of liveSessions) {
        const latestPageView = session.pageViewEvents[0];
        if (latestPageView?.url) {
          let path = latestPageView.url;
          try {
            path = new URL(latestPageView.url).pathname;
          } catch {
            // Keep original path if URL parsing fails
          }
          pathCounts[path] = (pathCounts[path] || 0) + 1;
        }
      }

      return Object.entries(pathCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, input.limit)
        .map(([path, count]) => ({ path, count }));
    }),
});
