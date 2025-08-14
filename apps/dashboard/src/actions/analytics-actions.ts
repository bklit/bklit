"use server";

import { prisma } from "@bklit/db/client";
import { unstable_cache as cache } from "next/cache";
import { z } from "zod";
import { cleanupStaleSessions } from "@/actions/session-actions";
import { findCountryCoordinates } from "@/lib/maps/country-coordinates";
import type { BrowserStats, TopPageData } from "@/types/analytics";
import type {
  CityResult,
  CountryCodeResult,
  CountryStats,
  CountryWithCities,
  CountryWithVisits,
  TopCountryData,
  TopCountryResult,
} from "@/types/geo";

const getTopCountriesSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
});

export async function getTopCountries(
  params: z.infer<typeof getTopCountriesSchema>,
) {
  const validation = getTopCountriesSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
          // userId: userId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const topCountries = await prisma.pageViewEvent.groupBy({
        by: ["country", "countryCode"],
        where: {
          projectId,
          country: { not: null },
          countryCode: { not: null },
        },
        _count: {
          country: true,
        },
        orderBy: {
          _count: {
            country: "desc",
          },
        },
        take: 5,
      });

      return topCountries.map(
        (c: TopCountryResult): TopCountryData => ({
          country: c.country || "",
          countryCode: c.countryCode || "",
          views: Number(c._count.country) || 0,
        }),
      );
    },
    [`${projectId}-top-countries`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getAnalyticsStatsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  days: z.number().default(7),
});

export async function getAnalyticsStats(
  params: z.input<typeof getAnalyticsStatsSchema>,
) {
  const validation = getAnalyticsStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId, days } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
          // userId: userId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [totalViews, recentViews, uniquePages, uniqueVisits] =
        await Promise.all([
          prisma.pageViewEvent.count({
            where: { projectId },
          }),
          prisma.pageViewEvent.count({
            where: {
              projectId,
              timestamp: {
                gte: startDate,
              },
            },
          }),
          prisma.pageViewEvent.findMany({
            where: { projectId },
            distinct: ["url"],
            select: { url: true },
          }),
          prisma.pageViewEvent.findMany({
            where: {
              projectId,
              ip: { not: null },
            },
            distinct: ["ip"],
            select: { ip: true },
          }),
        ]);

      return {
        totalViews,
        recentViews,
        uniquePages: uniquePages.length,
        uniqueVisits: uniqueVisits.length,
      };
    },
    [`${projectId}-analytics-stats`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getRecentPageViewsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  limit: z.number().default(5),
});

export async function getRecentPageViews(
  params: z.input<typeof getRecentPageViewsSchema>,
) {
  const validation = getRecentPageViewsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId, limit } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
          // userId: userId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      const recentViews = await prisma.pageViewEvent.findMany({
        where: {
          projectId,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: limit,
      });

      return recentViews;
    },
    [`${projectId}-recent-page-views`],
    {
      revalidate: 60, // 1 minute
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getVisitsByCountrySchema = z.object({
  projectId: z.string(),
  userId: z.string(),
});

export async function getVisitsByCountry(
  params: z.infer<typeof getVisitsByCountrySchema>,
) {
  const validation = getVisitsByCountrySchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
          // userId: userId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      // Get all countries with visits
      const countriesWithVisits = await prisma.pageViewEvent.groupBy({
        by: ["country", "countryCode", "lat", "lon"],
        where: {
          projectId,
          country: { not: null },
          countryCode: { not: null },
        },
        _count: {
          country: true,
        },
      });

      // Get city breakdown for each country
      const countriesWithCities = await Promise.all(
        countriesWithVisits.map(
          async (country: CountryWithVisits): Promise<CountryWithCities> => {
            const cities = await prisma.pageViewEvent.groupBy({
              by: ["city"],
              where: {
                projectId,
                country: country.country,
                city: { not: null },
              },
              _count: {
                city: true,
              },
              orderBy: {
                _count: {
                  city: "desc",
                },
              },
            });

            return {
              country: country.country || "",
              countryCode: country.countryCode || "",
              totalVisits: country._count.country,
              coordinates:
                country.lat && country.lon
                  ? ([country.lon, country.lat] as [number, number])
                  : null,
              cities: cities.map((city: CityResult) => ({
                name: city.city || "",
                visits: city._count.city,
              })),
            };
          },
        ),
      );

      return countriesWithCities.filter(
        (country) => country.coordinates !== null,
      );
    },
    [`${projectId}-visits-by-country`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getCountryVisitStatsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
});

export async function getCountryVisitStats(
  params: z.infer<typeof getCountryVisitStatsSchema>,
) {
  const validation = getCountryVisitStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
          // userId: userId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      // Get all countries with visits, grouped by country
      const countriesWithVisits = await prisma.pageViewEvent.groupBy({
        by: ["country", "countryCode"],
        where: {
          projectId,
          country: { not: null },
          countryCode: { not: null },
        },
        _count: {
          country: true,
        },
      });

      // Get detailed stats for each country
      const countriesWithStats = await Promise.all(
        countriesWithVisits.map(
          async (country: TopCountryResult): Promise<CountryStats> => {
            const countryCode = country.countryCode || "";
            const coordinates = findCountryCoordinates(countryCode);

            // Debug logging to see what country codes we're getting
            if (!coordinates) {
              throw new Error(
                `No coordinates found for country code: ${countryCode}, country: ${country.country}`,
              );
            }

            // Get mobile vs desktop breakdown
            const mobileVisits = await prisma.pageViewEvent.count({
              where: {
                projectId,
                country: country.country,
                mobile: true,
              },
            });

            const desktopVisits = await prisma.pageViewEvent.count({
              where: {
                projectId,
                country: country.country,
                mobile: false,
              },
            });

            // Get unique visits by IP
            const uniqueVisits = await prisma.pageViewEvent.groupBy({
              by: ["ip"],
              where: {
                projectId,
                country: country.country,
                ip: { not: null },
              },
              _count: {
                ip: true,
              },
            });

            return {
              country: country.country || "",
              countryCode,
              totalVisits: Number(country._count.country) || 0,
              mobileVisits: Number(mobileVisits) || 0,
              desktopVisits: Number(desktopVisits) || 0,
              uniqueVisits: Number(uniqueVisits.length) || 0,
              coordinates: coordinates
                ? ([coordinates.longitude, coordinates.latitude] as [
                    number,
                    number,
                  ])
                : null,
            };
          },
        ),
      );

      // Debug: Log all countries and their coordinate status
      // console.log(
      //   "Countries with visits:",
      //   countriesWithStats.map((c) => ({
      //     country: c.country,
      //     countryCode: c.countryCode,
      //     hasCoordinates: c.coordinates !== null,
      //     totalVisits: c.totalVisits,
      //   }))
      // );

      // Temporarily return all countries to debug (including those without coordinates)
      const result = countriesWithStats.sort(
        (a, b) => b.totalVisits - a.totalVisits,
      );

      console.log(
        "Final result:",
        result.map((c: CountryStats) => ({
          country: c.country,
          countryCode: c.countryCode,
          hasCoordinates: c.coordinates !== null,
          totalVisits: c.totalVisits,
        })),
      );

      return result;
    },
    [`${projectId}-country-visit-stats`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

export async function debugCountryCodes(
  params: z.infer<typeof getCountryVisitStatsSchema>,
) {
  const validation = getCountryVisitStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId } = validation.data;

  const site = await prisma.project.findFirst({
    where: {
      id: projectId,
      // userId: userId,
    },
  });

  if (!site) {
    throw new Error("Site not found or access denied");
  }

  // Get all unique country codes from the database
  const uniqueCountryCodes = await prisma.pageViewEvent.groupBy({
    by: ["country", "countryCode"],
    where: {
      projectId,
      country: { not: null },
      countryCode: { not: null },
    },
    _count: {
      countryCode: true,
    },
  });

  console.log(
    "Unique country codes in database:",
    uniqueCountryCodes.map((c: CountryCodeResult) => ({
      country: c.country,
      countryCode: c.countryCode,
      count: c._count.countryCode,
    })),
  );

  return uniqueCountryCodes;
}

const getMobileDesktopStatsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
});

export async function getMobileDesktopStats(
  params: z.infer<typeof getMobileDesktopStatsSchema>,
) {
  const validation = getMobileDesktopStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
          // userId: userId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      // Get unique mobile visits by IP
      const uniqueMobileVisits = await prisma.pageViewEvent.groupBy({
        by: ["ip"],
        where: {
          projectId,
          mobile: true,
          ip: { not: null },
        },
        _count: {
          ip: true,
        },
      });

      // Get unique desktop visits by IP
      const uniqueDesktopVisits = await prisma.pageViewEvent.groupBy({
        by: ["ip"],
        where: {
          projectId,
          mobile: false,
          ip: { not: null },
        },
        _count: {
          ip: true,
        },
      });

      return {
        mobile: uniqueMobileVisits.length,
        desktop: uniqueDesktopVisits.length,
      };
    },
    [`${projectId}-mobile-desktop-stats`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getTopPagesSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  limit: z.number().default(5),
});

export async function getTopPages(params: z.input<typeof getTopPagesSchema>) {
  const validation = getTopPagesSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId, limit } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
          // userId: userId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      // Fetch all page view events for the site
      const events = await prisma.pageViewEvent.findMany({
        where: { projectId },
        select: { url: true },
      });

      // Count occurrences by pathname
      const pathCounts: Record<string, number> = {};
      for (const event of events) {
        let path = event.url;
        try {
          path = new URL(event.url).pathname;
        } catch {}
        pathCounts[path] = (pathCounts[path] || 0) + 1;
      }

      // Sort and take top N
      const topPages = Object.entries(pathCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([path, count]): TopPageData => ({ path, count }));

      return topPages;
    },
    [`${projectId}-top-pages`],
    {
      revalidate: 60, // 1 minute
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getBrowserStatsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
});

export async function getBrowserStats(
  params: z.infer<typeof getBrowserStatsSchema>,
) {
  const validation = getBrowserStatsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
          // userId: userId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      // Get all page views with user agent data
      const pageViews = await prisma.pageViewEvent.findMany({
        where: {
          projectId,
          userAgent: { not: null },
        },
        select: {
          userAgent: true,
        },
      });

      // Parse user agents to extract browser information
      const browserStats: Record<string, number> = {};

      pageViews.forEach((view: { userAgent: string | null }) => {
        const userAgent = view.userAgent || "";
        let browser = "Unknown";

        // Simple browser detection logic
        if (userAgent.includes("Chrome")) {
          browser = "Chrome";
        } else if (userAgent.includes("Firefox")) {
          browser = "Firefox";
        } else if (
          userAgent.includes("Safari") &&
          !userAgent.includes("Chrome")
        ) {
          browser = "Safari";
        } else if (userAgent.includes("Edge")) {
          browser = "Edge";
        } else if (userAgent.includes("Opera")) {
          browser = "Opera";
        } else if (
          userAgent.includes("MSIE") ||
          userAgent.includes("Trident")
        ) {
          browser = "Internet Explorer";
        }

        browserStats[browser] = (browserStats[browser] || 0) + 1;
      });

      // Convert to array format for easier consumption
      const browserData = Object.entries(browserStats)
        .map(([browser, count]): BrowserStats => ({ browser, count }))
        .sort((a, b) => b.count - a.count);

      return browserData;
    },
    [`${projectId}-browser-stats`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getSessionAnalyticsSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  days: z.number().default(30),
});

export async function getSessionAnalytics(
  params: z.input<typeof getSessionAnalyticsSchema>,
) {
  const validation = getSessionAnalyticsSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId, days } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
          // userId: userId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

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
      const bouncedSessions = sessions.filter((s) => s.didBounce).length;
      const bounceRate =
        totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

      const avgSessionDuration =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) /
            sessions.length
          : 0;

      const avgPageViews =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.pageViewEvents.length, 0) /
            sessions.length
          : 0;

      return {
        totalSessions,
        bouncedSessions,
        bounceRate: Math.round(bounceRate * 100) / 100,
        avgSessionDuration: Math.round(avgSessionDuration),
        avgPageViews: Math.round(avgPageViews * 100) / 100,
        recentSessions: sessions.slice(0, 5), // Return last 5 sessions for display
      };
    },
    [`${projectId}-session-analytics`],
    {
      revalidate: 300, // 5 minutes
      tags: [`${projectId}-analytics`],
    },
  )();
}

const getLiveUsersSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
});

export async function getLiveUsers(params: z.infer<typeof getLiveUsersSchema>) {
  const validation = getLiveUsersSchema.safeParse(params);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { projectId, userId } = validation.data;

  return await cache(
    async () => {
      const site = await prisma.project.findFirst({
        where: {
          id: projectId,
          // userId: userId,
        },
      });

      if (!site) {
        throw new Error("Site not found or access denied");
      }

      // Clean up stale sessions first
      await cleanupStaleSessions();

      // Count active sessions (sessions that haven't ended)
      // Exclude sessions older than 30 minutes to avoid counting stale sessions
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const liveUsers = await prisma.trackedSession.count({
        where: {
          projectId,
          endedAt: null, // Active sessions only
          startedAt: {
            gte: thirtyMinutesAgo, // Only count sessions started in last 30 minutes
          },
        },
      });

      return liveUsers;
    },
    [`${projectId}-live-users`],
    {
      revalidate: 30, // 30 seconds - more frequent updates for live data
      tags: [`${projectId}-analytics`],
    },
  )();
}
